import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { playCriticalNotificationChime, playWarningNotificationChime } from '../utils/alarmSound';

const rawUrl = import.meta.env.VITE_API_URL || '/api';
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token, isAuthenticated, authFetch } = useAuth();
  const { settings, t } = useSettings();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalUnacknowledgedCount, setCriticalUnacknowledgedCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  const eventSourceRef = useRef(null);
  const pollTimerRef = useRef(null);
  const repeatingAlarmRef = useRef(null);
  const titleFlashIntervalRef = useRef(null);
  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'Care Bridge');

  // Check if current time is within quiet hours
  const isQuietHours = useCallback(() => {
    if (!settings.quiet_hours_enabled) return false;
    const now = new Date();
    const [startH, startM] = (settings.quiet_hours_start || '22:00').split(':').map(Number);
    const [endH, endM] = (settings.quiet_hours_end || '07:00').split(':').map(Number);
    const curMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      return curMins >= startMins && curMins < endMins;
    } else {
      // Over midnight
      return curMins >= startMins || curMins < endMins;
    }
  }, [settings.quiet_hours_enabled, settings.quiet_hours_start, settings.quiet_hours_end]);

  // Handle incoming notification event
  const handleIncomingNotification = useCallback((notif) => {
    setNotifications((prev) => {
      // Avoid duplicate by ID
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });

    setUnreadCount((c) => c + 1);

    const isCrit = notif.severity === 'critical';
    if (isCrit) {
      setCriticalUnacknowledgedCount((c) => c + 1);
      // Persistent red toast for critical alerts
      setActiveToast({
        id: notif.id,
        severity: notif.severity,
        title_code: notif.title_code,
        params: notif.params,
        timestamp: notif.created_at
      });
    }

    // Sound logic: critical bypasses quiet hours; warning respects quiet hours
    const soundAllowed = settings.notification_sound !== false;
    if (soundAllowed) {
      if (isCrit) {
        playCriticalNotificationChime();
      } else if (!isQuietHours() && notif.severity === 'warning') {
        playWarningNotificationChime();
      }
    }

    // Native Browser Notification
    if (
      settings.notification_browser_push !== false &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const titleText = t(notif.title_code, notif.params, notif.title_code);
        new Notification(`Care Bridge Alert: ${isCrit ? 'CRITICAL' : notif.severity.toUpperCase()}`, {
          body: titleText,
          icon: '/favicon.ico',
          tag: notif.id,
          requireInteraction: isCrit
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }, [settings.notification_sound, settings.notification_browser_push, isQuietHours, t]);

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) return;
    try {
      const params = new URLSearchParams();
      if (options.unreadOnly) params.append('unread_only', 'true');
      if (options.severity) params.append('severity', options.severity);
      if (options.typeFilter) params.append('type_filter', options.typeFilter);
      if (options.limit) params.append('limit', options.limit);

      const res = await authFetch(`${API_BASE}/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);
        setCriticalUnacknowledgedCount(data.critical_unacknowledged_count || 0);
      }
    } catch (e) {
      console.warn('[Care Bridge Notif] Fetch failed:', e);
    }
  }, [isAuthenticated, authFetch]);

  // Server-Sent Events (SSE) setup with auto-reconnect
  useEffect(() => {
    if (!isAuthenticated) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Initial fetch
    fetchNotifications();

    let sseUrl = `${API_BASE}/notifications/stream`;
    if (token) {
      sseUrl += `?token=${encodeURIComponent(token)}`;
    }

    let es = null;
    let reconnectTimeout = null;
    let backoff = 1000;

    const connectSSE = () => {
      try {
        es = new EventSource(sseUrl, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
          backoff = 1000;
        };

        es.addEventListener('connected', (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (typeof data.unread_count === 'number') {
              setUnreadCount(data.unread_count);
            }
            if (typeof data.critical_unacknowledged_count === 'number') {
              setCriticalUnacknowledgedCount(data.critical_unacknowledged_count);
            }
          } catch (e) {}
        });

        es.addEventListener('notification', (evt) => {
          try {
            const notif = JSON.parse(evt.data);
            handleIncomingNotification(notif);
          } catch (e) {}
        });

        es.onerror = () => {
          setIsConnected(false);
          if (es) es.close();
          // Exponential backoff reconnect
          reconnectTimeout = setTimeout(() => {
            backoff = Math.min(backoff * 2, 15000);
            connectSSE();
          }, backoff);
        };
      } catch (err) {
        console.warn('[Care Bridge SSE] Init failed:', err);
      }
    };

    connectSSE();

    // 15-second polling fallback to guarantee notification delivery
    pollTimerRef.current = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isAuthenticated, token, fetchNotifications, handleIncomingNotification]);

  // Repeating reminder chime every 30s for critical unacknowledged alerts
  useEffect(() => {
    if (criticalUnacknowledgedCount > 0 && settings.notification_sound !== false) {
      repeatingAlarmRef.current = setInterval(() => {
        playCriticalNotificationChime();
      }, 30000);
    } else {
      if (repeatingAlarmRef.current) clearInterval(repeatingAlarmRef.current);
    }
    return () => {
      if (repeatingAlarmRef.current) clearInterval(repeatingAlarmRef.current);
    };
  }, [criticalUnacknowledgedCount, settings.notification_sound]);

  // Flashing document tab title when unread notifications exist
  useEffect(() => {
    if (unreadCount > 0) {
      let isAlt = false;
      titleFlashIntervalRef.current = setInterval(() => {
        document.title = isAlt ? `(${unreadCount}) Care Bridge` : 'Care Bridge – Follow-up Coordinator';
        isAlt = !isAlt;
      }, 1500);
    } else {
      if (titleFlashIntervalRef.current) clearInterval(titleFlashIntervalRef.current);
      document.title = originalTitleRef.current;
    }
    return () => {
      if (titleFlashIntervalRef.current) clearInterval(titleFlashIntervalRef.current);
      document.title = originalTitleRef.current;
    };
  }, [unreadCount]);

  // Action: Mark single notification read
  const markAsRead = useCallback(async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (e) {
      console.warn('Mark read failed:', e);
    }
  }, [authFetch]);

  // Action: Mark all read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
      if (res.ok) {
        const now = new Date().toISOString();
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
        setUnreadCount(0);
        setActiveToast(null);
      }
    } catch (e) {
      console.warn('Mark all read failed:', e);
    }
  }, [authFetch]);

  // Action: Acknowledge alert (stops repeating reminder)
  const acknowledgeAlert = useCallback(async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/${id}/acknowledge`, { method: 'POST' });
      if (res.ok) {
        const ackData = await res.json();
        const updated = ackData.notification;
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, acknowledged_by: updated.acknowledged_by, read_at: updated.read_at } : n))
        );
        setCriticalUnacknowledgedCount((c) => Math.max(0, c - 1));
        if (activeToast && activeToast.id === id) {
          setActiveToast(null);
        }
      }
    } catch (e) {
      console.warn('Acknowledge failed:', e);
    }
  }, [authFetch, activeToast]);

  // Simulation triggers for judges / demo
  const simulateEscalation = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/simulate-escalation`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        handleIncomingNotification(data.notification);
      }
    } catch (e) {
      console.warn('Simulate escalation failed:', e);
    }
  }, [authFetch, handleIncomingNotification]);

  const simulateMissedDose = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/simulate-missed-dose`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        handleIncomingNotification(data.notification);
      }
    } catch (e) {
      console.warn('Simulate missed dose failed:', e);
    }
  }, [authFetch, handleIncomingNotification]);

  const sendTestNotification = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/notifications/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        handleIncomingNotification(data.notification);
      }
    } catch (e) {
      console.warn('Test notification failed:', e);
    }
  }, [authFetch, handleIncomingNotification]);

  // Request browser notification permission with native API
  const requestBrowserPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      return perm === 'granted';
    }
    return false;
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        criticalUnacknowledgedCount,
        isConnected,
        activeToast,
        setActiveToast,
        browserPermission,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        acknowledgeAlert,
        simulateEscalation,
        simulateMissedDose,
        sendTestNotification,
        requestBrowserPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
