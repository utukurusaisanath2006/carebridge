import React, { useState, useMemo } from 'react';
import TaskCard from './TaskCard';
import {
  Layers,
  Calendar,
  Pill,
  FlaskConical,
  Utensils,
  AlertTriangle,
  Search,
  Filter,
  Bandage,
  Languages,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { taskTypeLabel, formatNumber } from '../utils/i18nHelpers';

export default function TaskBoard({
  tasks = [],
  onUpdateStatus,
  onOpenEscalation,
  onViewSource,
  onTranslatePlan,
  selectedLang = 'en'
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const currentLang = settings.ui_language || 'en';
  const [translatingLangs, setTranslatingLangs] = useState({});
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'All', label: taskTypeLabel(t, 'All'), icon: Layers },
    { id: 'Appointments', label: taskTypeLabel(t, 'Appointment', true), icon: Calendar, typeMatch: ['Appointment', 'Referral'] },
    { id: 'Medications', label: taskTypeLabel(t, 'Medication', true), icon: Pill, typeMatch: ['Medication'] },
    { id: 'Tests', label: taskTypeLabel(t, 'Test', true), icon: FlaskConical, typeMatch: ['Test'] },
    { id: 'Diet', label: taskTypeLabel(t, 'Diet', true), icon: Utensils, typeMatch: ['Diet'] },
    { id: 'Wound Care', label: taskTypeLabel(t, 'Wound Care', true), icon: Bandage, typeMatch: ['Wound Care'] },
    { id: 'Warnings', label: taskTypeLabel(t, 'Warning Sign', true), icon: AlertTriangle, typeMatch: ['Warning Sign'] },
  ];

  const tabCounts = useMemo(() => {
    const counts = { All: tasks.length };
    tabs.forEach((tab) => {
      if (tab.id === 'All') return;
      counts[tab.id] = tasks.filter((tItem) => (tab.typeMatch || []).includes(tItem.type)).length;
    });
    return counts;
  }, [tasks]);

  const completedCount = tasks.filter((tItem) => tItem.status === 'Completed').length;
  const pendingCount = tasks.filter((tItem) => tItem.status === 'Pending').length;
  const completionPercentage = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab !== 'All') {
        const currentTabObj = tabs.find((tItem) => tItem.id === activeTab);
        if (currentTabObj?.typeMatch && !currentTabObj.typeMatch.includes(task.type)) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const simple = (task.simple_language || '').toLowerCase();
        const original = (task.original_text || '').toLowerCase();
        if (simple.includes(query) || original.includes(query)) return true;

        const enabledExtra = (settings.enabled_languages || []).filter((l) => l !== 'en');
        for (const lang of enabledExtra) {
          const trans = task.translations?.[lang]
            || (lang === 'hi' ? task.hindi_translation : null)
            || (lang === 'ta' ? task.tamil_translation : null);
          if (trans && trans.toLowerCase().includes(query)) return true;
        }
        return false;
      }

      return true;
    });
  }, [tasks, activeTab, statusFilter, searchQuery, settings.enabled_languages]);

  const extraLangs = (settings.enabled_languages || []).filter(l => l !== 'en');
  const missingLanguages = extraLangs.filter(langCode => {
    return tasks.some(tItem => {
      const hasTrans = tItem.translations && tItem.translations[langCode];
      const hasLegacyHi = langCode === 'hi' && tItem.hindi_translation;
      const hasLegacyTa = langCode === 'ta' && tItem.tamil_translation;
      return !hasTrans && !hasLegacyHi && !hasLegacyTa;
    });
  });

  const handleTranslateExisting = async (langCode) => {
    if (!onTranslatePlan) return;
    setTranslatingLangs(prev => ({ ...prev, [langCode]: true }));
    try {
      await onTranslatePlan([langCode]);
    } finally {
      setTranslatingLangs(prev => ({ ...prev, [langCode]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Missing Language Quick-Translate Banner */}
      {missingLanguages.length > 0 && onTranslatePlan && (
        <div className="glass-card p-4 border-l-4 border-l-[#F5B94A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-[#F5B94A] shrink-0" />
            <p className="text-xs text-cb-text">
              {t('taskBoard.missingTranslationsNotice', null, 'New language(s) enabled in Settings. Translate existing care actions now without altering clinical details.')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {missingLanguages.map(langCode => {
              const meta = supportedLanguages.find(l => l.code === langCode);
              const isTranslating = translatingLangs[langCode];
              return (
                <button
                  key={langCode}
                  type="button"
                  disabled={isTranslating}
                  onClick={() => handleTranslateExisting(langCode)}
                  className="px-3 py-1.5 rounded-control text-xs font-bold bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] shadow-glow-coral flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                  <span>
                    {isTranslating
                      ? t('taskBoard.translatingBtn', null, 'Translating...')
                      : t('taskBoard.translateToLangBtn', { lang: meta?.name || langCode }, `Translate to ${meta?.name || langCode}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Board Navigation Chrome */}
      <div className="glass-card p-5 space-y-4 shadow-delicate">
        {/* Top Filter Bar: Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const count = tabCounts[tab.id] || 0;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF6242] text-[#050505] font-bold shadow-glow-coral'
                      : 'bg-cb-surface2 text-cb-textMuted hover:text-cb-text hover:bg-white/10 border border-cb-border'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#050505]/20 text-[#050505]' : 'bg-white/10 text-cb-textMuted'
                  }`}>
                    {formatNumber(count, currentLang)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-cb-textMuted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('taskBoard.searchPlaceholder', null, 'Search instructions or meds...')}
                className="w-full pl-9 pr-3 py-2 text-xs bg-cb-surface2 border border-cb-border rounded-control text-cb-text placeholder:text-cb-textFaint focus:border-[#55D6A2] transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono font-semibold bg-cb-surface2 border border-cb-border rounded-control px-3 py-2 text-cb-text focus:border-[#55D6A2] cursor-pointer"
            >
              <option value="ALL" className="bg-[#050505]">{t('taskBoard.allStatuses', null, 'All Statuses')}</option>
              <option value="Pending" className="bg-[#050505]">{t('taskBoard.pendingOnly', null, 'Pending')}</option>
              <option value="Completed" className="bg-[#050505]">{t('taskBoard.completedOnly', null, 'Completed')}</option>
              <option value="Needs Review" className="bg-[#050505]">{t('taskBoard.needsReviewOnly', null, 'Needs Review')}</option>
            </select>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="pt-2 border-t border-cb-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cb-textMuted">
          <div className="flex items-center gap-4 font-mono">
            <span>
              {t('taskBoard.completedRatio', { completed: completedCount, total: tasks.length }, `${completedCount} of ${tasks.length} actions fulfilled`)}
            </span>
            <span>•</span>
            <span className="text-[#55D6A2] font-bold">{completionPercentage}% fulfillment rate</span>
          </div>
          <div className="w-full sm:w-48 bg-cb-surface2 h-2 rounded-full overflow-hidden border border-cb-border">
            <div
              className="bg-[#55D6A2] h-full transition-all duration-300 shadow-glow-mint"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onViewSource={onViewSource}
            />
          ))
        ) : (
          <div className="glass-card py-16 text-center text-cb-textMuted space-y-2">
            <Layers className="w-8 h-8 mx-auto text-cb-textFaint" />
            <p className="text-sm font-medium">{t('taskBoard.noTasksMatch', null, 'No care actions match the selected filter.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
