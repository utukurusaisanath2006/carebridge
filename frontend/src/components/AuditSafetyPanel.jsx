import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
  ruleMessage,
  ruleAction,
  auditMessage,
  formatNumber,
  formatDate,
  formatTime
} from '../utils/i18nHelpers';

export default function AuditSafetyPanel({
  safetyFlags = [],
  auditLog = []
}) {
  const { t, settings } = useSettings();
  const currentLang = settings.ui_language || 'en';

  return (
    <div className="glass-card rounded-2xl border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="pb-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight">
            {t('audit.title', null, 'Clinical Safety Layer & Audit Trail')}
          </h2>
          <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
            {t('audit.badge', null, 'Deterministic Rule Engine')}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t('audit.subtitle', null, 'Automated cross-check for duplicate medicines, missing strengths, ambiguous timing, and clinician modification history.')}
        </p>
      </div>

      {/* Safety Rule Flags Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-[var(--text)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--critical)]" />
            <span>
              {t('audit.checksTitle', { count: formatNumber(safetyFlags.length, currentLang) }, `Drug-Safety Rule Checks (${safetyFlags.length} Triggered)`)}
            </span>
          </h3>
          <span className="text-xs font-mono text-[var(--text-faint)]">
            {t('audit.deterministicTag', null, 'Deterministic Safeguards (Non-AI)')}
          </span>
        </div>

        {safetyFlags.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {safetyFlags.map((flag, idx) => {
              const localizedMsg = ruleMessage(t, flag.code, flag.params, flag.message);
              const localizedAction = ruleAction(t, flag.code, flag.params, flag.action_required);

              return (
                <div
                  key={flag.flag_id || idx}
                  className="p-4 rounded-xl border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 bg-[var(--critical)]/10 space-y-2.5 shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[var(--critical)] flex items-center gap-1.5 uppercase tracking-wider text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--critical)] text-white text-[9px] font-black">URGENT</span>
                      <AlertTriangle className="w-4 h-4 text-[var(--critical)]" />
                      {flag.rule_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--critical)] text-white">
                      {flag.severity}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[var(--text)] leading-relaxed">
                    {localizedMsg}
                  </p>

                  <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)] font-medium">
                    <strong className="text-[var(--text)]">{t('audit.actionRequiredLabel', null, 'Clinical Action Required:')}</strong> {localizedAction}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 rounded-xl text-[var(--accent-2)] text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-2)] shrink-0" />
            <span className="font-medium">{t('audit.noFlagsText', null, 'No duplicate medications, missing dosages, or timing ambiguities detected.')}</span>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-[var(--text)] flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent)]" />
            <span>{t('audit.trailTitle', null, 'Clinical Modification & Review Trail')}</span>
          </h3>
          <span className="text-xs font-mono text-[var(--text-faint)]">{t('audit.fdaNotice', null, 'FDA 21 CFR Part 11 compliant audit')}</span>
        </div>

        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-faint)] font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">{t('audit.colTimestamp', null, 'Timestamp (UTC)')}</th>
                <th className="py-3 px-4">{t('audit.colActor', null, 'Actor / Clinician')}</th>
                <th className="py-3 px-4">{t('audit.colAction', null, 'Action')}</th>
                <th className="py-3 px-4">{t('audit.colDetails', null, 'Details & Notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-muted)]">
              {auditLog.length > 0 ? (
                auditLog.map((entry, idx) => {
                  const localizedDetails = auditMessage(t, entry.code, entry.params, entry.details || '—');

                  return (
                    <tr key={idx} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[var(--text-faint)] text-[11px]">
                        {formatDate(entry.timestamp, currentLang)} {formatTime(entry.timestamp, currentLang)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text)]">{entry.actor}</td>
                      <td className="py-3 px-4 font-mono text-xs text-[var(--accent-2)]">{entry.action}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{localizedDetails}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--text-faint)] italic">
                    {t('audit.emptyAudit', null, 'No clinical edits logged yet. Initial intake audit recorded upon plan generation.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
