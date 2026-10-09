import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Pill,
  AlertTriangle
} from 'lucide-react';
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  playChimeTone,
  readAloudText
} from '../utils/alarmSound';
import { useSettings } from '../context/SettingsContext';
import { taskTypeLabel, formatTime } from '../utils/i18nHelpers';

export default function AlarmModal({
  isOpen,
  onClose,
  task,
  onAction
}) {
  const { settings, supportedLanguages, t, isDark } = useSettings();
  const currentLang = settings.ui_language || 'en';
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      if (!muted) {
        startContinuousAlarm();
      }
    }
    return () => {
      stopContinuousAlarm();
    };
  }, [isOpen, task, muted]);

  if (!isOpen || !task) return null;

  const handleMuteToggle = () => {
    if (muted) {
      setMuted(false);
      startContinuousAlarm();
    } else {
      setMuted(true);
      stopContinuousAlarm();
    }
  };

  const handleTaken = () => {
    stopContinuousAlarm();
    playChimeTone('success');
    onAction(task.id, 'Taken');
    onClose();
  };

  const handleSnooze = () => {
    stopContinuousAlarm();
    onAction(task.id, 'Snooze');
    onClose();
  };

  const handleSkip = () => {
    stopContinuousAlarm();
    onAction(task.id, 'Skip');
    onClose();
  };

  const extraLangs = (settings.enabled_languages || []).filter(l => l !== 'en');

  const handleReadAloud = (specificLang = null) => {
    const langToUse = specificLang || settings.read_aloud_language || currentLang;
    let textToSpeak = task.simple_language;

    if (langToUse !== 'en') {
      const trans = task.translations?.[langToUse]
        || (langToUse === 'hi' ? task.hindi_translation : null)
        || (langToUse === 'ta' ? task.tamil_translation : null);
      if (trans) textToSpeak = trans;
    }

    readAloudText(textToSpeak, langToUse);
  };

  const primaryText = (currentLang !== 'en' && task.translations?.[currentLang])
    ? task.translations[currentLang]
    : task.simple_language;

  const activeLangMeta = supportedLanguages.find(l => l.code === currentLang);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-[#050505]/85 backdrop-blur-sm p-4 animate-fade-in">
      {/* Extremely Legible Solid Background Container (Not Translucent) */}
      <div className={`w-full max-w-lg rounded-2xl shadow-delicate border-2 overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0E1116] border-[#FF4D5E]' : 'bg-[#FFFFFF] border-[#FF4D5E]'
      }`}>
        
        {/* Urgent High-Contrast Header */}
        <div className="bg-[#FF4D5E] text-[#050505] p-5 relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#050505] text-[#FF4D5E] flex items-center justify-center font-bold shadow-lg animate-pulse">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase tracking-wide-mono bg-[#050505] text-[#FF4D5E]">
                {t('alarm.alertHeader', null, 'CARE SCHEDULE ALERT')}
              </span>
              <h3 className="font-syne font-extrabold text-xl text-[#050505] tracking-tight mt-0.5">
                {t('alarm.dueNowTitle', null, 'Scheduled Action Due Now!')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMuteToggle}
            className="p-2.5 rounded-xl bg-[#050505]/20 hover:bg-[#050505]/30 text-[#050505] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={muted ? t('alarm.unmuteTooltip', null, 'Unmute alarm') : t('alarm.muteTooltip', null, 'Mute audio')}
            aria-label={muted ? 'Unmute alarm' : 'Mute alarm'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-[#050505]" /> : <Volume2 className="w-5 h-5 text-[#050505] animate-bounce" />}
          </button>
        </div>

        {/* Alarm Body - Solid Background & High Legibility */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-cb-border">
            <span className="font-mono font-bold text-cb-text uppercase tracking-wide-mono flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#FF6242]" />
              {t('alarm.reminderLabel', { type: taskTypeLabel(t, task.type) }, `${task.type} Reminder`)}
            </span>
            {task.times_of_day && task.times_of_day.length > 0 && (
              <span className="font-mono font-bold text-cb-text bg-cb-surface2 px-2.5 py-1 rounded-control border border-cb-border">
                {t('alarm.clockLabel', { time: formatTime(task.times_of_day[0], currentLang) }, `Clock: ${task.times_of_day[0]}`)}
              </span>
            )}
          </div>

          {/* Large High-Contrast Medication / Task Text (Never below 18px) */}
          <div className="text-xl sm:text-2xl font-bold text-cb-text leading-snug">
            {primaryText}
          </div>

          {/* Multilingual Text Cards for Enabled Languages */}
          {extraLangs.filter(l => l !== currentLang).length > 0 && (
            <div className="space-y-2 pt-1">
              {extraLangs.filter(l => l !== currentLang).map((langCode) => {
                const meta = supportedLanguages.find(l => l.code === langCode);
                const transText = task.translations?.[langCode]
                  || (langCode === 'hi' ? task.hindi_translation : null)
                  || (langCode === 'ta' ? task.tamil_translation : null);

                if (!transText) return null;

                return (
                  <div
                    key={langCode}
                    className="p-3 rounded-control bg-cb-surface2 border border-cb-border text-sm text-cb-text font-medium flex items-start justify-between gap-3"
                  >
                    <div>
                      <strong className="text-[#55D6A2] mr-2 font-mono font-bold uppercase">
                        {meta?.native || langCode}:
                      </strong>
                      <span style={meta?.font ? { fontFamily: meta.font } : {}}>
                        {transText}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReadAloud(langCode)}
                      className="p-1.5 text-cb-textMuted hover:text-cb-text rounded-control hover:bg-white/10 transition shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title={t('topbar.switchLangTooltip', { name: meta?.name || langCode }, `Read aloud in ${meta?.name || langCode}`)}
                      aria-label={`Read aloud in ${meta?.name || langCode}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voice assistance button */}
          <button
            type="button"
            onClick={() => handleReadAloud()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-control bg-cb-surface2 hover:bg-white/10 text-cb-text text-xs font-semibold border border-cb-border transition-all cursor-pointer min-h-[44px]"
          >
            <Volume2 className="w-4 h-4 text-[#55D6A2]" />
            <span>
              {t('alarm.readAloudVoice', { language: activeLangMeta?.name || 'English' }, `Read aloud (${activeLangMeta?.name || 'English'})`)}
            </span>
          </button>
        </div>

        {/* Alarm Actions Grid (Min 44px Touch Targets, High Contrast) */}
        <div className="p-5 border-t border-cb-border bg-cb-surface2 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="py-3 px-3 rounded-control text-xs font-bold text-cb-text bg-cb-surface hover:bg-white/10 border border-cb-border transition-all cursor-pointer text-center min-h-[44px]"
          >
            {t('alarm.skipBtn', null, 'Skip / Review')}
          </button>

          <button
            type="button"
            onClick={handleSnooze}
            className="py-3 px-3 rounded-control text-xs font-bold text-[#050505] bg-[#F5B94A] hover:bg-[#F7C66B] shadow-sm transition-all cursor-pointer text-center min-h-[44px]"
          >
            {t('alarm.snoozeBtn', null, 'Snooze 10m')}
          </button>

          <button
            type="button"
            onClick={handleTaken}
            className="py-3 px-3 rounded-control text-xs font-black text-[#050505] bg-[#55D6A2] hover:bg-[#6FE0B2] shadow-glow-mint transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#050505]" />
            <span>{t('alarm.takenBtn', null, 'Taken ✓')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
