import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Languages,
  Check,
  X,
  Lock,
  Plus,
  RotateCcw,
  Save,
  AlertCircle,
  Sparkles,
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  Moon,
  Send,
  Sliders
} from 'lucide-react';
import { formatNumber } from '../utils/i18nHelpers';

export default function SettingsPanel({ onClose }) {
  const { settings, supportedLanguages, updateSettings, dataSource, t } = useSettings();
  const { sendTestNotification, requestBrowserPermission, browserPermission } = useNotifications();
  const currentLang = settings.ui_language || 'en';

  const [activeTab, setActiveTab] = useState('languages'); // 'languages' | 'notifications'

  // Local pending state for Languages
  const [activeLangs, setActiveLangs] = useState([...(settings.enabled_languages || ['en'])]);

  // Local pending state for Notifications
  const [soundEnabled, setSoundEnabled] = useState(settings.notification_sound !== false);
  const [pushEnabled, setPushEnabled] = useState(settings.notification_browser_push !== false);
  const [severities, setSeverities] = useState(settings.notification_severities || ['critical', 'warning', 'info']);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(!!settings.quiet_hours_enabled);
  const [quietStart, setQuietStart] = useState(settings.quiet_hours_start || '22:00');
  const [quietEnd, setQuietEnd] = useState(settings.quiet_hours_end || '07:00');

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [testSent, setTestSent] = useState(false);

  // Sync local state when server context updates
  useEffect(() => {
    setActiveLangs([...(settings.enabled_languages || ['en'])]);
    setSoundEnabled(settings.notification_sound !== false);
    setPushEnabled(settings.notification_browser_push !== false);
    setSeverities(settings.notification_severities || ['critical', 'warning', 'info']);
    setQuietHoursEnabled(!!settings.quiet_hours_enabled);
    setQuietStart(settings.quiet_hours_start || '22:00');
    setQuietEnd(settings.quiet_hours_end || '07:00');
  }, [settings]);

  const savedSet = new Set(settings.enabled_languages || ['en']);
  const activeSet = new Set(activeLangs);

  const hasUnsavedChanges =
    activeLangs.length !== settings.enabled_languages?.length ||
    activeLangs.some(l => !savedSet.has(l)) ||
    soundEnabled !== (settings.notification_sound !== false) ||
    pushEnabled !== (settings.notification_browser_push !== false) ||
    quietHoursEnabled !== (!!settings.quiet_hours_enabled) ||
    quietStart !== (settings.quiet_hours_start || '22:00') ||
    quietEnd !== (settings.quiet_hours_end || '07:00');

  const extraCount = activeLangs.filter(l => l !== 'en').length;
  const maxReached = extraCount >= 3;
  const availableToAdd = supportedLanguages.filter(l => !activeSet.has(l.code));

  const handleAddLanguage = (code) => {
    if (code === 'en') return;
    if (activeSet.has(code)) return;
    if (extraCount >= 3) {
      setErrorMsg(t('settings.maxLangsError', null, 'Maximum 3 additional languages reached. Remove an active language first.'));
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setActiveLangs(prev => [...prev, code]);
  };

  const handleRemoveLanguage = (code) => {
    if (code === 'en') return;
    setActiveLangs(prev => prev.filter(l => l !== code));
  };

  const toggleSeverity = (sev) => {
    setSeverities(prev =>
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const updated = await updateSettings({
        enabled_languages: activeLangs,
        default_language: 'en',
        ui_language: activeLangs.includes(settings.ui_language) ? settings.ui_language : 'en',
        read_aloud_language: activeLangs.includes(settings.read_aloud_language) ? settings.read_aloud_language : 'en',
        notification_sound: soundEnabled,
        notification_browser_push: pushEnabled,
        notification_severities: severities,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd
      });

      setActiveLangs([...updated.settings.enabled_languages]);
      setToastMessage(t('settings.saveSuccessToast', null, 'Settings saved successfully!'));
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setActiveLangs([...(settings.enabled_languages || ['en'])]);
      setErrorMsg(err.message || t('settings.saveErrorToast', null, 'Failed to save settings to server.'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetEnglish = async () => {
    setActiveLangs(['en']);
    setSaving(true);
    setErrorMsg(null);
    try {
      const updated = await updateSettings({
        enabled_languages: ['en'],
        default_language: 'en',
        ui_language: 'en',
        read_aloud_language: 'en'
      });
      setActiveLangs([...updated.settings.enabled_languages]);
      setToastMessage(t('settings.resetSuccessToast', null, 'Reset to English-only successfully.'));
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setActiveLangs([...(settings.enabled_languages || ['en'])]);
      setErrorMsg(err.message || t('settings.resetErrorToast', null, 'Failed to reset settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTestSent(true);
    await sendTestNotification();
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="glass-card border border-[var(--border)] rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--surface-2)] text-[var(--accent)] rounded-xl border border-[var(--border)] shadow-[0_0_15px_rgba(255,98,66,0.15)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-extrabold text-[var(--text)] tracking-tight">
                {t('settings.title', null, 'Hospital Operator Controls')}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('settings.subtitle', null, 'Manage patient output languages, audio chimes, and operator alert policies.')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Languages vs Notifications */}
        <div className="flex items-center bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('languages')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
              activeTab === 'languages'
                ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{t('settings.tabLanguages', null, 'Language Settings')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
              activeTab === 'notifications'
                ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{t('settings.tabNotifications', null, 'Notifications')}</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--warning)] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--warning)]" />
            <span>{t('settings.unsavedBanner', null, 'You have unsaved changes. Click "Save Settings" below to apply.')}</span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30">
            {t('settings.unsavedBadge', null, 'Unsaved Changes')}
          </span>
        </div>
      )}

      {/* Notifications / Toast */}
      {toastMessage && (
        <div className="bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 text-[var(--accent-2)] px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-[var(--accent-2)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 text-[var(--critical)] px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
          <AlertCircle className="w-4 h-4 text-[var(--critical)]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: LANGUAGE SETTINGS                                 */}
      {/* ======================================================== */}
      {activeTab === 'languages' && (
        <>
          {/* Section A: Active Languages */}
          <div className="glass-card border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] flex items-center gap-2 flex-wrap">
                  <span>{t('settings.secATitle', null, 'Section A: Active Languages')}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                    {formatNumber(activeLangs.length, currentLang)} Active ({formatNumber(extraCount, currentLang)} / 3 Extra)
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t('settings.secASub', null, 'These languages are generated in follow-up plans and shown to patients.')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetEnglish}
                disabled={saving || (activeLangs.length === 1 && activeLangs[0] === 'en')}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl border border-[var(--border)] transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{t('settings.resetEnglishBtn', null, 'Reset English-only')}</span>
              </button>
            </div>

            {/* Active Language Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {activeLangs.map((code) => {
                const meta = supportedLanguages.find(l => l.code === code) || {
                  code,
                  name: code,
                  native: code,
                  font: 'inherit'
                };
                const isEnglish = code === 'en';

                return (
                  <div
                    key={code}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isEnglish
                        ? 'bg-[var(--surface)] border-[var(--border)]'
                        : 'bg-[var(--surface-2)] border-[var(--accent-2)]/30 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                          {code}
                        </span>
                        <h3 className="text-sm font-bold text-[var(--text)] mt-1.5">{meta.name}</h3>
                        <p className="text-xs text-[var(--accent-2)] font-medium mt-0.5" style={{ fontFamily: meta.font }}>
                          {meta.native}
                        </p>
                      </div>

                      {isEnglish ? (
                        <span className="p-1.5 text-[var(--text-faint)] bg-[var(--surface)] rounded-lg border border-[var(--border)]" title="English is locked as mandatory baseline">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(code)}
                          className="p-1.5 text-[var(--text-faint)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10 rounded-lg transition"
                          title={`Remove ${meta.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Available Indian Regional Languages */}
          <div className="glass-card border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="pb-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)]">
                {t('settings.secBTitle', null, 'Section B: Add Regional Language (Up to 3 Extra)')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {maxReached
                  ? t('settings.maxReachedNotice', null, 'Limit of 3 extra languages reached. Remove an active language above to add another.')
                  : t('settings.selectFromCatalog', null, 'Click "+ Add" to include high-fidelity AI translation for this language.')}
              </p>
            </div>

            {availableToAdd.length === 0 ? (
              <p className="text-xs text-[var(--text-faint)] py-4 italic">All supported languages are currently active.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {availableToAdd.map((lang) => (
                  <div
                    key={lang.code}
                    className="p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-faint)] border border-[var(--border)]">
                          {lang.code}
                        </span>
                        <span className="text-xs font-bold text-[var(--text)]">{lang.name}</span>
                      </div>
                      <p className="text-xs text-[var(--accent)] mt-0.5 font-medium" style={{ fontFamily: lang.font }}>
                        {lang.native}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={maxReached}
                      onClick={() => handleAddLanguage(lang.code)}
                      className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition ${
                        maxReached
                          ? 'opacity-30 cursor-not-allowed bg-[var(--surface-2)] text-[var(--text-faint)]'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#050505] shadow-[0_0_10px_rgba(255,98,66,0.15)] cursor-pointer'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OPERATOR NOTIFICATION PREFERENCES                 */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="glass-card border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] mb-1">
                {t('settings.notifPolicyTitle', null, 'Operator Alert Dispatch & Audio Channels')}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t('settings.notifPolicyDesc', null, 'Configure how clinical escalations, missed doses, and urgent patient warnings notify hospital operators.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sound Channel */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--accent-2)]" /> : <VolumeX className="w-4 h-4 text-[var(--text-faint)]" />}
                    <span className="text-xs font-bold text-[var(--text)]">
                      {t('settings.soundAlertsTitle', null, 'Web Audio Chimes')}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent-2)] rounded cursor-pointer"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('settings.soundAlertsDesc', null, 'Plays synthesized medical alert chime on critical and warning events. Repeating 30s chime for unacknowledged alerts.')}
                </p>
              </div>

              {/* Native Push Channel */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--text)]">
                      {t('settings.browserPushTitle', null, 'Browser Native Notifications')}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[var(--text-muted)]">
                    Status: <span className="font-mono text-[var(--text)]">{browserPermission}</span>
                  </p>
                  {browserPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={() => requestBrowserPermission()}
                      className="px-3 py-1 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(255,98,66,0.25)]"
                    >
                      {t('settings.grantPermissionBtn', null, 'Grant Permission')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Severities Subscriptions */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-muted)]">
                {t('settings.severitiesSubscribed', null, 'Active Alert Severities')}
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'critical', label: 'Critical (Escalations & Missed Doses)', color: 'text-[var(--critical)]' },
                  { id: 'warning', label: 'Warnings (Acute Signs & Fallback)', color: 'text-[var(--warning)]' },
                  { id: 'info', label: 'Info (Plan Ready & Test Alerts)', color: 'text-[var(--info)]' }
                ].map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={severities.includes(s.id)}
                      onChange={() => toggleSeverity(s.id)}
                      className="w-4 h-4 accent-[var(--accent-2)] rounded cursor-pointer"
                    />
                    <span className={`font-semibold ${s.color}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="pt-4 border-t border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--text)]">
                    {t('settings.quietHoursTitle', null, 'Operator Quiet Hours')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                />
              </div>

              {quietHoursEnabled && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] text-xs">
                  <div>
                    <label className="block text-[var(--text-faint)] font-mono text-[11px] mb-1">Start Time</label>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-faint)] font-mono text-[11px] mb-1">End Time</label>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--accent-2)] sm:mt-4 italic">
                    Critical patient escalations will always ring regardless of quiet hours.
                  </p>
                </div>
              )}
            </div>

            {/* Test Trigger Button */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--text)]">
                  {t('settings.testNotifTitle', null, 'Send Test Alert')}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {t('settings.testNotifDesc', null, 'Dispatches an immediate notification to test audio and browser permission.')}
                </p>
              </div>

              <button
                type="button"
                disabled={testSent}
                onClick={handleSendTest}
                className="min-h-[40px] px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-bold rounded-xl border border-[var(--border)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{testSent ? t('settings.testSentBadge', null, 'Dispatched!') : t('settings.sendTestBtn', null, 'Send Test Notification')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Footer Bar */}
      <div className="glass-card border border-[var(--border)] rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[var(--text-muted)]">
          {hasUnsavedChanges
            ? t('settings.pendingChangesDesc', null, 'Unsaved modifications pending. Click Save to persist to hospital database.')
            : t('settings.syncedDesc', null, 'All operator preferences synced with server.')}
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-xl transition cursor-pointer"
            >
              {t('settings.closeBtn', null, 'Close')}
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-settings-btn"
            className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] rounded-xl shadow-[0_0_20px_rgba(255,98,66,0.3)] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('settings.savingBtn', null, 'Saving...') : t('settings.saveBtn', null, 'Save Settings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
