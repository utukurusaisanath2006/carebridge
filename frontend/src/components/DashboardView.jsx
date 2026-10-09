import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  HeartPulse,
  Sparkles,
  TrendingUp,
  FilePlus,
  Zap
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { taskTypeLabel, statusLabel, formatDate, formatTime, formatNumber } from '../utils/i18nHelpers';

export default function DashboardView({
  plan,
  adherenceMetrics = { adherence_percentage: 94 },
  onNavigate,
  onTriggerAlarm
}) {
  const { t, settings } = useSettings();
  if (!plan) return null;

  const currentLang = settings.ui_language || 'en';
  const tasks = plan.follow_up_tasks || [];
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const escalatedCount = tasks.filter((t) => t.escalate_to_human).length;

  // Localized dynamic plan content
  const localizedSummary = (currentLang !== 'en' && plan.overall_summary_translations?.[currentLang]) || plan.overall_summary;
  const rawWarnings = plan.urgent_warnings || [];
  const localizedWarnings = (currentLang !== 'en' && plan.urgent_warnings_translations?.[currentLang]) || rawWarnings;

  // Identify next upcoming task
  const nextTask = tasks.find((t) => t.status === 'Pending') || tasks[0];
  const localizedNextTaskText = nextTask ? ((currentLang !== 'en' && nextTask.translations?.[currentLang]) || nextTask.simple_language) : '';

  return (
    <div className="space-y-6">
      {/* Patient Greeting & Status Ribbon */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden shadow-delicate">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-white/10 text-cb-text border border-cb-border">
                {t('dashboard.clinicalOverview', null, 'Clinical Overview')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-[#55D6A2]/15 text-[#55D6A2] border border-[#55D6A2]/30">
                {t('dashboard.plainLanguageActive', null, 'Grade-6 Plain Language Active')}
              </span>
            </div>
            
            <h1 className="font-syne font-extrabold text-2xl sm:text-3xl text-cb-text tracking-tight-syne flex items-center gap-3">
              <User className="w-6 h-6 text-[#FF6242]" />
              <span>{plan.patient_name}</span>
            </h1>

            <p className="text-xs text-cb-textMuted max-w-xl leading-relaxed">
              {t('dashboard.dischargedOn', {
                hospital: plan.hospital_name,
                date: formatDate(plan.discharge_date, currentLang)
              }, `Discharged from ${plan.hospital_name} on ${plan.discharge_date}. All care orders and schedules are coordinated below.`)}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('intake')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold bg-[#FF6242] text-[#050505] hover:bg-[#FF7B60] shadow-glow-coral cursor-pointer transition-all"
            >
              <FilePlus className="w-4 h-4 text-[#050505]" />
              <span>{t('dashboard.newIntake', null, 'New Intake')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-semibold bg-cb-surface2 hover:bg-white/10 text-cb-text border border-cb-border hover:border-cb-borderStrong cursor-pointer transition-all"
            >
              <Clock className="w-4 h-4 text-[#55D6A2]" />
              <span>{t('dashboard.viewTodaySchedule', null, "View Today's Schedule")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Big Syne Numerals and Mono Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Actions */}
        <div
          onClick={() => onNavigate('plan')}
          className="glass-card glass-card-interactive p-5 cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cb-textMuted uppercase tracking-wide-mono">
            <span>{t('dashboard.pendingTasks', null, 'Pending Tasks')}</span>
            <Clock className="w-4 h-4 text-[#F5B94A]" />
          </div>
          <div className="font-syne font-extrabold text-3xl sm:text-4xl text-cb-text">
            {formatNumber(pendingCount, currentLang)}
          </div>
          <div className="text-[11px] text-cb-textMuted">
            {t('dashboard.requiresFulfillment', null, 'Requires fulfillment')}
          </div>
        </div>

        {/* Completed Actions */}
        <div
          onClick={() => onNavigate('plan')}
          className="glass-card glass-card-interactive p-5 cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cb-textMuted uppercase tracking-wide-mono">
            <span>{t('dashboard.completedTasks', null, 'Completed')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#55D6A2]" />
          </div>
          <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#55D6A2]">
            {formatNumber(completedCount, currentLang)}
          </div>
          <div className="text-[11px] text-cb-textMuted">
            {t('dashboard.documentedAsTaken', null, 'Documented as taken')}
          </div>
        </div>

        {/* Human Escalations */}
        <div
          onClick={() => onNavigate('escalations')}
          className="glass-card glass-card-interactive p-5 cursor-pointer space-y-1.5 border-l-4 border-l-[#FF4D5E]"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#FF4D5E] uppercase tracking-wide-mono">
            <span>{t('dashboard.escalationsTitle', null, 'Escalations')}</span>
            <AlertTriangle className="w-4 h-4 text-[#FF4D5E]" />
          </div>
          <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#FF4D5E]">
            {formatNumber(escalatedCount, currentLang)}
          </div>
          <div className="text-[11px] text-[#FF4D5E]/90 font-semibold flex items-center gap-1 font-mono uppercase">
            <span>URGENT •</span>
            <span>{t('dashboard.clinicianReviewNeeded', null, 'Clinician review needed')}</span>
          </div>
        </div>

        {/* Adherence Rate */}
        <div
          onClick={() => onNavigate('adherence')}
          className="glass-card glass-card-interactive p-5 cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cb-textMuted uppercase tracking-wide-mono">
            <span>{t('dashboard.adherenceRate', null, 'Adherence Rate')}</span>
            <TrendingUp className="w-4 h-4 text-[#55D6A2]" />
          </div>
          <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#55D6A2]">
            {formatNumber(adherenceMetrics.adherence_percentage || 94, currentLang)}%
          </div>
          <div className="text-[11px] text-[#55D6A2] font-mono">
            {t('dashboard.safeThreshold', null, 'Safe threshold (>85%)')}
          </div>
        </div>
      </div>

      {/* Next Upcoming Action Card */}
      {nextTask && (
        <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#55D6A2]/15 border border-[#55D6A2]/30 text-[#55D6A2] flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wide-mono bg-[#55D6A2]/20 text-[#55D6A2] border border-[#55D6A2]/30 px-2 py-0.5 rounded">
                  {t('dashboard.nextScheduledTitle', null, 'Next Scheduled Action')}
                </span>
                {nextTask.times_of_day?.[0] && (
                  <span className="text-xs font-mono font-bold text-cb-text">
                    {t('dashboard.atTime', { time: formatTime(nextTask.times_of_day[0], currentLang) }, `At ${nextTask.times_of_day[0]}`)}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-cb-text mt-1.5">
                {localizedNextTaskText}
              </h3>
              <p className="text-xs text-cb-textMuted font-mono mt-0.5">
                {t('dashboard.typeStatus', {
                  type: taskTypeLabel(t, nextTask.type),
                  status: statusLabel(t, nextTask.status)
                }, `Type: ${nextTask.type} • Status: ${nextTask.status}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onTriggerAlarm(nextTask)}
              className="px-3.5 py-2 rounded-control text-xs font-bold text-[#FF6242] bg-[#FF6242]/15 hover:bg-[#FF6242] hover:text-[#050505] border border-[#FF6242]/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('dashboard.testAlarmBtn', null, 'Test Alarm')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="px-3.5 py-2 rounded-control text-xs font-semibold text-cb-text bg-cb-surface2 hover:bg-white/10 border border-cb-border hover:border-cb-borderStrong transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{t('dashboard.scheduleBtn', null, 'Schedule')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Urgent Warnings Red Alert Cards (Critical Status Rule: Not by color alone) */}
      {localizedWarnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#FF4D5E] text-xs font-mono font-bold uppercase tracking-wide-mono">
            <AlertOctagon className="w-4 h-4 text-[#FF4D5E]" />
            <span>
              {t('dashboard.urgentWarningsTitle', { count: formatNumber(localizedWarnings.length, currentLang) }, `Immediate Emergency Warnings & Red Flags (${localizedWarnings.length})`)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localizedWarnings.map((warning, index) => (
              <div
                key={index}
                className="bg-[#FF4D5E]/10 border-l-4 border-l-[#FF4D5E] border-y border-r border-cb-border rounded-r-2xl p-4 flex items-start gap-3 shadow-sm"
              >
                <div className="p-1 rounded bg-[#FF4D5E]/20 text-[#FF4D5E] shrink-0 mt-0.5">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono font-extrabold text-[#FF4D5E] uppercase tracking-wide-mono">
                    URGENT WARNING
                  </div>
                  <div className="text-xs font-bold text-cb-text leading-relaxed">
                    {warning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plain Language Care Coordinator Overview Box */}
      <div className="glass-card p-5 space-y-2 border-l-4 border-l-[#55D6A2]">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wide-mono text-[#55D6A2] flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-[#55D6A2]" />
          <span>{t('dashboard.physicianSummaryTitle', null, 'Physician Summary (Grade-6 Plain Language)')}</span>
        </h3>
        <p className="text-sm text-cb-text leading-relaxed">
          {localizedSummary}
        </p>
      </div>
    </div>
  );
}
