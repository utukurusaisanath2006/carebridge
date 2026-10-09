import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../components/LoginPage';
import NotificationBellDropdown from '../components/NotificationBellDropdown';
import Sidebar from '../components/Sidebar';
import PatientWelcome from '../components/PatientWelcome';
import PatientProfileView from '../components/PatientProfileView';
import OperatorPatientsView from '../components/OperatorPatientsView';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Care Bridge Auth and Notification Tests', () => {
  let container = null;
  let root = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  const mockSettings = {
    settings: {
      enabled_languages: ['en', 'hi', 'ta'],
      ui_language: 'en'
    },
    supportedLanguages: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
    ],
    t: (key, params, fallback) => {
      if (params && typeof fallback === 'string') {
        let res = fallback;
        Object.entries(params).forEach(([k, v]) => {
          res = res.replace(`{{${k}}}`, v);
        });
        return res;
      }
      return fallback || key;
    },
    updateSettings: vi.fn(),
    setUiLanguage: vi.fn()
  };

  const mockNotifContext = {
    notifications: [
      {
        id: 'n1',
        title_code: 'notif.escalationCreated',
        params: { task_name: 'Metformin review' },
        severity: 'CRITICAL',
        is_read: false,
        acknowledged: false,
        timestamp: new Date().toISOString()
      },
      {
        id: 'n2',
        title_code: 'notif.missedDose',
        params: { task_name: 'Amlodipine morning' },
        severity: 'WARNING',
        is_read: true,
        acknowledged: true,
        timestamp: new Date().toISOString()
      }
    ],
    unreadCount: 1,
    criticalCount: 1,
    streamActive: true,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    acknowledgeAlert: vi.fn()
  };

  it('ProtectedRoute renders fallback or access denied when role not allowed', () => {
    const mockAuth = {
      isAuthenticated: true,
      role: 'VIEWER',
      user: { username: 'caregiver', role: 'VIEWER', name: 'Caregiver' },
      loading: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <ProtectedRoute requiredRoles={['ADMIN', 'OPERATOR']}>
              <div id="protected-content">Secret Admin Area</div>
            </ProtectedRoute>
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    expect(container.textContent).toContain('Access Restricted');
    expect(container.querySelector('#protected-content')).toBeNull();
  });

  it('ProtectedRoute renders children when user has required role', () => {
    const mockAuth = {
      isAuthenticated: true,
      role: 'OPERATOR',
      user: { username: 'operator', role: 'OPERATOR', name: 'Dr. Ramesh' },
      loading: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <ProtectedRoute requiredRoles={['ADMIN', 'OPERATOR']}>
              <div id="protected-content">Clinical Area</div>
            </ProtectedRoute>
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    expect(container.querySelector('#protected-content')).not.toBeNull();
    expect(container.textContent).toContain('Clinical Area');
  });

  it('LoginPage renders split layout with demo fill cards for operator, admin, caregiver and patients', () => {
    const mockAuth = {
      login: vi.fn(),
      registerPatient: vi.fn(),
      loading: false,
      isAuthenticated: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <LoginPage />
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    // Check brand and form
    expect(container.textContent).toContain('CareBridge');
    expect(container.textContent).toContain('Sign in to Coordinator');
    // Check demo accounts
    expect(container.textContent).toContain('Nurse Joy');
    expect(container.textContent).toContain('Admin Sharma');
    expect(container.textContent).toContain('Caregiver Sunita');
    expect(container.textContent).toContain('Ramesh Kumar');
    expect(container.textContent).toContain('Sunitha Kmare');
  });

  it('LoginPage switches to Patient Registration stepper and enforces step validation', () => {
    const mockAuth = {
      login: vi.fn(),
      registerPatient: vi.fn(),
      loading: false,
      isAuthenticated: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <LoginPage />
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    // Switch to Register tab
    const registerTabBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Patient Registration')
    );
    expect(registerTabBtn).toBeDefined();

    act(() => {
      registerTabBtn.click();
    });

    // Should now see step 1
    expect(container.textContent).toContain('Patient Care Registration');
    expect(container.textContent).toContain('1. Account');

    // Try clicking next on Step 1 with empty inputs
    const nextBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Next: Patient Details')
    );
    expect(nextBtn).toBeDefined();

    act(() => {
      nextBtn.click();
    });

    // Expect validation message
    expect(container.textContent).toContain('Username must be at least 3 characters');

    // Fill Step 1 valid data
    const usernameInput = container.querySelector('#reg-username');
    const passwordInput = container.querySelector('#reg-password');
    const confirmPwInput = container.querySelector('#reg-confirm-pw');
    const mobileInput = container.querySelector('#reg-mobile');

    act(() => {
      setInputValue(usernameInput, 'anita_verma');
      setInputValue(passwordInput, 'Secret@123');
      setInputValue(confirmPwInput, 'Secret@123');
      setInputValue(mobileInput, '9876543210');
    });

    // Now proceed to Step 2
    act(() => {
      nextBtn.click();
    });

    // Should see Step 2 fields
    expect(container.textContent).toContain('Full Patient Name');
    expect(container.textContent).toContain('Known Drug/Food Allergies');

    // Click Back to verify draft preservation
    const backBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Back')
    );
    expect(backBtn).toBeDefined();

    act(() => {
      backBtn.click();
    });

    // Username should still be preserved
    expect(container.querySelector('#reg-username').value).toBe('anita_verma');
  });

  it('Sidebar renders patient-specific navigation and hides clinician sections for PATIENT role', () => {
    const mockAuthPatient = {
      isPatient: true,
      isViewer: false,
      canEditSettings: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuthPatient}>
          <SettingsContext.Provider value={mockSettings}>
            <NotificationContext.Provider value={mockNotifContext}>
              <Sidebar
                activeView="welcome"
                setActiveView={vi.fn()}
                escalationCount={0}
                safetyFlagCount={0}
                isFallback={false}
                aiModel="claude-sonnet-4-6"
              />
            </NotificationContext.Provider>
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    // Patient items must be visible
    expect(container.textContent).toContain('Care Portal');
    expect(container.textContent).toContain('New Intake');
    expect(container.textContent).toContain('Care Plan');
    expect(container.textContent).toContain('Care Schedule');
    expect(container.textContent).toContain('Adherence Tracker');
    expect(container.textContent).toContain('My Profile');

    // Clinician items must be HIDDEN
    expect(container.textContent).not.toContain('Escalations');
    expect(container.textContent).not.toContain('Audit & Safety');
    expect(container.textContent).not.toContain('Notifications');
    expect(container.textContent).not.toContain('Language Settings');
  });

  it('Sidebar renders Patients Directory for OPERATOR role', () => {
    const mockAuthOperator = {
      isPatient: false,
      isViewer: false,
      canEditSettings: false
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuthOperator}>
          <SettingsContext.Provider value={mockSettings}>
            <NotificationContext.Provider value={mockNotifContext}>
              <Sidebar
                activeView="dashboard"
                setActiveView={vi.fn()}
                escalationCount={2}
                safetyFlagCount={1}
                isFallback={false}
                aiModel="claude-sonnet-4-6"
              />
            </NotificationContext.Provider>
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    expect(container.textContent).toContain('Care Dashboard');
    expect(container.textContent).toContain('Patients Directory');
    expect(container.textContent).toContain('Escalations');
    expect(container.textContent).toContain('Audit & Safety');
  });

  it('PatientWelcome renders personalized greeting and clinical overview', () => {
    const mockAuth = {
      user: { name: 'Ramesh Kumar', role: 'PATIENT' },
      patientProfile: {
        full_name: 'Ramesh Kumar',
        uhid: 'UHID-2026-9041',
        age: 58,
        sex: 'Male',
        allergies: ['Penicillin'],
        chronic_conditions: ['Type 2 Diabetes', 'Hypertension'],
        current_medicines: ['Metformin 500mg'],
        caregiver: { name: 'Sunita Kumar', relationship: 'Spouse' }
      }
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <PatientWelcome onNavigate={vi.fn()} />
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    expect(container.textContent).toContain('Hello Ramesh Kumar');
    expect(container.textContent).toContain('UHID-2026-9041');
    expect(container.textContent).toContain('Penicillin');
    expect(container.textContent).toContain('Type 2 Diabetes');
    expect(container.textContent).toContain('Metformin 500mg');
    expect(container.textContent).toContain('Start Discharge Intake');
  });

  it('OperatorPatientsView renders patients and filters by search keyword', async () => {
    const mockPatients = [
      {
        id: 'p1',
        full_name: 'Ramesh Kumar',
        uhid: 'UHID-2026-9041',
        mobile: '******3210',
        age: 58,
        sex: 'Male',
        preferred_language: 'en',
        allergies: ['Penicillin'],
        chronic_conditions: ['Diabetes'],
        current_medicines: ['Metformin'],
        caregiver: { name: 'Sunita' }
      },
      {
        id: 'p2',
        full_name: 'Sunitha Kmare',
        uhid: 'UHID-2026-4412',
        mobile: '******2345',
        age: 46,
        sex: 'Female',
        preferred_language: 'ta',
        allergies: ['Sulfa drugs'],
        chronic_conditions: ['Asthma'],
        current_medicines: ['Salbutamol'],
        caregiver: { name: 'Kiran' }
      }
    ];

    const mockAuth = {
      authFetch: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPatients
      })
    };

    await act(async () => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <OperatorPatientsView onSelectPatient={vi.fn()} />
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    // Should display both patients
    expect(container.textContent).toContain('Ramesh Kumar');
    expect(container.textContent).toContain('Sunitha Kmare');
    expect(container.textContent).toContain('******3210');
    expect(container.textContent).toContain('******2345');

    // Search filter
    const searchInput = container.querySelector('input');
    act(() => {
      setInputValue(searchInput, 'Sunitha');
    });

    expect(container.textContent).toContain('Sunitha Kmare');
    expect(container.textContent).not.toContain('Ramesh Kumar');
  });

  it('NotificationBellDropdown shows unread count and notification list', () => {
    act(() => {
      root.render(
        <SettingsContext.Provider value={mockSettings}>
          <NotificationContext.Provider value={mockNotifContext}>
            <NotificationBellDropdown onNavigateAll={vi.fn()} onSelectTask={vi.fn()} />
          </NotificationContext.Provider>
        </SettingsContext.Provider>
      );
    });

    // Bell should display unread badge '1'
    const badge = container.querySelector('.bg-red-500');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('1');

    // Click bell button to open dropdown
    const bellBtn = container.querySelector('button');
    act(() => {
      bellBtn.click();
    });

    // Dropdown should be open and display notifications
    expect(container.textContent).toContain('Notifications');
    expect(container.textContent).toContain('Mark all read');
  });

  it('PatientProfileView renders profile fields and DPDP Act deletion section', () => {
    const mockAuth = {
      user: { name: 'Ramesh Kumar', role: 'PATIENT' },
      patientProfile: {
        full_name: 'Ramesh Kumar',
        uhid: 'UHID-2026-9041',
        age: 58,
        sex: 'Male',
        mobile: '9876543210',
        email: 'ramesh@example.com',
        preferred_language: 'en',
        allergies: ['Penicillin'],
        chronic_conditions: ['Type 2 Diabetes'],
        current_medicines: ['Metformin 500mg'],
        reminder_times: {
          morning: '08:00',
          afternoon: '13:00',
          evening: '18:00',
          night: '21:00'
        },
        caregiver: { name: 'Sunita Kumar', relationship: 'Spouse', mobile: '9876543211' }
      },
      updatePatientProfile: vi.fn(),
      deletePatientData: vi.fn(),
      changePassword: vi.fn()
    };

    act(() => {
      root.render(
        <AuthContext.Provider value={mockAuth}>
          <SettingsContext.Provider value={mockSettings}>
            <PatientProfileView onNavigate={vi.fn()} />
          </SettingsContext.Provider>
        </AuthContext.Provider>
      );
    });

    expect(container.textContent).toContain('My Patient Profile');
    expect(container.textContent).toContain('Personal & Contact Information');
    expect(container.textContent).toContain('Clinical Profile & Allergies');
    expect(container.textContent).toContain('Penicillin');
    expect(container.textContent).toContain('Privacy Rights & Data Deletion (DPDP Act)');

    // Click Delete My Data button to open confirmation modal
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Delete My Data & Account')
    );
    expect(deleteBtn).toBeDefined();

    act(() => {
      deleteBtn.click();
    });

    expect(container.textContent).toContain('Confirm Irreversible Deletion');
    expect(container.textContent).toContain('Yes, Delete Permanently');
  });
});
