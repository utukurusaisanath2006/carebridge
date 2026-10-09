import React, { useState, useRef, useEffect } from 'react';
import {
  Languages,
  AlertTriangle,
  Zap,
  Building2,
  Sparkles,
  Settings,
  User as UserIcon,
  LogOut,
  Key,
  Shield,
  CheckCircle,
  X,
  ChevronDown,
  Sun,
  Moon,
  Pause,
  Play
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import NotificationBellDropdown from './NotificationBellDropdown';

export default function TopNavbar({
  patientName = 'Ramesh Kumar',
  hospitalName = 'Apollo Hospital, Chennai',
  isFallback = false,
  aiModel = 'claude-sonnet-4-6',
  onTriggerDemoAlarm,
  demoAlarmCountdown = null,
  onOpenSettings,
  onNavigateNotifications,
  onSelectTask,
  onOpenProfile
}) {
  const {
    settings,
    supportedLanguages,
    setUiLanguage,
    t,
    theme,
    toggleTheme,
    isDark,
    motionPaused,
    toggleMotion
  } = useSettings();
  const { user, role, logout, changePassword, canEditSettings, isPatient } = useAuth();
  const enabledCodes = settings.enabled_languages || ['en'];
  const currentLang = settings.ui_language || 'en';

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [submittingPw, setSubmittingPw] = useState(false);

  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (!currentPw || !newPw) {
      setPwError(t('auth.allPwFieldsRequired', null, 'All fields are required.'));
      return;
    }
    if (newPw.length < 6) {
      setPwError(t('auth.pwMinLength', null, 'New password must be at least 6 characters.'));
      return;
    }
    setSubmittingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPwSuccess(false);
      }, 1500);
    } catch (err) {
      setPwError(err.message || t('auth.pwChangeFailed', null, 'Failed to update password.'));
    } finally {
      setSubmittingPw(false);
    }
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[#7FB2FF]/15 text-[#7FB2FF] border-[#7FB2FF]/30';
      case 'OPERATOR':
        return 'bg-[#FF6242]/15 text-[#FF6242] border-[#FF6242]/30';
      case 'PATIENT':
        return 'bg-[#55D6A2]/15 text-[#55D6A2] border-[#55D6A2]/30';
      case 'VIEWER':
        return 'bg-[#F5B94A]/15 text-[#F5B94A] border-[#F5B94A]/30';
      default:
        return 'bg-white/10 text-cb-text border-white/20';
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <>
      <header className="no-print bg-cb-bg/85 backdrop-blur-md border-b border-cb-border sticky top-0 z-30 transition-colors">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Facility & Current Patient Context */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cb-surface2 border border-cb-border text-[#FF6242] flex items-center justify-center font-bold shadow-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-cb-text tracking-tight flex items-center gap-2">
                  <span>{hospitalName}</span>
                  <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-cb-surface2 text-cb-textMuted font-mono uppercase border border-cb-border">
                    {t('topbar.ward', null, 'Ward 4B')}
                  </span>
                </div>
                <div className="text-[11px] text-cb-textMuted">
                  {t('topbar.patient', null, 'Patient')}: <strong className="text-cb-text">{patientName}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Engine Badge, Alarm Trigger, Lang Switcher, Bell, Theme, Settings, User Menu */}
          <div className="flex items-center gap-1.5">
            {/* Visible Engine Badge / Honest Fallback Badge (Clinical Safety Rule) */}
            {isFallback ? (
              <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/40 text-xs font-bold shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D5E]" />
                <span>{t('topbar.offlineMode', null, 'Offline demo mode – rule-based parser (not AI)')}</span>
              </div>
            ) : (
              <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#55D6A2]/15 text-[#55D6A2] border border-[#55D6A2]/30 text-xs font-mono font-medium shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#55D6A2]" />
                <span>{t('topbar.aiEngine', { model: aiModel }, `AI: Claude ${aiModel}`)}</span>
              </div>
            )}

            {/* Quick Demo Alarm Button */}
            <div className="hidden md:block">
              <button
                type="button"
                onClick={onTriggerDemoAlarm}
                disabled={demoAlarmCountdown !== null}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                  demoAlarmCountdown !== null
                    ? 'bg-[#FF4D5E] text-[#050505] animate-pulse shadow-glow-coral'
                    : 'bg-[#FF6242]/15 hover:bg-[#FF6242] text-[#FF6242] hover:text-[#050505] border border-[#FF6242]/40 shadow-sm'
                }`}
                title={t('topbar.testAlarmTooltip', null, 'Trigger a live in-app audio alarm in 10 seconds for judges')}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {demoAlarmCountdown !== null
                    ? t('topbar.alarmCountdown', { seconds: demoAlarmCountdown }, `Alarm in ${demoAlarmCountdown}s...`)
                    : t('topbar.testAlarm', null, '⚡ Test Alarm (10s)')}
                </span>
              </button>
            </div>

            {/* Language Switcher: Shows ONLY operator-enabled languages */}
            {enabledCodes.length > 1 ? (
              <div className="flex items-center bg-cb-surface2 p-0.5 rounded-control border border-cb-border">
                {enabledCodes.map((code) => {
                  const meta = supportedLanguages.find((l) => l.code === code);
                  const isSelected = currentLang === code;
                  const label = code === 'en' ? 'EN' : meta?.native || code.toUpperCase();
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setUiLanguage(code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF6242] text-[#050505] font-bold shadow-xs'
                          : 'text-cb-textMuted hover:text-cb-text'
                      }`}
                      style={meta?.font ? { fontFamily: meta.font } : {}}
                      title={t('topbar.switchLangTooltip', { name: meta?.name || code }, `Switch UI & Audio to ${meta?.name || code}`)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-cb-textMuted bg-cb-surface2 px-2.5 py-1 rounded-control border border-cb-border font-mono">
                <Languages className="w-3.5 h-3.5 text-cb-textMuted" />
                <span>{t('topbar.englishOnly', null, 'English only')}</span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-cb-textMuted hover:text-cb-text hover:bg-cb-surface2 rounded-control border border-cb-border transition-colors cursor-pointer"
              title={isDark ? 'Switch to High-contrast Light theme' : 'Switch to Cinematic Dark theme'}
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#F5B94A]" /> : <Moon className="w-4 h-4 text-[#7FB2FF]" />}
            </button>

            {/* Motion Pause Toggle Button */}
            <button
              type="button"
              onClick={toggleMotion}
              className="p-2 text-cb-textMuted hover:text-cb-text hover:bg-cb-surface2 rounded-control border border-cb-border transition-colors cursor-pointer hidden lg:flex items-center justify-center"
              title={motionPaused ? 'Resume animations' : 'Pause animations'}
              aria-label="Toggle motion"
            >
              {motionPaused ? <Play className="w-4 h-4 text-[#55D6A2]" /> : <Pause className="w-4 h-4 text-cb-textMuted" />}
            </button>

            {/* Settings Shortcut Button (Only if user has permission) */}
            {canEditSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 text-cb-textMuted hover:text-cb-text hover:bg-cb-surface2 rounded-control border border-cb-border transition-colors cursor-pointer"
                title={t('topbar.settingsTooltip', null, 'Language & System Settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Operator Notification Bell Dropdown */}
            <NotificationBellDropdown
              onNavigateNotifications={onNavigateNotifications}
              onSelectTask={onSelectTask}
            />

            {/* User Profile Menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-control hover:bg-cb-surface2 border border-transparent hover:border-cb-border transition-colors cursor-pointer"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6242] to-[#FF8A65] text-[#050505] font-bold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-cb-text leading-none">{user?.name || 'Operator'}</p>
                  <p className="text-[10px] text-cb-textMuted font-mono mt-0.5">{role || 'OPERATOR'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-cb-textMuted hidden lg:block" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card bg-cb-bg/95 border border-cb-border py-2 z-50 animate-fade-in text-xs shadow-delicate">
                  <div className="px-3.5 py-2 border-b border-cb-border">
                    <p className="font-bold text-cb-text">{user?.name || 'Operator'}</p>
                    <p className="text-cb-textMuted text-[11px] font-mono">@{user?.username || 'user'}</p>
                    <div className="mt-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRoleBadgeColor()}`}>
                        {role || 'OPERATOR'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {onOpenProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full px-3.5 py-2 text-left text-cb-text hover:bg-cb-surface2 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-cb-textMuted" />
                        <span>{t('nav.myProfile', null, 'My Profile')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-cb-text hover:bg-cb-surface2 flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-cb-textMuted" />
                      <span>{t('auth.changePassword', null, 'Change Password')}</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-cb-border">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-[#FF4D5E] hover:bg-[#FF4D5E]/10 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('auth.signOut', null, 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-cb-bg/95 border border-cb-border max-w-sm w-full p-6 animate-fade-in shadow-delicate">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-cb-text font-bold text-base">
                <Key className="w-4 h-4 text-[#FF6242]" />
                <span>{t('auth.changePasswordTitle', null, 'Change Password')}</span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="text-cb-textMuted hover:text-cb-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwSuccess ? (
              <div className="py-6 text-center text-[#55D6A2] space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto text-[#55D6A2] animate-bounce" />
                <p className="text-sm font-bold">{t('auth.pwSuccess', null, 'Password Updated Successfully!')}</p>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
                {pwError && (
                  <div className="p-2.5 rounded-control bg-[#FF4D5E]/10 text-[#FF4D5E] border border-[#FF4D5E]/30">
                    {pwError}
                  </div>
                )}

                <div>
                  <label className="block text-cb-textMuted font-mono uppercase mb-1" htmlFor="cur-pw">
                    {t('auth.currentPassword', null, 'Current Password')}
                  </label>
                  <input
                    id="cur-pw"
                    type="password"
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full px-3 py-2 bg-cb-surface2 border border-cb-border rounded-control text-cb-text focus:border-[#55D6A2]"
                  />
                </div>

                <div>
                  <label className="block text-cb-textMuted font-mono uppercase mb-1" htmlFor="new-pw">
                    {t('auth.newPassword', null, 'New Password')}
                  </label>
                  <input
                    id="new-pw"
                    type="password"
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full px-3 py-2 bg-cb-surface2 border border-cb-border rounded-control text-cb-text focus:border-[#55D6A2]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="px-3 py-2 bg-cb-surface2 hover:bg-white/10 text-cb-textMuted hover:text-cb-text font-semibold rounded-control cursor-pointer"
                  >
                    {t('btn.cancel', null, 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPw}
                    className="px-4 py-2 bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] font-bold rounded-control shadow-glow-coral cursor-pointer disabled:opacity-50"
                  >
                    {submittingPw ? t('btn.saving', null, 'Updating...') : t('btn.save', null, 'Save Password')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
