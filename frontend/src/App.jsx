import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import DashboardView from './components/DashboardView';
import IntakePanel from './components/IntakePanel';
import PatientCard from './components/PatientCard';
import TaskBoard from './components/TaskBoard';
import CareSchedule from './components/CareSchedule';
import AdherenceTracker from './components/AdherenceTracker';
import EscalationPanel from './components/EscalationPanel';
import ExportBar from './components/ExportBar';
import SourceTraceModal from './components/SourceTraceModal';
import AlarmModal from './components/AlarmModal';
import NotificationsView from './components/NotificationsView';
import LoginPage from './components/LoginPage';
import PatientProfileView from './components/PatientProfileView';
import OperatorPatientsView from './components/OperatorPatientsView';

// Code-split panels with React.lazy
const AuditSafetyPanel = lazy(() => import('./components/AuditSafetyPanel'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const PatientWelcome = lazy(() => import('./components/PatientWelcome'));

const DarkFallback = () => (
  <div className="min-h-[220px] flex items-center justify-center p-8 bg-[#050505] rounded-card border border-[rgba(255,98,66,0.22)] shadow-[0_0_24px_rgba(255,98,66,0.08)]">
    <div className="flex items-center gap-3 text-xs font-mono text-[#BDB8B0]">
      <div className="w-4 h-4 border-2 border-[rgba(255,98,66,0.2)] border-t-[#FF6242] rounded-full animate-spin"></div>
      <span>Loading...</span>
    </div>
  </div>
);
import {
  AlertTriangle,
  CheckCircle,
  X,
  Check
} from 'lucide-react';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import { formatDate, taskTypeLabel, statusLabel } from './utils/i18nHelpers';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const { settings, supportedLanguages, t } = useSettings();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    idleWarning,
    setIdleWarning,
    authFetch,
    isViewer,
    canEditSettings,
    isPatient,
    patientProfile
  } = useAuth();
  const { activeToast, setActiveToast, acknowledgeAlert } = useNotifications();

  const currentLang = settings.ui_language || 'en';
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPatientContext, setSelectedPatientContext] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [escalationDrawerOpen, setEscalationDrawerOpen] = useState(false);
  const [sourceModalTask, setSourceModalTask] = useState(null);
  const [alarmModalTask, setAlarmModalTask] = useState(null);
  const [demoAlarmCountdown, setDemoAlarmCountdown] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ healthy: false, anthropic: false });
  const [adherenceMetrics, setAdherenceMetrics] = useState({
    adherence_percentage: 94,
    taken_count: 8,
    missed_count: 0,
    snoozed_count: 1,
    streak_days: 5,
    total_events: 9,
    recent_logs: []
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load: check health & fetch initial sample plan once authenticated
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({
          healthy: true,
          anthropic: data.anthropic_configured,
          model: data.model_target
        });
      })
      .catch(() => setBackendStatus({ healthy: false, anthropic: false }));

    if (isAuthenticated) {
      // Automatically load default synthetic sample (Ramesh Kumar) so dashboard is ready to view
      authFetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discharge_text: "Patient: Ramesh Kumar, 58M\nDischarged from: Apollo Hospital, Chennai\nDate: 08-Oct-2026\nDiagnosis: Type 2 Diabetes with Hypertension\n1. Take Metformin 500mg twice daily after meals.\n2. Take Amlodipine 5mg once daily in the morning.\n3. Follow-up with Dr. Priya Sharma within 7 days.\n4. Get HbA1c test within 3 days.\n5. Avoid sugar and fried foods.\n6. Monitor blood pressure daily.\n7. Warning: If blood sugar drops below 70 mg/dL go to emergency immediately.\n8. Wound care: Clean IV site on left arm daily for 3 days.\n9. Refer to dietitian for structured meal plan.",
          force_refresh: false
        })
      })
        .then((res) => res.json())
        .then((data) => setPlan(data))
        .catch((e) => console.log('Init fallback note:', e));
    }
  }, [isAuthenticated, authFetch]);

  // For PATIENT role, direct to welcome portal view
  useEffect(() => {
    if (isAuthenticated && isPatient && (activeView === 'dashboard' || !activeView)) {
      setActiveView('welcome');
    }
  }, [isAuthenticated, isPatient]);

  // Countdown timer for 10-second test alarm demo
  useEffect(() => {
    let timer = null;
    if (demoAlarmCountdown !== null) {
      if (demoAlarmCountdown > 0) {
        timer = setTimeout(() => {
          setDemoAlarmCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Countdown reached 0 -> fire live alarm!
        setDemoAlarmCountdown(null);
        const target = (plan?.follow_up_tasks && plan.follow_up_tasks[0]) || {
          id: 'demo-alarm',
          type: 'Medication',
          simple_language: 'Take Metformin 500mg with water after lunch.',
          hindi_translation: 'दोपहर के भोजन के बाद पानी के साथ मेटफॉर्मिन 500 मिलीग्राम लें।',
          tamil_translation: 'மதிய உணவுக்குப் பிறகு தண்ணீருடன் மெட்ஃபோர்மின் 500 மிகி எடுத்துக்கொள்ளவும்.',
          times_of_day: ['13:00']
        };
        setAlarmModalTask(target);

        // Show browser notification if allowed
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Care Bridge Medication Alarm', {
              body: target.simple_language,
              icon: '/favicon.ico'
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [demoAlarmCountdown, plan]);

  const handleTriggerDemoAlarm = (task = null) => {
    showToast(t('toast.alarmScheduled', null, 'Demo Alarm scheduled: firing in 10 seconds...'));
    setDemoAlarmCountdown(10);
  };

  const handleAnalyzeComplete = (newPlan) => {
    setPlan(newPlan);
    setActiveView('plan');
    showToast(t('toast.planGenerated', { count: newPlan.follow_up_tasks?.length || 0 }, `Care plan generated! Extracted ${newPlan.follow_up_tasks?.length || 0} coordinated actions.`));
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, reviewedBy = null, notes = null) => {
    if (!plan) return;

    const actor = reviewedBy || (user?.name ? `${user.name} (${user.role})` : 'Nurse Joy (RN)');

    // Optimistic UI update
    const updated = plan.follow_up_tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          escalate_to_human: newStatus === 'Completed' ? false : t.escalate_to_human
        };
      }
      return t;
    });

    setPlan({ ...plan, follow_up_tasks: updated });
    showToast(t('toast.statusUpdated', { status: statusLabel(newStatus, currentLang) }, `Task status updated to "${newStatus}"`));

    // Sync with backend using authFetch
    try {
      await authFetch(`${API_BASE}/update-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: newStatus,
          reviewed_by: actor,
          review_notes: notes
        })
      });
    } catch (e) {
      console.warn('Backend update error:', e);
    }
  };

  const handleUpdateTaskTimes = async (taskId, newTimes) => {
    if (!plan) return;

    const updated = plan.follow_up_tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, times_of_day: newTimes };
      }
      return t;
    });

    setPlan({ ...plan, follow_up_tasks: updated });
    showToast(t('toast.timeUpdated', { times: newTimes.join(', ') }, `Scheduled time updated to ${newTimes.join(', ')}`));

    try {
      await authFetch(`${API_BASE}/update-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          times_of_day: newTimes
        })
      });
    } catch (e) {
      console.warn('Backend timing update error:', e);
    }
  };

  const handleAdherenceAction = async (taskId, action) => {
    showToast(t('toast.actionRecorded', { action: statusLabel(action, currentLang) }, `Recorded action: "${action}"`));

    try {
      const res = await authFetch(`${API_BASE}/adherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          action: action,
          timestamp: new Date().toISOString()
        })
      });

      if (res.ok) {
        // Refresh adherence stats
        const statsRes = await authFetch(`${API_BASE}/adherence`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setAdherenceMetrics(stats);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    if (action === 'Taken') {
      handleUpdateTaskStatus(taskId, 'Completed');
    }
  };

  const handleTranslatePlan = async (languagesToTranslate) => {
    if (!plan) return;
    try {
      const res = await authFetch(`${API_BASE}/translate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan,
          languages: languagesToTranslate
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Translation failed');
      }

      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      }
      showToast(t('toast.planTranslated', { languages: languagesToTranslate.join(', ') }, `Plan successfully translated to ${languagesToTranslate.join(', ')}!`));
    } catch (err) {
      console.error('Translation error:', err);
      showToast(t('toast.translationError', { message: err.message }, `Translation error: ${err.message}`));
    }
  };

  const escalatedCount = plan?.follow_up_tasks?.filter((t) => t.escalate_to_human).length || 0;
  const safetyFlagCount = plan?.safety_flags?.length || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-[var(--text)]">
        <div className="w-10 h-10 border-3 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,98,66,0.3)]"></div>
        <p className="text-xs font-mono tracking-wider uppercase text-[var(--text-muted)]">Loading Clinical Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-[#050505] relative overflow-x-hidden">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-card bg-[#121217]/95 text-[var(--text)] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-[var(--border)]">
          <CheckCircle className="w-4 h-4 text-[var(--accent-2)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Floating Critical Operator Alert Banner */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#160a0c] text-[var(--text)] p-4 rounded-2xl shadow-2xl border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/40 max-w-md animate-bounce flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--critical)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[var(--critical)] text-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,77,94,0.4)]">
                CRITICAL OPERATOR ALERT
              </span>
              <button onClick={() => setActiveToast(null)} className="text-[var(--text-faint)] hover:text-[var(--text)] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold mt-1.5 leading-snug text-[var(--text)]">
              {t(activeToast.title_code, activeToast.params, activeToast.title_code)}
            </p>
            <button
              onClick={() => acknowledgeAlert(activeToast.id)}
              className="mt-2.5 px-3.5 py-1.5 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(255,98,66,0.25)] flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* 15m Idle Warning Modal */}
      {idleWarning && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e0e13] rounded-2xl p-6 max-w-sm w-full text-center space-y-3.5 shadow-2xl border border-[var(--warning)]/40">
            <AlertTriangle className="w-10 h-10 text-[var(--warning)] mx-auto animate-pulse" />
            <h4 className="text-base font-display font-bold text-[var(--text)]">Session Inactivity Warning</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Your clinical session will expire in 1 minute due to 15 minutes of inactivity. Click below or move mouse to continue.
            </p>
            <button
              onClick={() => setIdleWarning(false)}
              className="w-full min-h-[44px] py-2.5 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(255,98,66,0.3)] transition-all cursor-pointer"
            >
              Stay Signed In
            </button>
          </div>
        </div>
      )}

      {/* RESPONSIBLE AI MANDATORY BANNER */}
      <div className="no-print bg-[var(--warning)] text-[#050505] px-4 py-2 text-xs font-mono font-bold text-center border-b border-[var(--warning)]/50 flex items-center justify-center gap-2 shadow-sm">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#050505]" />
        <span>
          <strong>{t('banner.responsibleAiTitle', null, 'Responsible AI Notice:')}</strong>{' '}
          {t('banner.responsibleAiText', null, 'This plan is AI-generated. Always confirm with your doctor. Never use as guaranteed diagnosis or medication alteration. (Demo uses synthetic data. No real PHI).')}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          escalationCount={escalatedCount}
          safetyFlagCount={safetyFlagCount}
          isFallback={plan?.is_fallback || false}
          aiModel={plan?.ai_model || 'claude-sonnet-4-6'}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navbar */}
          <TopNavbar
            patientName={
              isPatient && patientProfile?.full_name
                ? `${patientProfile.full_name} (${patientProfile.age || 58}${patientProfile.sex ? patientProfile.sex.charAt(0) : 'M'})`
                : (plan?.patient_name || 'Ramesh Kumar (58M)')
            }
            hospitalName={isPatient ? 'Care Bridge Patient Portal' : (plan?.hospital_name || 'Apollo Hospital, Chennai')}
            isFallback={plan?.is_fallback || false}
            aiModel={plan?.ai_model || 'claude-sonnet-4-6'}
            unreadCount={escalatedCount}
            onTriggerDemoAlarm={() => handleTriggerDemoAlarm()}
            demoAlarmCountdown={demoAlarmCountdown}
            onOpenSettings={() => setActiveView('settings')}
            onNavigateNotifications={() => setActiveView('notifications')}
            onSelectTask={(taskId) => setActiveView('plan')}
            onOpenProfile={() => setActiveView('profile')}
          />

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
            {/* VIEW: PATIENT WELCOME & CARE PORTAL */}
            {activeView === 'welcome' && (
              <div className="space-y-6">
                <Suspense fallback={<DarkFallback />}>
                  <PatientWelcome
                    onNavigate={setActiveView}
                    plan={plan}
                  />
                </Suspense>
              </div>
            )}

            {/* VIEW: PATIENT PROFILE & DPDP DATA MGMT */}
            {activeView === 'profile' && (
              <div className="space-y-6">
                <PatientProfileView
                  onNavigate={setActiveView}
                />
              </div>
            )}

            {/* VIEW: OPERATOR PATIENT DIRECTORY */}
            {activeView === 'patients' && (
              <div className="space-y-6">
                <OperatorPatientsView
                  onSelectPatient={(patient) => {
                    setSelectedPatientContext(patient);
                    setActiveView('intake');
                  }}
                />
              </div>
            )}

            {/* VIEW 1: DASHBOARD */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <DashboardView
                  plan={plan}
                  adherenceMetrics={adherenceMetrics}
                  onNavigate={setActiveView}
                  onTriggerAlarm={(task) => setAlarmModalTask(task)}
                />

                {plan && (
                  <ExportBar plan={plan} />
                )}
              </div>
            )}

            {/* VIEW 2: NEW INTAKE */}
            {activeView === 'intake' && (
              <div className="space-y-6">
                <IntakePanel
                  onAnalyzeComplete={handleAnalyzeComplete}
                  loading={loading}
                  setLoading={setLoading}
                  onOpenSettings={() => setActiveView('settings')}
                  patientContext={selectedPatientContext}
                />
              </div>
            )}

            {/* VIEW 3: CARE PLAN */}
            {activeView === 'plan' && plan && (
              <div className="space-y-6">
                <ExportBar plan={plan} />

                <PatientCard
                  plan={plan}
                  onOpenEscalation={() => setEscalationDrawerOpen(true)}
                />

                <TaskBoard
                  tasks={plan.follow_up_tasks || []}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onOpenEscalation={() => setEscalationDrawerOpen(true)}
                  onViewSource={(task) => setSourceModalTask(task)}
                  onTranslatePlan={handleTranslatePlan}
                />
              </div>
            )}

            {/* VIEW 4: CARE SCHEDULE */}
            {activeView === 'schedule' && plan && (
              <div className="space-y-6">
                <CareSchedule
                  tasks={plan.follow_up_tasks || []}
                  patientName={plan.patient_name}
                  onUpdateTaskTimes={handleUpdateTaskTimes}
                  onTriggerAlarmNow={(task) => setAlarmModalTask(task)}
                  demoAlarmCountdown={demoAlarmCountdown}
                />
              </div>
            )}

            {/* VIEW 5: ADHERENCE TRACKER */}
            {activeView === 'adherence' && (
              <div className="space-y-6">
                <AdherenceTracker
                  adherenceMetrics={adherenceMetrics}
                  tasks={plan?.follow_up_tasks || []}
                />
              </div>
            )}

            {/* VIEW 6: ESCALATIONS */}
            {activeView === 'escalations' && plan && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl border border-[var(--border)] p-6 md:p-8 space-y-5 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
                    <div>
                      <h2 className="text-xl font-display font-bold text-[var(--text)] flex items-center gap-2.5">
                        <span>Human Clinical Escalations</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider bg-[var(--critical)] text-white shadow-[0_0_10px_rgba(255,77,94,0.4)]">
                          {escalatedCount} Items Flagged
                        </span>
                      </h2>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Mandatory human sign-off before patient discharge dismissal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEscalationDrawerOpen(true)}
                      className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--critical)] hover:opacity-90 shadow-[0_0_15px_rgba(255,77,94,0.3)] cursor-pointer transition-all"
                    >
                      Open Review Drawer
                    </button>
                  </div>

                  <TaskBoard
                    tasks={plan.follow_up_tasks.filter((t) => t.escalate_to_human)}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onOpenEscalation={() => setEscalationDrawerOpen(true)}
                    onViewSource={(task) => setSourceModalTask(task)}
                    onTranslatePlan={handleTranslatePlan}
                  />
                </div>
              </div>
            )}

            {/* VIEW 7: AUDIT & SAFETY */}
            {activeView === 'audit' && plan && (
              <div className="space-y-6">
                <Suspense fallback={<DarkFallback />}>
                  <AuditSafetyPanel
                    safetyFlags={plan.safety_flags || []}
                    auditLog={plan.audit_log || []}
                  />
                </Suspense>
              </div>
            )}

            {/* VIEW 8: OPERATOR LANGUAGE & SYSTEM SETTINGS */}
            {activeView === 'settings' && (
              canEditSettings ? (
                <div className="space-y-6">
                  <Suspense fallback={<DarkFallback />}>
                    <SettingsPanel onClose={() => setActiveView('dashboard')} />
                  </Suspense>
                </div>
              ) : (
                <div className="p-8 glass-card rounded-2xl border border-[var(--critical)]/30 text-center max-w-md mx-auto my-12 shadow-2xl">
                  <p className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--critical)]">Access Restricted</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">Caregiver/Viewer role cannot access operator settings.</p>
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="mt-4 min-h-[40px] px-5 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-semibold rounded-xl border border-[var(--border)] transition-all cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )
            )}

            {/* VIEW 9: OPERATOR NOTIFICATIONS */}
            {activeView === 'notifications' && (
              <div className="space-y-6">
                <NotificationsView
                  onSelectTask={(taskId) => {
                    setActiveView('plan');
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Traceability Modal */}
      <SourceTraceModal
        isOpen={Boolean(sourceModalTask)}
        onClose={() => setSourceModalTask(null)}
        task={sourceModalTask}
        fullDischargeText={plan?.follow_up_tasks ? plan.follow_up_tasks.map((t) => t.source_line).join('\n') : ''}
      />

      {/* Live Alarm Modal */}
      <AlarmModal
        isOpen={Boolean(alarmModalTask)}
        onClose={() => setAlarmModalTask(null)}
        task={alarmModalTask}
        onAction={handleAdherenceAction}
      />

      {/* Escalation Review Drawer */}
      <EscalationPanel
        isOpen={escalationDrawerOpen}
        onClose={() => setEscalationDrawerOpen(false)}
        tasks={plan?.follow_up_tasks || []}
        onUpdateStatus={handleUpdateTaskStatus}
      />

      {/* Print-Optimized Patient Handout Layout (hidden on screen, active on print) */}
      {plan && (
        <div className="print-only hidden p-8 text-black bg-white">
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">{t('print.title', null, 'HOSPITAL DISCHARGE FOLLOW-UP PLAN')}</h1>
            <p className="text-xs text-slate-600">{t('print.subtitle', null, 'Care Bridge Clinical Coordinator Handout')}</p>
            <div className="mt-4 grid grid-cols-3 text-xs gap-3 bg-slate-100 p-3 rounded">
              <div><strong>{t('print.patient', null, 'Patient:')}</strong> {plan.patient_name}</div>
              <div><strong>{t('print.facility', null, 'Facility:')}</strong> {plan.hospital_name}</div>
              <div><strong>{t('print.dischargeDate', null, 'Discharge Date:')}</strong> {formatDate(plan.discharge_date, currentLang)}</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1">{t('print.summary', null, 'Plain English Summary')}</h2>
            <p className="text-xs leading-relaxed text-slate-800">
              {(currentLang !== 'en' && plan.overall_summary_translations?.[currentLang]) || plan.overall_summary}
            </p>
          </div>

          {plan.urgent_warnings?.length > 0 && (
            <div className="mb-6 p-4 border-2 border-rose-500 rounded bg-rose-50">
              <h2 className="text-xs font-black text-rose-900 uppercase mb-2">{t('print.urgentWarnings', null, '⚠ URGENT SAFETY WARNINGS')}</h2>
              {plan.urgent_warnings.map((w, i) => {
                const localizedWarn = (currentLang !== 'en' && plan.urgent_warnings_translations?.[currentLang]?.[i]) || w;
                return (
                  <div key={i} className="text-xs font-bold text-rose-950 mb-1">• {localizedWarn}</div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2">{t('print.scheduleActions', null, 'Medication Schedule & Follow-up Actions')}</h2>
            {plan.follow_up_tasks?.map((tItem, idx) => {
              const primaryInstruction = (currentLang !== 'en' && tItem.translations?.[currentLang]) || tItem.simple_language;
              return (
                <div key={idx} className="border border-slate-300 p-3 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>
                      [{taskTypeLabel(tItem.type, currentLang)}] {tItem.times_of_day?.length ? t('print.slots', { slots: tItem.times_of_day.join(', ') }, `Slots: ${tItem.times_of_day.join(', ')}`) : ''}
                    </span>
                    <span>{t('print.status', { status: statusLabel(tItem.status, currentLang) }, `Status: ${statusLabel(tItem.status, currentLang)}`)}</span>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{primaryInstruction}</div>
                  {settings?.enabled_languages
                    ?.filter((code) => code !== currentLang && code !== 'en')
                    .map((code) => {
                      const meta = supportedLanguages?.find((l) => l.code === code);
                      const transText = tItem.translations?.[code]
                        || (code === 'hi' ? tItem.hindi_translation : null)
                        || (code === 'ta' ? tItem.tamil_translation : null);
                      if (!transText) return null;
                      return (
                        <div key={code} className="italic text-slate-700">
                          [{meta ? `${meta.name} - ${meta.native}` : code.toUpperCase()}]: {transText}
                        </div>
                      );
                    })}
                  <div className="text-[10px] text-slate-500">{t('print.source', { source: tItem.source_line }, `Source: "${tItem.source_line}"`)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 text-center">
            {t('print.disclaimer', null, 'This plan is AI-generated by Care Bridge. Always confirm medications and instructions with your doctor.')}
          </div>
        </div>
      )}
    </div>
  );
}
