/**
 * i18nHelpers.js - Comprehensive internationalization helpers for Care Bridge.
 * Fully resilient & polymorphic: supports both (t, value, ...) and (value, langOrT, ...) signatures,
 * falling back safely to bundled locales if t is omitted or not a function.
 */

import enLocale from '../locales/en.json';
import hiLocale from '../locales/hi.json';
import taLocale from '../locales/ta.json';

const LOCALES = {
  en: enLocale,
  hi: hiLocale,
  ta: taLocale
};

export const BCP47_MAP = {
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

export const bcp47For = (langCode) => {
  return BCP47_MAP[langCode] || 'en-IN';
};

function resolvePath(obj, path) {
  if (!obj || !path) return undefined;
  if (obj[path] !== undefined) return obj[path];
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

function interpolate(str, params) {
  if (typeof str !== 'string' || !params || typeof params !== 'object') return str;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Safe translation lookup using bundled locales when t function is not provided
 */
function directTranslate(key, lang = 'en', params = null, fallback = null) {
  const targetDict = LOCALES[lang] || LOCALES.en || {};
  let val = resolvePath(targetDict, key);
  if (val === undefined && lang !== 'en') {
    val = resolvePath(LOCALES.en, key);
  }
  if (val === undefined || val === '') {
    val = (fallback !== null && fallback !== undefined) ? fallback : key;
  }
  return interpolate(val, params);
}

/**
 * Maps task type strings (e.g. 'Medication', 'Appointment', 'Diet', 'Test', 'Wound Care')
 * Polymorphic signature:
 *   taskTypeLabel(t, type, plural) OR
 *   taskTypeLabel(type, langOrT, plural)
 */
export const taskTypeLabel = (arg1, arg2, arg3 = false) => {
  let tFn = null;
  let type = '';
  let plural = false;
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    type = arg2 || '';
    plural = Boolean(arg3);
  } else {
    type = arg1 || '';
    if (typeof arg2 === 'function') {
      tFn = arg2;
    } else if (typeof arg2 === 'string') {
      lang = arg2;
    }
    plural = Boolean(arg3);
  }

  const clean = String(type || '').trim();
  if (!clean) return '';
  const normalized = clean.toLowerCase();

  const translate = (key, fallback) => {
    if (typeof tFn === 'function') {
      try {
        const res = tFn(key, null, fallback);
        if (res !== undefined && res !== '' && res !== key) return res;
      } catch (e) {
        // ignore and fallback to direct
      }
    }
    return directTranslate(key, lang, null, fallback);
  };

  if (plural) {
    if (normalized.includes('med')) return translate('taskType.MedicationPlural', 'Medications');
    if (normalized.includes('appoint')) return translate('taskType.AppointmentPlural', 'Appointments');
    if (normalized.includes('test') || normalized.includes('lab')) return translate('taskType.TestPlural', 'Tests');
    if (normalized.includes('diet')) return translate('taskType.DietPlural', 'Diet');
    if (normalized.includes('wound')) return translate('taskType.WoundCarePlural', 'Wound Care');
    if (normalized.includes('warn')) return translate('taskType.WarningSignPlural', 'Warnings');
  }

  if (normalized.includes('med')) return translate('taskType.Medication', 'Medication');
  if (normalized.includes('appoint')) return translate('taskType.Appointment', 'Appointment');
  if (normalized.includes('test') || normalized.includes('lab')) return translate('taskType.Test', 'Lab Test');
  if (normalized.includes('diet')) return translate('taskType.Diet', 'Diet & Nutrition');
  if (normalized.includes('wound')) return translate('taskType.Wound Care', 'Wound Care');
  if (normalized.includes('warn')) return translate('taskType.Warning Sign', 'Warning Sign');
  if (normalized.includes('refer')) return translate('taskType.Referral', 'Referral');

  return translate(`taskType.${clean}`, clean);
};

/**
 * Maps status strings (e.g. 'Pending', 'Completed', 'Needs Review', 'Skipped', 'Snoozed', 'Taken')
 * Polymorphic signature:
 *   statusLabel(t, status) OR
 *   statusLabel(status, langOrT)
 */
export const statusLabel = (arg1, arg2) => {
  let tFn = null;
  let status = '';
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    status = arg2 || '';
  } else {
    status = arg1 || '';
    if (typeof arg2 === 'function') {
      tFn = arg2;
    } else if (typeof arg2 === 'string') {
      lang = arg2;
    }
  }

  const clean = String(status || '').trim();
  if (!clean) return '';
  const normalized = clean.toLowerCase();

  const translate = (key, fallback) => {
    if (typeof tFn === 'function') {
      try {
        const res = tFn(key, null, fallback);
        if (res !== undefined && res !== '' && res !== key) return res;
      } catch (e) {
        // ignore and fallback
      }
    }
    return directTranslate(key, lang, null, fallback);
  };

  if (normalized === 'pending') return translate('status.Pending', 'Pending');
  if (normalized.includes('complete')) return translate('status.Completed', 'Completed ✓');
  if (normalized.includes('review')) return translate('status.Needs Review', 'Needs Review');
  if (normalized.includes('skip')) return translate('status.Skipped', 'Skipped');
  if (normalized.includes('snooze')) return translate('status.Snoozed', 'Snoozed');
  if (normalized.includes('taken')) return translate('status.Taken', 'Taken');
  if (normalized.includes('miss')) return translate('status.Missed', 'Missed');

  return translate(`status.${clean}`, clean);
};

/**
 * Maps meal relationship codes to localized phrases
 * Polymorphic signature:
 *   mealRelationLabel(t, relation) OR
 *   mealRelationLabel(relation, langOrT)
 */
export const mealRelationLabel = (arg1, arg2) => {
  let tFn = null;
  let relation = '';
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    relation = arg2 || '';
  } else {
    relation = arg1 || '';
    if (typeof arg2 === 'function') {
      tFn = arg2;
    } else if (typeof arg2 === 'string') {
      lang = arg2;
    }
  }

  const norm = String(relation || '').trim().toLowerCase();
  const translate = (key, fallback) => {
    if (typeof tFn === 'function') {
      try {
        const res = tFn(key, null, fallback);
        if (res !== undefined && res !== '' && res !== key) return res;
      } catch (e) {}
    }
    return directTranslate(key, lang, null, fallback);
  };

  if (norm === 'before' || norm === 'before_meals') return translate('mealRelation.before', 'before');
  if (norm === 'after' || norm === 'after_meals') return translate('mealRelation.after', 'after');
  if (norm === 'with' || norm === 'with_meals') return translate('mealRelation.with', 'with');
  return translate('mealRelation.none', 'without relation to');
};

