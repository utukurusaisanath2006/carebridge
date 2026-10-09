import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Clock,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Bell,
  Settings,
  Users,
  User,
  HeartPulse
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  activeView,
  setActiveView,
  escalationCount = 0,
  safetyFlagCount = 0,
  isFallback = false
}) {
  const { t } = useSettings();
  const { unreadCount } = useNotifications();
  const { canEditSettings, isViewer, isPatient } = useAuth();

  // If role is PATIENT, show simplified patient-only navigation
  const navItems = isPatient
    ? [
        { id: 'welcome', label: t('nav.welcome', null, 'Care Portal'), icon: HeartPulse },
        { id: 'intake', label: t('nav.newIntake', null, 'New Intake'), icon: FilePlus },
        { id: 'plan', label: t('nav.plan', null, 'Care Plan'), icon: ClipboardList },
        { id: 'schedule', label: t('nav.schedule', null, 'Care Schedule'), icon: Clock },
        { id: 'adherence', label: t('nav.adherence', null, 'Adherence Tracker'), icon: Activity },
        { id: 'profile', label: t('nav.myProfile', null, 'My Profile'), icon: User }
      ]
    : [
        { id: 'dashboard', label: t('nav.dashboard', null, 'Care Dashboard'), icon: LayoutDashboard },
        ...(!isViewer ? [{ id: 'patients', label: t('nav.patients', null, 'Patients Directory'), icon: Users }] : []),
        ...(!isViewer ? [{ id: 'intake', label: t('nav.newIntake', null, 'New Intake'), icon: FilePlus }] : []),
        { id: 'plan', label: t('nav.plan', null, 'Care Plan'), icon: ClipboardList },
        { id: 'schedule', label: t('nav.schedule', null, 'Care Schedule'), icon: Clock },
        { id: 'adherence', label: t('nav.adherence', null, 'Adherence Tracker'), icon: Activity },
        {
          id: 'notifications',
          label: t('nav.notifications', null, 'Notifications'),
          icon: Bell,
          badge: unreadCount,
          badgeColor: 'bg-[#FF4D5E] text-white'
        },
        {
          id: 'escalations',
          label: t('nav.escalations', null, 'Escalations'),
          icon: AlertTriangle,
          badge: escalationCount,
          badgeColor: 'bg-[#FF4D5E] text-white'
        },
        {
          id: 'audit',
          label: t('nav.audit', null, 'Audit & Safety'),
          icon: ShieldAlert,
          badge: safetyFlagCount,
          badgeColor: 'bg-[#F5B94A] text-[#050505]'
        },
        ...(canEditSettings
          ? [
              {
                id: 'settings',
                label: t('nav.settings', null, 'Language Settings'),
                icon: Settings
              }
            ]
          : [])
      ];

  return (
    <>
      {/* Desktop / Tablet Slim Near-Black Sidebar */}
      <aside className="no-print hidden sm:flex w-60 bg-cb-bg text-cb-text flex-col shrink-0 min-h-screen border-r border-cb-border selection:bg-[#FF6242]/20 selection:text-[#FF6242] transition-colors">
        {/* Brand Header */}
        <div className="p-5 border-b border-cb-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/30 flex items-center justify-center shrink-0 shadow-glow-coral">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M 5 23 C 9 11, 23 11, 27 23" stroke="#FF6242" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 16 14 L 16 23" stroke="#55D6A2" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
                <circle cx="16" cy="14" r="2.5" fill="#55D6A2" />
                <circle cx="5" cy="23" r="2" fill="#FF6242" />
                <circle cx="27" cy="23" r="2" fill="#FF6242" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1 font-display font-black text-xl tracking-[-0.01em]">
                <span>Care</span>
                <span className="text-[#FF6242]">Bridge</span>
              </div>
              <p className="text-[10px] text-cb-textMuted font-mono uppercase tracking-wide-mono">
                {isPatient ? 'Patient Care Portal' : t('nav.appSubtitle', null, 'Hospital Follow-up OS')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono font-bold text-cb-textMuted uppercase tracking-wide-mono">
            {isPatient ? 'PATIENT PORTAL' : t('nav.coordinator', null, 'CLINICAL COORDINATOR')}
          </div>
          <div className="mx-3 mb-1 border-t border-[rgba(255,98,66,0.10)]" />

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-control text-xs font-medium transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-[#FF6242]/15 text-[#FF6242] border-l-[3px] border-[#FF6242] font-bold shadow-sm'
                    : 'text-cb-textMuted hover:text-cb-text hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#FF6242]' : 'text-cb-textMuted group-hover:text-cb-text'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer System Status Badge */}
        <div className="p-4 border-t border-cb-border text-[11px] text-cb-textMuted space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-cb-textFaint uppercase">{t('nav.offlineEngine', null, 'Model')}:</span>
            <span className="text-cb-text font-semibold">
              {isFallback ? t('nav.ruleFallback', null, 'Rule Fallback') : 'Claude 4.6'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cb-textFaint uppercase">{t('nav.security', null, 'Security')}:</span>
            <span className="text-[#55D6A2] font-semibold">{t('nav.hipaaSynthetic', null, 'Synthetic Safe')}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (Responsive for Patients & Clinicians on small screens) */}
      <nav className="no-print sm:hidden fixed bottom-0 inset-x-0 z-40 bg-cb-bg/95 backdrop-blur-md border-t border-cb-border flex items-center justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-all ${
                isActive ? 'text-[#FF6242] font-bold' : 'text-cb-textMuted hover:text-cb-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
