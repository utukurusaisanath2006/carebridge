import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const rawUrl = import.meta.env.VITE_API_URL || '/api';
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const IDLE_WARNING_MS = 14 * 60 * 1000; // 14 minutes (1 min warning)

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [token, setToken] = useState(null); // IN-MEMORY ONLY - never in localStorage
  const [loading, setLoading] = useState(true);
  const [idleWarning, setIdleWarning] = useState(false);
  const tokenRef = useRef(null);
  tokenRef.current = token;

  const refreshTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const idleWarningTimerRef = useRef(null);

  // Authenticated fetch wrapper that attaches Bearer header and handles 401
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (tokenRef.current) {
      headers.set('Authorization', `Bearer ${tokenRef.current}`);
    }
    const config = {
      ...options,
      headers,
      credentials: 'include' // Send HttpOnly cookies as well
    };

    let res = await fetch(url, config);

    // If 401, attempt silent refresh once
    if (res.status === 401 && tokenRef.current) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setToken(refreshData.access_token);
          tokenRef.current = refreshData.access_token;
          setUser(refreshData.user);
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${refreshData.access_token}`);
          return await fetch(url, { ...config, headers });
        } else {
          // Refresh failed -> clear session
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        setUser(null);
        setToken(null);
      }
    }
    return res;
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: tokenRef.current ? { 'Authorization': `Bearer ${tokenRef.current}` } : {}
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      tokenRef.current = null;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);
      setIdleWarning(false);
    }
  }, []);

  // Schedule proactive token refresh 5 minutes before expiry
  const scheduleTokenRefresh = useCallback((expiresInSeconds) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresInSeconds - 300) * 1000, 30000); // 5 min before or at least 30s
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          tokenRef.current = data.access_token;
          setUser(data.user);
          scheduleTokenRefresh(data.expires_in || 3600);
        }
      } catch (err) {
        console.warn('[Care Bridge Auth] Silent refresh failed:', err);
      }
    }, delay);
  }, []);

  // Reset idle timers on user activity
  const resetIdleTimers = useCallback(() => {
    if (!tokenRef.current) return;
    setIdleWarning(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);

    idleWarningTimerRef.current = setTimeout(() => {
      setIdleWarning(true);
    }, IDLE_WARNING_MS);

    idleTimerRef.current = setTimeout(() => {
      console.warn('[Care Bridge Auth] Session timed out due to 15m inactivity.');
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimers();

    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);
    };
  }, [resetIdleTimers]);

  // Login handler
  const login = useCallback(async (username, password, rememberMe = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          remember_me: rememberMe
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      setToken(data.access_token);
      tokenRef.current = data.access_token;
      setUser(data.user);
      scheduleTokenRefresh(data.expires_in || 3600);
      resetIdleTimers();
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  }, [scheduleTokenRefresh, resetIdleTimers]);

  // Check existing session on app startup (via HttpOnly cookie or /auth/me)
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setToken(data.access_token);
          tokenRef.current = data.access_token;
          setUser(data.user);
          scheduleTokenRefresh(data.expires_in || 3600);
          resetIdleTimers();
        }
      } catch (e) {
        // Not authenticated
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();
    return () => { isMounted = false; };
  }, [scheduleTokenRefresh, resetIdleTimers]);

  // Fetch patient profile if logged in as PATIENT
  const fetchPatientProfile = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/patients/me`);
      if (res.ok) {
        const data = await res.json();
        setPatientProfile(data);
        return data;
      }
    } catch (e) {
      console.warn('[Care Bridge Auth] Failed to fetch patient profile:', e);
    }
    return null;
  }, [authFetch]);

  useEffect(() => {
    if (user?.role === 'PATIENT' && token) {
      fetchPatientProfile();
    } else if (user?.role !== 'PATIENT') {
      setPatientProfile(null);
    }
  }, [user, token, fetchPatientProfile]);

  // Register patient handler
  const registerPatient = useCallback(async (registrationData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registrationData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please check the details provided.');
      }
      setToken(data.access_token);
      tokenRef.current = data.access_token;
      setUser(data.user);
      setPatientProfile(data.patient);
      scheduleTokenRefresh(data.expires_in || 3600);
      resetIdleTimers();
      return { success: true, user: data.user, patient: data.patient };
    } finally {
      setLoading(false);
    }
  }, [scheduleTokenRefresh, resetIdleTimers]);

  // Update patient profile handler
  const updatePatientProfile = useCallback(async (updates) => {
    const res = await authFetch(`${API_BASE}/patients/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update patient profile');
    }
    setPatientProfile(data);
    return data;
  }, [authFetch]);

  // Delete patient account & data handler
  const deletePatientData = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/patients/me`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete account');
    }
    await logout();
    return { success: true };
  }, [authFetch, logout]);

  // Change password handler
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update password');
    }
    return data;
  }, [authFetch]);

  // Role permissions
  const role = user?.role || null;
  const isAuthenticated = !!user;
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'OPERATOR';
  const isViewer = role === 'VIEWER';
  const isPatient = role === 'PATIENT';
  const canEditSettings = isAdmin || isOperator;
  const canReview = isAdmin || isOperator;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isOperator,
        isViewer,
        isPatient,
        patientProfile,
        setPatientProfile,
        fetchPatientProfile,
        registerPatient,
        updatePatientProfile,
        deletePatientData,
        canEditSettings,
        canReview,
        idleWarning,
        setIdleWarning,
        login,
        logout,
        changePassword,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
