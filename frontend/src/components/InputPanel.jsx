import React, { useState } from 'react';
import { FileText, Play, RefreshCw, Sparkles, Check, AlertCircle, Database } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function InputPanel({
  dischargeText,
  setDischargeText,
  onAnalyze,
  onLoadSample,
  loading,
  disabled
}) {
  const { t } = useSettings();
  const [selectedSampleType, setSelectedSampleType] = useState('diabetes');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleSampleChange = (type) => {
    setSelectedSampleType(type);
    onLoadSample(type);
  };

  const handleClear = () => {
    setDischargeText('');
  };

  return (
    <div className="glass-card rounded-2xl border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[var(--border)] gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center border border-[var(--border)] shadow-[0_0_15px_rgba(255,98,66,0.15)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-[var(--text)] tracking-tight">{t('intake.rawTextTitle', null, 'Synthetic Discharge Summary Input')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('intake.rawTextHint', null, 'Paste unformatted clinical notes or load verified demo cases')}</p>
          </div>
        </div>

        {/* Quick sample loader pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" /> {t('intake.tabSample', null, 'Presets')}:
          </span>
          <button
            type="button"
            onClick={() => handleSampleChange('diabetes')}
            disabled={loading}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
              selectedSampleType === 'diabetes' && dischargeText.includes('Ramesh')
                ? 'bg-[var(--accent)] text-[#050505] font-bold shadow-[0_0_15px_rgba(255,98,66,0.25)]'
                : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}
          >
            {t('intake.sampleDiabetes', null, 'Ramesh Kumar (Diabetes)')}
          </button>
          <button
            type="button"
            onClick={() => handleSampleChange('cardiac')}
            disabled={loading}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
              selectedSampleType === 'cardiac' && dischargeText.includes('Sunita')
                ? 'bg-[var(--accent)] text-[#050505] font-bold shadow-[0_0_15px_rgba(255,98,66,0.25)]'
                : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}
          >
            {t('intake.sampleCardiac', null, 'Sunita Patel (Cardiac Post-PCI)')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={dischargeText}
            onChange={(e) => setDischargeText(e.target.value)}
            disabled={loading}
            rows={9}
            placeholder={t('intake.pastePlaceholder', null, 'Paste hospital discharge summary text here...')}
            className="w-full p-4 text-sm font-mono text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none transition-all placeholder-[var(--text-faint)] leading-relaxed resize-y"
          />

          {dischargeText && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-2.5 py-1 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
                title={t('intake.clear', null, 'Clear')}
              >
                {t('intake.clear', null, 'Clear')}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] w-full sm:w-auto">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-2)] shadow-[0_0_8px_rgba(85,214,162,0.8)]"></span>
            <span>{dischargeText ? `${dischargeText.length} characters` : t('intake.noText', null, 'No text loaded')}</span>
            <span className="hidden sm:inline text-[var(--border)]">•</span>
            <span className="hidden sm:inline text-[var(--text-faint)]">{t('intake.syntheticTag', null, '100% Synthetic Demo Data')}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSampleChange(selectedSampleType)}
              disabled={loading}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[var(--accent)] ${loading ? 'animate-spin' : ''}`} />
              {t('intake.loadSample', null, 'Load Sample')}
            </button>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={loading || !dischargeText.trim()}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] shadow-[0_0_25px_rgba(255,98,66,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('intake.extracting', null, 'Agent Processing...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('intake.generatePlan', null, 'Generate Follow-up Plan')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
