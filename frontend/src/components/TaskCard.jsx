import React, { useState } from 'react';
import {
  Pill,
  Calendar,
  FlaskConical,
  Utensils,
  Bandage,
  AlertTriangle,
  UserCheck,
  Building2,
  ChevronDown,
  Volume2,
  FileSearch,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { readAloudText } from '../utils/alarmSound';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { taskTypeLabel, statusLabel, mealRelationLabel, formatTime } from '../utils/i18nHelpers';

const TYPE_CONFIG = {
  Medication: {
    icon: Pill,
    badgeBg: 'bg-[#FF6242]/15',
    badgeText: 'text-[#FF6242]',
    badgeBorder: 'border-[#FF6242]/30',
    accentBorder: 'border-l-[#FF6242]',
  },
  Appointment: {
    icon: Calendar,
    badgeBg: 'bg-[#7FB2FF]/15',
    badgeText: 'text-[#7FB2FF]',
    badgeBorder: 'border-[#7FB2FF]/30',
    accentBorder: 'border-l-[#7FB2FF]',
  },
  Test: {
    icon: FlaskConical,
    badgeBg: 'bg-[#F5B94A]/15',
    badgeText: 'text-[#F5B94A]',
    badgeBorder: 'border-[#F5B94A]/30',
    accentBorder: 'border-l-[#F5B94A]',
  },
  Diet: {
    icon: Utensils,
    badgeBg: 'bg-[#55D6A2]/15',
    badgeText: 'text-[#55D6A2]',
    badgeBorder: 'border-[#55D6A2]/30',
    accentBorder: 'border-l-[#55D6A2]',
  },
  'Wound Care': {
    icon: Bandage,
    badgeBg: 'bg-[#55D6A2]/15',
    badgeText: 'text-[#55D6A2]',
    badgeBorder: 'border-[#55D6A2]/30',
    accentBorder: 'border-l-[#55D6A2]',
  },
  'Warning Sign': {
    icon: AlertTriangle,
    badgeBg: 'bg-[#FF4D5E]/20',
    badgeText: 'text-[#FF4D5E]',
    badgeBorder: 'border-[#FF4D5E]/40',
    accentBorder: 'border-l-[#FF4D5E]',
  },
  Referral: {
    icon: UserCheck,
    badgeBg: 'bg-[#7FB2FF]/15',
    badgeText: 'text-[#7FB2FF]',
    badgeBorder: 'border-[#7FB2FF]/30',
    accentBorder: 'border-l-[#7FB2FF]',
  },
};

export default function TaskCard({
  task,
  onUpdateStatus,
  onViewSource
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const { canReview } = useAuth();
  const currentLang = settings.ui_language || 'en';
  const [isUpdating, setIsUpdating] = useState(false);

  const extraLangs = (settings.enabled_languages || []).filter(l => l !== 'en');

  const typeConfig = TYPE_CONFIG[task.type] || {
    icon: FlaskConical,
    badgeBg: 'bg-white/10',
    badgeText: 'text-cb-text',
    badgeBorder: 'border-cb-border',
    accentBorder: 'border-l-cb-borderStrong',
  };

  const IconComponent = typeConfig.icon;

  const handleStatusChange = async (newStatus) => {
    if (!canReview || newStatus === task.status) return;
    setIsUpdating(true);
    await onUpdateStatus(task.id, newStatus);
    setIsUpdating(false);
  };

  const handleSpeak = (specificLang = null) => {
    const langToUse = specificLang || currentLang;
    let textToSpeak = task.simple_language;

    if (langToUse !== 'en') {
      const trans = task.translations?.[langToUse]
        || (langToUse === 'hi' ? task.hindi_translation : null)
        || (langToUse === 'ta' ? task.tamil_translation : null);
      if (trans) textToSpeak = trans;
    }

    readAloudText(textToSpeak, langToUse);
  };

  // Primary text localized to user's active language
  const primaryText = (currentLang !== 'en' && task.translations?.[currentLang])
    ? task.translations[currentLang]
    : task.simple_language;

  // Localized escalation reason
  const localizedEscalationReason = (currentLang !== 'en' && task.escalation_reason_translations?.[currentLang])
    ? task.escalation_reason_translations[currentLang]
    : (task.escalation_reason || t('escalation.sensitiveOrder', null, 'Identified as clinically sensitive or ambiguous.'));

  return (
    <div
      className={`task-card-print glass-card border border-cb-border border-l-4 ${typeConfig.accentBorder} p-5 shadow-sm hover:shadow-delicate transition-all relative ${
        task.status === 'Completed' ? 'opacity-85' : ''
      }`}
    >
      {/* Top Header: Badge, Due Date, Times, Status Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-cb-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-mono font-bold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            {taskTypeLabel(t, task.type)}
          </span>

          {/* Structured clock slots */}
          {task.times_of_day && task.times_of_day.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#55D6A2] bg-[#55D6A2]/10 border border-[#55D6A2]/30 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-[#55D6A2]" />
              {task.times_of_day.map(time => formatTime(time, currentLang)).join(', ')}
            </span>
          )}

          {task.meal_relation && task.meal_relation !== 'none' && (
            <span className="text-[10px] font-mono font-semibold text-cb-textMuted bg-cb-surface2 px-2 py-0.5 rounded-md border border-cb-border">
              {mealRelationLabel(t, task.meal_relation)}
            </span>
          )}

          {task.due_date && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-cb-textMuted bg-cb-surface2 px-2 py-0.5 rounded-md border border-cb-border">
              <Calendar className="w-3 h-3 text-cb-textMuted" />
              {task.due_date}
            </span>
          )}

          {task.provider_or_facility && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-cb-textMuted bg-cb-surface2 px-2 py-0.5 rounded-md border border-cb-border">
              <Building2 className="w-3 h-3 text-cb-textMuted" />
              {task.provider_or_facility}
            </span>
          )}
        </div>

        {/* Action icons & Status Selector */}
        <div className="flex items-center gap-2">
          {/* Read Aloud button */}
          <button
            type="button"
            onClick={() => handleSpeak()}
            className="p-2 text-cb-textMuted hover:text-[#55D6A2] hover:bg-white/10 rounded-control transition-colors cursor-pointer"
            title={t('alarm.readAloud', null, 'Read instruction aloud (SpeechSynthesis)')}
            aria-label="Read instruction aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Traceability View Source button */}
          <button
            type="button"
            onClick={() => onViewSource && onViewSource(task)}
            className="p-2 text-cb-textMuted hover:text-[#FF6242] hover:bg-white/10 rounded-control transition-colors cursor-pointer"
            title={t('sourceTrace.title', null, 'View source line highlighted in original discharge summary')}
            aria-label="Trace in original clinical note"
          >
            <FileSearch className="w-4 h-4" />
          </button>

          {/* Status Dropdown */}
          <div className="relative inline-block text-left">
            <select
              value={task.status || 'Pending'}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating || !canReview}
              className={`text-xs font-mono font-bold rounded-control px-2.5 py-1.5 border transition-all cursor-pointer outline-none appearance-none pr-6 ${
                task.status === 'Completed'
                  ? 'bg-[#55D6A2]/20 text-[#55D6A2] border-[#55D6A2]/40'
                  : task.status === 'Needs Review'
                  ? 'bg-[#7FB2FF]/20 text-[#7FB2FF] border-[#7FB2FF]/40'
                  : task.status === 'Skipped'
                  ? 'bg-white/10 text-cb-textMuted border-cb-border'
                  : 'bg-[#F5B94A]/20 text-[#F5B94A] border-[#F5B94A]/40'
              }`}
            >
              <option value="Pending" className="bg-[#050505]">{statusLabel(t, 'Pending')}</option>
              <option value="Completed" className="bg-[#050505]">{statusLabel(t, 'Completed')}</option>
              <option value="Needs Review" className="bg-[#050505]">{statusLabel(t, 'Needs Review')}</option>
              <option value="Skipped" className="bg-[#050505]">{statusLabel(t, 'Skipped')}</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 pointer-events-none opacity-60 text-cb-text" />
          </div>
        </div>
      </div>

      {/* Main Body - Body text never goes below 16px! */}
      <div className="mt-4 space-y-2.5">
        {/* Primary instruction text (>= 16px) */}
        <div className="text-base sm:text-lg font-bold text-cb-text leading-snug">
          {primaryText}
        </div>

        {/* English reference when active UI language is not English */}
        {currentLang !== 'en' && task.simple_language && task.simple_language !== primaryText && (
          <div className="text-xs text-cb-textMuted italic bg-cb-surface2 p-2.5 rounded-control border border-cb-border">
            <span className="font-mono font-bold text-[#FF6242] mr-2 not-italic text-[10px] uppercase">EN:</span>
            {task.simple_language}
          </div>
        )}

        {/* Extra Enabled Multilingual Translations */}
        {extraLangs.filter(l => l !== currentLang).length > 0 && (
          <div className="space-y-1.5 pt-1">
            {extraLangs.filter(l => l !== currentLang).map((langCode) => {
              const meta = supportedLanguages.find(l => l.code === langCode);
              const transText = task.translations?.[langCode]
                || (langCode === 'hi' ? task.hindi_translation : null)
                || (langCode === 'ta' ? task.tamil_translation : null);

              if (!transText) return null;

              return (
                <div
                  key={langCode}
                  className="text-xs text-cb-text bg-cb-surface2 p-2.5 rounded-control border border-cb-border flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-white/10 text-[#55D6A2] rounded shrink-0 uppercase">
                      {meta?.code || langCode}
                    </span>
                    <span style={meta?.font ? { fontFamily: meta.font } : {}} className="leading-relaxed">
                      {transText}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSpeak(langCode)}
                    className="p-1 text-cb-textMuted hover:text-[#55D6A2] rounded transition shrink-0 cursor-pointer"
                    title={`Read aloud in ${meta?.name || langCode}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* CLINICAL SAFETY: Prominent High-Contrast Escalation Banner */}
        {task.escalate_to_human && (
          <div className="mt-3 p-3.5 rounded-control bg-[#FF4D5E]/15 border-2 border-[#FF4D5E] text-cb-text flex items-start gap-3 shadow-sm">
            <div className="p-1 rounded bg-[#FF4D5E] text-[#050505] shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide-mono bg-[#FF4D5E] text-[#050505] px-1.5 py-0.5 rounded">
                  HUMAN REVIEW REQUIRED
                </span>
                <span className="text-xs font-bold text-[#FF4D5E]">
                  {t('escalation.clinicianSignoffNeeded', null, 'Clinician Sign-off Required')}
                </span>
              </div>
              <p className="text-xs text-cb-text leading-relaxed mt-1">
                {localizedEscalationReason}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
