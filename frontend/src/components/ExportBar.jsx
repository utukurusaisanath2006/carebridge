import React, { useState } from 'react';
import {
  Download,
  FileJson,
  Printer,
  Calendar,
  Share2,
  Check
} from 'lucide-react';
import { downloadIcsCalendar } from '../utils/icsExporter';
import { useSettings } from '../context/SettingsContext';
import { formatNumber, formatDate } from '../utils/i18nHelpers';

export default function ExportBar({ plan }) {
  const { settings, t } = useSettings();
  const currentLang = settings.ui_language || 'en';
  const [copiedShare, setCopiedShare] = useState(false);

  if (!plan) return null;

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `discharge_plan_${(plan.patient_name || 'patient').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportIcs = () => {
    downloadIcsCalendar(plan.patient_name, plan.follow_up_tasks || [], settings?.enabled_languages || ['en'], currentLang);
  };

  const handleSharePlan = () => {
    const localizedSummary = (currentLang !== 'en' && plan.overall_summary_translations?.[currentLang]) || plan.overall_summary;
    const summaryText = t('export.shareSummaryTemplate', {
      name: plan.patient_name,
      hospital: plan.hospital_name,
      date: formatDate(plan.discharge_date, currentLang),
      summary: localizedSummary,
      count: formatNumber(plan.follow_up_tasks?.length || 0, currentLang),
      url: window.location.href
    }, `DischargeAI Follow-up Plan for ${plan.patient_name} (${plan.hospital_name}, ${plan.discharge_date})\nOverview: ${localizedSummary}\nTasks: ${plan.follow_up_tasks?.length || 0} coordinated items.\n\nView online plan: ${window.location.href}`);

    try {
      navigator.clipboard.writeText(summaryText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const tasksCount = plan.follow_up_tasks?.length || 0;
  const completedCount = plan.follow_up_tasks?.filter((tItem) => tItem.status === 'Completed').length || 0;

  return (
    <div className="no-print glass-card rounded-2xl border border-[var(--border)] p-4 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Summary Counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-[0_0_15px_rgba(255,98,66,0.15)]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text)]">{t('export.title', null, 'Export & Clinical Distribution')}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              {t('export.summaryCounts', {
                total: formatNumber(tasksCount, currentLang),
                completed: formatNumber(completedCount, currentLang)
              }, `${tasksCount} clinical actions • ${completedCount} documented as completed`)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={downloadJSON}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
            title={t('export.downloadJsonTooltip', null, 'Download complete structured plan as JSON')}
          >
            <FileJson className="w-4 h-4 text-[var(--accent)]" />
            <span>{t('export.downloadJson', null, 'Download JSON')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
            title={t('export.printPdfTooltip', null, 'Print or Save Patient Handout as PDF')}
          >
            <Printer className="w-4 h-4 text-[var(--accent)]" />
            <span>{t('export.printPdf', null, 'Print / PDF')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportIcs}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--accent-2)] bg-[var(--accent-2)]/15 hover:bg-[var(--accent-2)]/25 border border-[var(--accent-2)]/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] shadow-[0_0_10px_rgba(85,214,162,0.15)]"
            title={t('export.exportIcsTooltip', null, 'Export care schedule to calendar (.ics)')}
          >
            <Calendar className="w-4 h-4 text-[var(--accent-2)]" />
            <span>{t('export.exportIcs', null, 'Export .ICS')}</span>
          </button>

          <button
            type="button"
            onClick={handleSharePlan}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 border border-[var(--accent)]/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] shadow-[0_0_10px_rgba(255,98,66,0.15)]"
            title={t('export.shareTooltip', null, 'Copy shareable link and plan summary')}
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-[var(--accent-2)]" />
                <span className="text-[var(--accent-2)]">{t('export.linkCopied', null, 'Link Copied!')}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[var(--accent)]" />
                <span>{t('export.sharePlan', null, 'Share Plan')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
