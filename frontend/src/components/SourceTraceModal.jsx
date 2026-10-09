import React from 'react';
import { X, FileText, ShieldCheck, Tag } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { taskTypeLabel } from '../utils/i18nHelpers';

export default function SourceTraceModal({
  isOpen,
  onClose,
  task,
  fullDischargeText = ''
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const currentLang = settings.ui_language || 'en';

  if (!isOpen || !task) return null;

  const extraLangs = (settings.enabled_languages || []).filter((l) => l !== 'en');
  const sourceLine = (task.source_line || task.original_text || '').trim();

  const primaryText = (currentLang !== 'en' && task.translations?.[currentLang])
    ? task.translations[currentLang]
    : task.simple_language;

  // Highlight matching source line in original discharge text
  const renderHighlightedSummary = () => {
    if (!fullDischargeText) {
      return (
        <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 whitespace-pre-wrap">
          <mark className="bg-amber-200 text-amber-950 px-1 py-0.5 rounded font-bold">
            {sourceLine}
          </mark>
        </div>
      );
    }

    const lines = fullDischargeText.split('\n');

    return (
      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto space-y-1">
        {lines.map((line, idx) => {
          const isMatch = sourceLine && (
            line.trim() === sourceLine ||
            line.includes(sourceLine) ||
            sourceLine.includes(line.trim())
          );

          return (
            <div
              key={idx}
              className={`px-2 py-1 rounded transition-colors ${
                isMatch
                  ? 'bg-amber-500/30 text-amber-200 border-l-4 border-amber-400 font-semibold pl-3'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-slate-600 mr-3 select-none text-[10px]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-card bg-[#0d0d12] rounded-2xl shadow-2xl border border-[var(--border)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,98,66,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[var(--text)] flex items-center gap-2">
                <span>{t('sourceTrace.title', null, 'Clinical Evidence & Traceability')}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--surface)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                  {taskTypeLabel(t, task.type)}
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('sourceTrace.subtitle', null, "Verifiable link between AI generated task and physician's exact words")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded-xl cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Extracted Task Card */}
          <div className="bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 rounded-2xl p-4 space-y-2.5 shadow-lg">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-2)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-2)]" />
              {t('sourceTrace.taskOrderTitle', null, 'Generated Plain Language Order:')}
            </div>
            <div className="text-base font-medium text-[var(--text)] leading-relaxed">
              {primaryText}
            </div>
            {extraLangs.filter(l => l !== currentLang).map((langCode) => {
              const meta = supportedLanguages.find((l) => l.code === langCode);
              const transText = task.translations?.[langCode]
                || (langCode === 'hi' ? task.hindi_translation : null)
                || (langCode === 'ta' ? task.tamil_translation : null);
              if (!transText) return null;
              return (
                <div key={langCode} className="text-xs text-[var(--text-muted)] italic font-sans bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)] indic-text">
                  <span className="font-semibold not-italic text-[var(--accent)] mr-1.5 font-mono">{meta?.native || langCode}:</span> {transText}
                </div>
              );
            })}
          </div>

          {/* Original Source Evidence */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--text)]">
                <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                {t('sourceTrace.evidenceTitle', null, 'Original Document Text (Highlighted Evidence):')}
              </span>
              <span className="text-[11px] text-[var(--text-faint)]">
                {t('sourceTrace.auditedAgainst', null, 'Audited against synthetic hospital chart')}
              </span>
            </div>

            {renderHighlightedSummary()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-mono text-[11px]">{t('sourceTrace.complianceNotice', null, 'Traceability verification protocol (FDA & HIPAA AI compliance)')}</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] font-bold shadow-[0_0_15px_rgba(255,98,66,0.25)] cursor-pointer transition-all"
          >
            {t('sourceTrace.doneBtn', null, 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}