/**
 * Resolves rule messages from code + params, falling back to defaultMsg
 * Polymorphic signature:
 *   ruleMessage(t, code, params, defaultMsg) OR
 *   ruleMessage(code, params, defaultMsg, langOrT)
 */
export const ruleMessage = (arg1, arg2, arg3 = {}, arg4 = '') => {
  let tFn = null;
  let code = '';
  let params = {};
  let defaultMsg = '';
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    code = arg2;
    params = arg3 || {};
    defaultMsg = arg4 || '';
  } else {
    code = arg1;
    params = arg2 || {};
    defaultMsg = arg3 || '';
    if (typeof arg4 === 'function') {
      tFn = arg4;
    } else if (typeof arg4 === 'string') {
      lang = arg4;
    }
  }

  if (!code) return defaultMsg;
  const key = `rules.${code}`;

  if (typeof tFn === 'function') {
    try {
      const translated = tFn(key, params);
      if (translated && translated !== key) return translated;
    } catch (e) {}
  }
  const direct = directTranslate(key, lang, params, defaultMsg);
  return direct || defaultMsg;
};

export const ruleAction = (arg1, arg2, arg3 = {}, arg4 = '') => {
  let tFn = null;
  let code = '';
  let params = {};
  let defaultMsg = '';
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    code = arg2;
    params = arg3 || {};
    defaultMsg = arg4 || '';
  } else {
    code = arg1;
    params = arg2 || {};
    defaultMsg = arg3 || '';
    if (typeof arg4 === 'function') {
      tFn = arg4;
    } else if (typeof arg4 === 'string') {
      lang = arg4;
    }
  }

  if (!code) return defaultMsg;
  const key = `rules.${code}_ACTION`;

  if (typeof tFn === 'function') {
    try {
      const translated = tFn(key, params);
      if (translated && translated !== key) return translated;
    } catch (e) {}
  }
  const direct = directTranslate(key, lang, params, defaultMsg);
  return direct || defaultMsg;
};

/**
 * Resolves audit log messages from code + params, falling back to defaultMsg
 * Polymorphic signature:
 *   auditMessage(t, code, params, defaultMsg) OR
 *   auditMessage(code, params, defaultMsg, langOrT)
 */
export const auditMessage = (arg1, arg2, arg3 = {}, arg4 = '') => {
  let tFn = null;
  let code = '';
  let params = {};
  let defaultMsg = '';
  let lang = 'en';

  if (typeof arg1 === 'function') {
    tFn = arg1;
    code = arg2;
    params = arg3 || {};
    defaultMsg = arg4 || '';
  } else {
    code = arg1;
    params = arg2 || {};
    defaultMsg = arg3 || '';
    if (typeof arg4 === 'function') {
      tFn = arg4;
    } else if (typeof arg4 === 'string') {
      lang = arg4;
    }
  }

  if (!code) return defaultMsg;
  const key = `auditCodes.${code}`;

  if (typeof tFn === 'function') {
    try {
      const translated = tFn(key, params);
      if (translated && translated !== key) return translated;
    } catch (e) {}
  }
  const direct = directTranslate(key, lang, params, defaultMsg);
  return direct || defaultMsg;
};

/**
 * Format dates with Intl.DateTimeFormat
 */
export const formatDate = (dateInput, langCode = 'en', options = {}) => {
  if (!dateInput) return '';
  try {
    let d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) {
      const parts = String(dateInput).split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (isNaN(d.getTime())) return String(dateInput);

    const locale = bcp47For(langCode);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(d);
  } catch (e) {
    return String(dateInput);
  }
};

/**
 * Format times with Intl.DateTimeFormat
 */
export const formatTime = (timeInput, langCode = 'en', options = {}) => {
  if (!timeInput) return '';
  try {
    let d;
    if (timeInput instanceof Date) {
      d = timeInput;
    } else if (String(timeInput).includes(':')) {
      const [h, m] = String(timeInput).split(':').map(Number);
      d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
    } else {
      d = new Date(timeInput);
    }

    if (isNaN(d.getTime())) return String(timeInput);

    const locale = bcp47For(langCode);
    const defaultOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(d);
  } catch (e) {
    return String(timeInput);
  }
};

/**
 * Format numbers with Intl.NumberFormat
 */
export const formatNumber = (num, langCode = 'en', options = {}) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  try {
    const locale = bcp47For(langCode);
    return new Intl.NumberFormat(locale, options).format(Number(num));
  } catch (e) {
    return String(num);
  }
};

/**
 * Relative time formatting (e.g. "in 10 minutes", "2 hours ago")
 */
export const formatRelativeTime = (value, unit = 'minute', langCode = 'en') => {
  try {
    const locale = bcp47For(langCode);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(value, unit);
  } catch (e) {
    return `${value} ${unit}`;
  }
};
