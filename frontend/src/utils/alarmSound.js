/**
 * Web Audio API synthesized alarm sound for Care Bridge.
 * Completely standalone, works 100% offline without any external audio assets.
 */

let audioCtx = null;
let currentAlarmInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a single two-tone medical chime (e.g. 880Hz -> 1046Hz)
 */
export function playChimeTone(type = 'alarm') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    if (type === 'success') {
      // Gentle ascending confirmation chime
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Clear medical alert chime (pulsing hospital monitor pattern)
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    console.warn('Web Audio chime could not play:', err);
  }
}

/**
 * High-priority clinical operator notification chime (3-pulse urgent tone)
 */
export function playCriticalNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [0, 0.15, 0.30].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880 + idx * 110, now + offset); // 880, 990, 1100 Hz
      gain.gain.setValueAtTime(0.4, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  } catch (e) {
    console.warn('Critical chime failed:', e);
  }
}

/**
 * Warning level notification chime (gentle dual tone)
 */
export function playWarningNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(523.25, now + 0.12); // C5
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  } catch (e) {
    console.warn('Warning chime failed:', e);
  }
}


/**
 * Starts continuous repeating medical alert alarm until acknowledged
 */
export function startContinuousAlarm() {
  stopContinuousAlarm();
  playChimeTone('alarm');

  // Repeat every 1.2 seconds until stopped
  currentAlarmInterval = setInterval(() => {
    playChimeTone('alarm');
  }, 1200);

  // Trigger mobile vibration if supported
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (e) {
      // Ignore vibration permissions error
    }
  }
}

/**
 * Stops continuous repeating alarm
 */
export function stopContinuousAlarm() {
  if (currentAlarmInterval) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
}

const BCP47_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ur: 'ur-IN'
};

/**
 * Text-to-speech engine with multilingual language voice selection.
 * Supports exact BCP-47 tags and Indic languages.
 */
export function readAloudText(text, lang = 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Resolve BCP-47 tag
    const bcp47 = BCP47_MAP[lang] || (lang.includes('-') ? lang : 'en-IN');
    utterance.lang = bcp47;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang === bcp47 || v.lang.startsWith(lang));
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
