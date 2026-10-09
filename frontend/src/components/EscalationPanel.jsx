import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle,
  ShieldAlert,
  User,
  Clock
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { taskTypeLabel, statusLabel, formatNumber, formatTime } from '../utils/i18nHelpers';

export default function EscalationPanel({
  isOpen,
  onClose,
  tasks = [],
  onUpdateStatus
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const { user, canReview } = useAuth();
  const currentLang = settings.ui_language || 'en';
  const [reviewerName, setReviewerName] = useState(user?.name ? `${user.name} (${user.role})` : 'Nurse Joy (RN)');
  const [reviewNote, setReviewNote] = useState('');

  if (!isOpen) return null;

  const extraLangs = (settings.enabled_languages || []).filter((l) => l !== 'en');
  const escalatedTasks = tasks.filter((tItem) => tItem.escalate_to_human);

  const handleReviewTask = (taskId) => {
    if (!canReview) return;
    onUpdateStatus(taskId, 'Completed', reviewerName, reviewNote || 'Clinical human review confirmed.');
  };


  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-lg bg-[#0d0d0f] shadow-2xl flex flex-col h-full border-l border-[var(--border)] z-10 animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--critical)]/15 border border-[var(--critical)]/30 text-[var(--critical)] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,77,94,0.25)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-[var(--text)]">
                  {t('escalation.title', null, 'Clinical Escalations')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider bg-[var(--critical)] text-white shadow-[0_0_10px_rgba(255,77,94,0.4)]">
                  {t('escalation.flaggedBadge', { count: formatNumber(escalatedTasks.length, currentLang) }, `${escalatedTasks.length} Flagged`)}
                </span>
              </div>
              <p className="text-xs text-[var(--critical)] font-mono font-medium mt-0.5">
                {t('escalation.humanProtocol', null, '👩‍⚕️ Human Reviewer Required Protocol')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsible AI Guidance Banner */}
        <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--text)]">{t('escalation.bannerTitle', null, 'Human-in-the-Loop Protocol:')}</strong>{' '}
            {t('escalation.bannerBody', null, 'AI agents must never diagnose or alter medications autonomously. When instructions contain emergency thresholds, ambiguities, or patient barriers, human verification is mandatory.')}
          </p>
        </div>

        {/* Reviewer Input Field */}
        <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--border)] space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] block">
            {t('escalation.clinicianNameLabel', null, 'Signing Clinician Name:')}
          </label>
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[var(--text-faint)]" />
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="flex-1 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl px-3.5 py-2 outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 font-medium placeholder-[var(--text-faint)]"
              placeholder={t('escalation.clinicianPlaceholder', null, 'e.g. Dr. Priya Sharma / Nurse Joy, RN')}
            />
          </div>
        </div>

        {/* Escalated Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {escalatedTasks.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-2)]/15 border border-[var(--accent-2)]/30 text-[var(--accent-2)] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(85,214,162,0.2)]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-display font-semibold text-[var(--text)]">
                {t('escalation.emptyTitle', null, 'All Items Cleared')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                {t('escalation.emptyDesc', null, 'No items currently require human clinical escalation.')}
              </p>
            </div>
          ) : (
            escalatedTasks.map((task) => {
              const primaryText = (currentLang !== 'en' && task.translations?.[currentLang])
                ? task.translations[currentLang]
                : task.simple_language;
              const reason = (currentLang !== 'en' && task.escalation_reason_translations?.[currentLang])
                ? task.escalation_reason_translations[currentLang]
                : (task.escalation_reason || t('escalation.defaultReason', null, 'Identified as requiring human medical review.'));

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border-l-4 border-l-[var(--critical)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl space-y-3.5 hover:border-[var(--border-strong)] transition-all"
                >
                  {/* Rationale Card */}
                  <div className="bg-[var(--critical)]/10 border border-[var(--critical)]/30 rounded-xl p-3">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--critical)] flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--critical)] text-white text-[9px] font-black">URGENT</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--critical)]" />
                      {t('escalation.rationaleLabel', null, 'Escalation Rationale:')}
                    </div>
                    <div className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                      {reason}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
                        {taskTypeLabel(t, task.type)}
                      </span>
                      {task.times_of_day?.[0] && (
                        <span className="text-[10px] text-[var(--text-faint)] font-mono">
                          {t('escalation.slotLabel', { slot: formatTime(task.times_of_day[0], currentLang) }, `Slot: ${task.times_of_day[0]}`)}
                        </span>
                      )}
                    </div>

                    <p className="text-base font-medium text-[var(--text)] leading-relaxed">
                      {primaryText}
                    </p>

                    {extraLangs.filter(l => l !== currentLang).map((langCode) => {
                      const meta = supportedLanguages.find((l) => l.code === langCode);
                      const transText = task.translations?.[langCode]
                        || (langCode === 'hi' ? task.hindi_translation : null)
                        || (langCode === 'ta' ? task.tamil_translation : null);
                      if (!transText) return null;
                      return (
                        <p key={langCode} className="text-xs text-[var(--text-muted)] italic mt-1.5 bg-[var(--surface-2)] p-2.5 rounded-xl border border-[var(--border)] indic-text">
                          <span className="font-semibold not-italic text-[var(--accent-2)] mr-1.5 font-mono">
                            {meta?.native || langCode}:
                          </span>
                          {transText}
                        </p>
                      );
                    })}

                    <div className="mt-2.5 text-[11px] font-mono text-[var(--text-faint)] bg-[var(--surface-2)] p-2.5 rounded-xl border border-[var(--border)]">
                      {t('sourceTrace.sourceLine', null, 'Source')}: "{task.source_line || task.original_text}"
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {t('escalation.statusLabel', null, 'Status: ')}
                      <strong className="text-[var(--warning)] ml-1">{statusLabel(t, task.status)}</strong>
                    </span>

                    {canReview ? (
                      <button
                        type="button"
                        onClick={() => handleReviewTask(task.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] shadow-[0_0_15px_rgba(255,98,66,0.25)] cursor-pointer transition-all min-h-[40px]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t('escalation.signOffBtn', null, 'Sign Off as Reviewed')}</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-mono bg-[var(--surface-2)] text-[var(--text-faint)] rounded-xl border border-[var(--border)]">
                        {t('escalation.readOnlyNotice', null, 'Clinician Sign-off Required (Read-Only)')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-mono text-[11px]">{t('nav.appSubtitle', null, 'Responsible AI Clinical Safeguard')}</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] font-semibold cursor-pointer transition-all"
          >
            {t('common.close', null, 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
