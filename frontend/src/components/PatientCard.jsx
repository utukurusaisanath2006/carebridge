import React from 'react';
import {
  User,
  Building2,
  Calendar,
  AlertOctagon,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatDate, formatNumber } from '../utils/i18nHelpers';

export default function PatientCard({ plan, onOpenEscalation }) {
  const { t, settings } = useSettings();
  if (!plan) return null;

  const currentLang = settings.ui_language || 'en';
  const rawWarnings = plan.urgent_warnings || [];
  const followUpTasks = plan.follow_up_tasks || [];
  const escalatedCount = followUpTasks.filter((t) => t.escalate_to_human).length;
  const completedCount = followUpTasks.filter((t) => t.status === 'Completed').length;

  // Localized dynamic plan content
  const localizedSummary = (currentLang !== 'en' && plan.overall_summary_translations?.[currentLang]) || plan.overall_summary;
  const localizedWarnings = (currentLang !== 'en' && plan.urgent_warnings_translations?.[currentLang]) || rawWarnings;
  const localizedConfidence = (currentLang !== 'en' && plan.confidence_note_translations?.[currentLang]) || plan.confidence_note;

  return (
    <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden transition-all shadow-2xl">
      {/* Patient Header Ribbon */}
      <div className="bg-gradient-to-r from-[#17171e] via-[#101015] to-[#07070a] border-b border-[var(--border)] text-[var(--text)] p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--surface-2)] uppercase tracking-wider text-[var(--accent)] border border-[var(--border)]">
                {t('patient.planTitle', null, 'Discharge Follow-up Plan')}
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--accent-2)]/15 text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                {t('patient.plainLanguageBadge', null, 'Grade-6 Plain Language')}
              </span>
              {plan.diagnosis && (
                <span className="hidden sm:inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
                  {t('patient.dxLabel', { diagnosis: plan.diagnosis.slice(0, 40) }, `Dx: ${plan.diagnosis.slice(0, 40)}`)}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-[var(--text)] flex items-center gap-3">
              <User className="w-7 h-7 text-[var(--accent)] inline" />
              <span>{plan.patient_name || 'Patient'}</span>
            </h1>
          </div>

          {/* Facility & Date Badges */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2.5 bg-[var(--surface)] px-4 py-2 rounded-xl border border-[var(--border)]">
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <div className="text-[10px] font-mono text-[var(--text-faint)] uppercase font-semibold">
                  {t('patient.facilityLabel', null, 'Hospital Facility')}
                </div>
                <div className="font-bold text-[var(--text)] text-xs">{plan.hospital_name || 'Care Facility'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[var(--surface)] px-4 py-2 rounded-xl border border-[var(--border)]">
              <Calendar className="w-4 h-4 text-[var(--accent-2)]" />
              <div>
                <div className="text-[10px] font-mono text-[var(--text-faint)] uppercase font-semibold">
                  {t('patient.dischargeDateLabel', null, 'Discharge Date')}
                </div>
                <div className="font-bold text-[var(--text)] text-xs font-mono">
                  {formatDate(plan.discharge_date, currentLang) || 'N/A'}
                </div>
              </div>
            </div>

            {escalatedCount > 0 && (
              <button
                type="button"
                onClick={onOpenEscalation}
                className="min-h-[44px] flex items-center gap-2 bg-[var(--critical)] hover:opacity-90 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(255,77,94,0.3)] font-mono font-bold text-xs cursor-pointer border border-[var(--critical)]"
              >
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>
                  {t('patient.clinicianReviewsBtn', { count: formatNumber(escalatedCount, currentLang) }, `${escalatedCount} Clinician Reviews`)}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Overall summary in highlighted box */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface)] text-[var(--accent-2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-2)]">
                {t('patient.overviewTitle', null, 'Care Coordinator Overview')}
              </h3>
              <p className="text-base text-[var(--text)] leading-relaxed font-normal">
                {localizedSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Urgent Warnings Red Alert Cards */}
        {localizedWarnings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--critical)] text-xs font-mono font-bold uppercase tracking-wider">
              <span className="px-1.5 py-0.5 rounded bg-[var(--critical)] text-white text-[9px] font-black">URGENT</span>
              <AlertOctagon className="w-4 h-4 text-[var(--critical)]" />
              <span>
                {t('patient.warningsTitle', { count: formatNumber(localizedWarnings.length, currentLang) }, `Immediate Attention & Red Flag Warnings (${localizedWarnings.length})`)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {localizedWarnings.map((warning, index) => (
                <div
                  key={index}
                  className="bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 rounded-xl p-4 flex items-start gap-3 shadow-lg"
                >
                  <AlertOctagon className="w-5 h-5 text-[var(--critical)] shrink-0 mt-0.5" />
                  <div className="text-xs font-bold text-[var(--text)] leading-relaxed">
                    {warning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Note & Transparency Bar */}
        {localizedConfidence && (
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-2)]" />
              <span className="font-bold text-[var(--text)]">
                {t('patient.confidenceTitle', null, 'Audit & Confidence Note:')}
              </span>
              <span className="text-[var(--text-muted)] italic font-sans">{localizedConfidence}</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[var(--text-faint)]">
                {t('patient.completedCountLabel', {
                  completed: formatNumber(completedCount, currentLang),
                  total: formatNumber(followUpTasks.length, currentLang)
                }, `Completed: ${completedCount} / ${followUpTasks.length}`)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
