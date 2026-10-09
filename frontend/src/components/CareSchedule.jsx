import React, { useState } from 'react';
import {
  Clock,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Download,
  Zap,
  Edit2,
  Check
} from 'lucide-react';
import { downloadIcsCalendar } from '../utils/icsExporter';
import { useSettings } from '../context/SettingsContext';
import {
  taskTypeLabel,
  statusLabel,
  mealRelationLabel,
  formatTime,
  formatNumber
} from '../utils/i18nHelpers';

export default function CareSchedule({
  tasks = [],
  patientName = 'Ramesh Kumar',
  onUpdateTaskTimes,
  onTriggerAlarmNow,
  demoAlarmCountdown = null
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const currentLang = settings.ui_language || 'en';
  const extraLangs = (settings.enabled_languages || []).filter(l => l !== 'en');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [tempTime, setTempTime] = useState('08:00');

  const slots = [
    {
      id: 'morning',
      label: t('schedule.slotMorning', null, 'Morning'),
      timeRange: t('schedule.slotMorningTime', null, '06:00 – 12:00'),
      icon: Sun,
      color: 'text-[#F5B94A] bg-[#F5B94A]/15 border border-[#F5B94A]/30'
    },
    {
      id: 'afternoon',
      label: t('schedule.slotAfternoon', null, 'Afternoon'),
      timeRange: t('schedule.slotAfternoonTime', null, '12:00 – 17:00'),
      icon: Sun,
      color: 'text-[#FF6242] bg-[#FF6242]/15 border border-[#FF6242]/30'
    },
    {
      id: 'evening',
      label: t('schedule.slotEvening', null, 'Evening'),
      timeRange: t('schedule.slotEveningTime', null, '17:00 – 21:00'),
      icon: Sunset,
      color: 'text-[#7FB2FF] bg-[#7FB2FF]/15 border border-[#7FB2FF]/30'
    },
    {
      id: 'night',
      label: t('schedule.slotNight', null, 'Night / Bedtime'),
      timeRange: t('schedule.slotNightTime', null, '21:00 – 06:00'),
      icon: Moon,
      color: 'text-[#55D6A2] bg-[#55D6A2]/15 border border-[#55D6A2]/30'
    },
  ];

  // Assign tasks to timeline slots based on their clock times
  const getSlotForTime = (timeStr) => {
    if (!timeStr) return 'morning';
    const hour = parseInt(timeStr.split(':')[0], 10) || 8;
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const handleSaveTime = (task) => {
    onUpdateTaskTimes(task.id, [tempTime]);
    setEditingTaskId(null);
  };

  const handleExportIcs = () => {
    downloadIcsCalendar(patientName, tasks);
  };

  return (
    <div className="glass-card p-6 space-y-6 shadow-delicate">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-cb-border gap-4">
        <div>
          <h2 className="font-syne font-bold text-xl text-cb-text flex items-center gap-2">
            <span>{t('schedule.title', null, "Today's Care Schedule & Timeline")}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#55D6A2]/15 text-[#55D6A2] border border-[#55D6A2]/30">
              {t('schedule.badge', null, 'Active Reminder Engine')}
            </span>
          </h2>
          <p className="text-xs text-cb-textMuted mt-1">
            {t('schedule.subtitle', null, 'Dose times, diagnostic labs, wound dressings, and specialist visits organized into daily routine slots.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Demo Mode Trigger */}
          <button
            type="button"
            onClick={() => onTriggerAlarmNow(tasks[0] || null)}
            disabled={demoAlarmCountdown !== null}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-bold transition-all cursor-pointer ${
              demoAlarmCountdown !== null
                ? 'bg-[#FF4D5E] text-[#050505] animate-pulse shadow-glow-coral'
                : 'bg-[#FF6242]/15 text-[#FF6242] hover:bg-[#FF6242] hover:text-[#050505] border border-[#FF6242]/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {demoAlarmCountdown !== null
                ? t('schedule.firingIn', { seconds: demoAlarmCountdown }, `Firing in ${demoAlarmCountdown}s`)
                : t('schedule.triggerAlarmBtn', null, 'Trigger Test Alarm (10s)')}
            </span>
          </button>

          {/* Export .ics Calendar */}
          <button
            type="button"
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-semibold bg-cb-surface2 hover:bg-white/10 text-cb-text border border-cb-border transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#55D6A2]" />
            <span>{t('schedule.exportIcsBtn', null, 'Export .ICS Calendar')}</span>
          </button>
        </div>
      </div>

      {/* Timeline Slots Grid */}
      <div className="space-y-6">
        {slots.map((slot) => {
          const SlotIcon = slot.icon;

          // Find tasks that have a clock time in this slot
          const slotTasks = tasks.filter((tItem) => {
            const times = tItem.times_of_day && tItem.times_of_day.length > 0 ? tItem.times_of_day : ['08:00'];
            return times.some((tm) => getSlotForTime(tm) === slot.id);
          });

          return (
            <div key={slot.id} className="border border-cb-border rounded-2xl p-5 bg-cb-surface space-y-3">
              {/* Slot Header */}
              <div className="flex items-center justify-between pb-3 border-b border-cb-border">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${slot.color} flex items-center justify-center font-bold`}>
                    <SlotIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-sm text-cb-text">{slot.label}</h3>
                    <div className="text-[11px] text-cb-textMuted font-mono">{slot.timeRange}</div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cb-surface2 border border-cb-border text-cb-textMuted">
                  {slotTasks.length === 1
                    ? t('schedule.actionSingular', { count: formatNumber(1, currentLang) }, '1 action')
                    : t('schedule.actionPlural', { count: formatNumber(slotTasks.length, currentLang) }, `${slotTasks.length} actions`)}
                </span>
              </div>

              {/* Slot Task Items */}
              {slotTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {slotTasks.map((task) => {
                    const primaryText = (currentLang !== 'en' && task.translations?.[currentLang])
                      ? task.translations[currentLang]
                      : task.simple_language;

                    return (
                      <div
                        key={task.id}
                        className="bg-cb-surface2 rounded-xl border border-cb-border p-4 hover:border-cb-borderStrong transition-all space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-cb-textMuted text-[10px] uppercase tracking-wide-mono">
                            [{taskTypeLabel(t, task.type)}]
                          </span>

                          {/* Clock Slot & Edit Picker */}
                          {editingTaskId === task.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={tempTime}
                                onChange={(e) => setTempTime(e.target.value)}
                                className="text-xs font-mono bg-cb-bg border border-[#55D6A2] text-cb-text rounded px-1.5 py-0.5 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTime(task)}
                                className="p-1 bg-[#55D6A2] text-[#050505] rounded hover:bg-[#6FE0B2] cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#55D6A2] bg-[#55D6A2]/10 border border-[#55D6A2]/30 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-[#55D6A2]" />
                                {formatTime(task.times_of_day?.[0] || '08:00', currentLang)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskId(task.id);
                                  setTempTime(task.times_of_day?.[0] || '08:00');
                                }}
                                className="text-cb-textMuted hover:text-cb-text p-0.5 cursor-pointer"
                                title={t('schedule.editTimeTooltip', null, 'Edit scheduled time')}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-bold text-cb-text leading-snug">
                          {primaryText}
                        </div>

                        {/* Extra enabled languages */}
                        {extraLangs.filter(l => l !== currentLang).length > 0 && (
                          <div className="space-y-1">
                            {extraLangs.filter(l => l !== currentLang).map((langCode) => {
                              const meta = supportedLanguages.find(l => l.code === langCode);
                              const trans = task.translations?.[langCode]
                                || (langCode === 'hi' ? task.hindi_translation : null)
                                || (langCode === 'ta' ? task.tamil_translation : null);
                              if (!trans) return null;
                              return (
                                <p
                                  key={langCode}
                                  className="text-xs text-cb-textMuted italic font-medium"
                                  style={meta?.font ? { fontFamily: meta.font } : {}}
                                >
                                  {trans}
                                </p>
                              );
                            })}
                          </div>
                        )}

                        {task.meal_relation && task.meal_relation !== 'none' && (
                          <div className="text-[11px] font-medium text-cb-textMuted">
                            {t('schedule.takeMealRelation', { relation: mealRelationLabel(t, task.meal_relation) }, `Take ${task.meal_relation} meals`)}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span
                            className={`font-mono font-bold ${
                              task.status === 'Completed' ? 'text-[#55D6A2]' : 'text-[#F5B94A]'
                            }`}
                          >
                            {t('schedule.statusLabel', { status: statusLabel(t, task.status) }, `Status: ${task.status}`)}
                          </span>

                          <button
                            type="button"
                            onClick={() => onTriggerAlarmNow(task)}
                            className="text-[10px] font-bold text-[#FF6242] hover:text-[#FF7B60] underline cursor-pointer"
                          >
                            {t('schedule.testAlarmTaskBtn', null, 'Test Alarm for this Task')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 text-xs text-cb-textMuted italic">
                  {t('schedule.emptySlotText', null, 'No actions scheduled for this time block.')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
