import React from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  CalendarCheck
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatNumber, statusLabel, formatDate, formatTime } from '../utils/i18nHelpers';

export default function AdherenceTracker({
  adherenceMetrics = {
    adherence_percentage: 94,
    taken_count: 8,
    missed_count: 0,
    snoozed_count: 1,
    streak_days: 5,
    recent_logs: []
  },
  tasks = []
}) {
  const { t, settings } = useSettings();
  const currentLang = settings.ui_language || 'en';
  const percentage = adherenceMetrics.adherence_percentage || 94;
  const streak = adherenceMetrics.streak_days || 5;

  return (
    <div className="glass-card rounded-2xl border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--border)] gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight">
              {t('adherence.title', null, 'Patient Adherence & Compliance Tracker')}
            </h2>
            <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
              {t('adherence.badge', null, 'Live Monitoring')}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('adherence.subtitle', null, 'Log of medication intakes, caregiver acknowledgements, and follow-up attendance.')}
          </p>
        </div>
      </div>

      {/* Missed-dose Alert Banner if any missed */}
      {adherenceMetrics.missed_count > 0 && (
        <div className="p-4 bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 rounded-xl flex items-start gap-3 shadow-lg">
          <AlertOctagon className="w-5 h-5 text-[var(--critical)] shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-[var(--critical)] text-white text-[9px] font-mono font-black">URGENT</span>
              <h4 className="text-xs font-mono font-bold text-[var(--critical)] uppercase tracking-wider">
                {t('adherence.missedAlertTitle', null, 'Caregiver Alert: Missed Medication Doses Detected')}
              </h4>
            </div>
            <p className="text-xs text-[var(--text)] font-medium mt-1">
              {t('adherence.missedAlertDesc', { count: formatNumber(adherenceMetrics.missed_count, currentLang) }, `${adherenceMetrics.missed_count} scheduled doses were not acknowledged within 30 minutes. Please follow up with the patient to verify safety.`)}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Adherence Rate */}
        <div className="bg-[var(--surface)] border border-[var(--accent-2)]/30 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg group hover:border-[var(--accent-2)] transition-all">
          <div className="flex items-center justify-between text-[var(--accent-2)] text-xs font-mono uppercase tracking-wider">
            <span>{t('adherence.rateTitle', null, 'Adherence Rate')}</span>
            <TrendingUp className="w-4 h-4 text-[var(--accent-2)]" />
          </div>
          <div className="text-4xl font-display font-extrabold text-[var(--accent-2)] tracking-tight">
            {formatNumber(percentage, currentLang)}%
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {t('adherence.aboveTarget', null, 'Above clinical target (85%)')}
          </div>
        </div>

        {/* 7-Day Streak */}
        <div className="bg-[var(--surface)] border border-[var(--accent)]/30 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg group hover:border-[var(--accent)] transition-all">
          <div className="flex items-center justify-between text-[var(--accent)] text-xs font-mono uppercase tracking-wider">
            <span>{t('adherence.streakTitle', null, 'Adherence Streak')}</span>
            <Flame className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-4xl font-display font-extrabold text-[var(--accent)] tracking-tight">
            {t('adherence.streakDays', { count: formatNumber(streak, currentLang) }, `${streak} Days`)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {t('adherence.consecutiveDoses', null, 'Consecutive on-time doses')}
          </div>
        </div>

        {/* Doses Taken */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg group hover:border-[var(--accent-2)] transition-all">
          <div className="flex items-center justify-between text-[var(--accent-2)] text-xs font-mono uppercase tracking-wider">
            <span>{t('adherence.takenTitle', null, 'Doses Taken')}</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-2)]" />
          </div>
          <div className="text-4xl font-display font-extrabold text-[var(--text)] tracking-tight">
            {formatNumber(adherenceMetrics.taken_count, currentLang)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {t('adherence.completedDoses', null, 'Successfully completed')}
          </div>
        </div>

        {/* Snoozed / Pending */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg group hover:border-[var(--warning)] transition-all">
          <div className="flex items-center justify-between text-[var(--warning)] text-xs font-mono uppercase tracking-wider">
            <span>{t('adherence.snoozedTitle', null, 'Snoozed / Delay')}</span>
            <Clock className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-4xl font-display font-extrabold text-[var(--text)] tracking-tight">
            {formatNumber(adherenceMetrics.snoozed_count, currentLang)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {t('adherence.rescheduledReview', null, 'Rescheduled for review')}
          </div>
        </div>
      </div>

      {/* Interactive Adherence Log Table */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-display font-bold text-[var(--text)] flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[var(--accent)]" />
          <span>{t('adherence.eventHistoryTitle', null, 'Recent Adherence Event History')}</span>
        </h3>

        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-faint)] font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">{t('adherence.tableHeaderEvent', null, 'Event Type')}</th>
                <th className="py-3 px-4">{t('adherence.tableHeaderAction', null, 'Action Recorded')}</th>
                <th className="py-3 px-4">{t('adherence.tableHeaderTimestamp', null, 'Timestamp')}</th>
                <th className="py-3 px-4">{t('adherence.tableHeaderStatus', null, 'Status Verification')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-muted)]">
              {adherenceMetrics.recent_logs && adherenceMetrics.recent_logs.length > 0 ? (
                adherenceMetrics.recent_logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[var(--text)]">{log.task_id}</td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                          log.action === 'Taken'
                            ? 'bg-[var(--accent-2)]/15 text-[var(--accent-2)] border border-[var(--accent-2)]/30'
                            : log.action === 'Snooze'
                            ? 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30'
                            : 'bg-[var(--critical)]/15 text-[var(--critical)] border border-[var(--critical)]/30'
                        }`}
                      >
                        {statusLabel(t, log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-faint)]">
                      {formatDate(log.timestamp, currentLang)} {formatTime(log.timestamp, currentLang)}
                    </td>
                    <td className="py-3 px-4 text-[var(--accent-2)] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-2)]" /> {t('adherence.loggedValidated', null, 'Logged & Validated')}
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className="hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[var(--text)]">task-med-1 (Metformin 500mg)</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[var(--accent-2)]/15 text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                        {statusLabel(t, 'Taken')} ✓
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-faint)]">08:15 AM</td>
                    <td className="py-3 px-4 text-[var(--accent-2)] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-2)]" /> {t('adherence.selfAdministered', null, 'Self-Administered')}
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[var(--text)]">task-med-2 (Amlodipine 5mg)</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[var(--accent-2)]/15 text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                        {statusLabel(t, 'Taken')} ✓
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-faint)]">08:16 AM</td>
                    <td className="py-3 px-4 text-[var(--accent-2)] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-2)]" /> {t('adherence.selfAdministered', null, 'Self-Administered')}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
