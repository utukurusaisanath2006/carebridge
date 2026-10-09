import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enLocale from '../locales/en.json';
import hiLocale from '../locales/hi.json';
import taLocale from '../locales/ta.json';

const rawUrl = import.meta.env.VITE_API_URL || '/api';
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

const LOCALES = {
  en: enLocale,
  hi: hiLocale,
  ta: taLocale
};

export const DEFAULT_SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', bcp47: 'en-IN', font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", preview: 'Take 1 tablet after food' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN', font: "'Noto Sans Devanagari', sans-serif", preview: 'खाना खाने के बाद 1 गोली लें' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', bcp47: 'ta-IN', font: "'Noto Sans Tamil', sans-serif", preview: 'உணவுக்குப் பிறகு 1 மாத்திரை எடுத்துக் கொள்ளவும்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', bcp47: 'te-IN', font: "'Noto Sans Telugu', sans-serif", preview: 'భోజనం తర్వాత 1 టాబ్లెట్ వేసుకోండి' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', bcp47: 'kn-IN', font: "'Noto Sans Kannada', sans-serif", preview: 'ಊಟದ ನಂತರ 1 ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', bcp47: 'ml-IN', font: "'Noto Sans Malayalam', sans-serif", preview: 'ഭക്ഷണത്തിന് ശേഷം 1 ഗുളിക കഴിക്കുക' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', bcp47: 'bn-IN', font: "'Noto Sans Bengali', sans-serif", preview: 'খাবারের পর ১টি ট্যাবলেট খান' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', bcp47: 'mr-IN', font: "'Noto Sans Devanagari', sans-serif", preview: 'जेवणानंतर १ गोळी घ्या' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', bcp47: 'gu-IN', font: "'Noto Sans Gujarati', sans-serif", preview: 'જમ્યા પછી ૧ ગોળી લો' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN', font: "'Noto Sans Gurmukhi', sans-serif", preview: 'ਰੋਟੀ ਤੋਂ ਬਾਅਦ 1 ਗੋਲੀ ਲਵੋ' },
  { code: 'ur', name: 'Urdu', native: 'اردو', bcp47: 'ur-IN', font: "'Noto Nastaliq Urdu', serif", preview: 'کھانے کے بعد 1 گولی لیں' }
];

const SAFE_DEFAULTS = {
  default_language: 'en',
  enabled_languages: ['en', 'hi', 'ta'],
  ui_language: 'en',
  read_aloud_language: 'en'
};

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      const resetKey = 'carebridge_theme_reset_dark_v3';
      if (!localStorage.getItem(resetKey)) {
        localStorage.setItem('carebridge_theme', 'dark');
        localStorage.setItem(resetKey, '1');
        return 'dark';
      }
      const saved = localStorage.getItem('carebridge_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
  }
  return 'dark'; // Cinematic Dark is default
};

const getInitialMotionPaused = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('carebridge_motion_paused');
    if (saved !== null) return saved === 'true';
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  }
  return false;
};

const getInitialSettings = () => {
  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('dischargeai_settings') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        const rawLangs = Array.isArray(parsed.enabled_languages) && parsed.enabled_languages.length > 0
          ? parsed.enabled_languages
          : ['en', 'hi', 'ta'];
        // Ensure core translated languages are accessible if only 'en' was previously cached
        const langs = Array.from(new Set(['en', ...rawLangs, ...(rawLangs.length === 1 && rawLangs[0] === 'en' ? ['hi', 'ta'] : [])]));
        const uiLang = (typeof parsed.ui_language === 'string' && langs.includes(parsed.ui_language))
          ? parsed.ui_language
          : 'en';
        return {
          default_language: 'en',
          enabled_languages: langs,
          ui_language: uiLang,
          read_aloud_language: uiLang
        };
      }
    }
  } catch (err) {
    console.warn('[Care Bridge Settings] Corrupt or unparseable localStorage cache, using safe defaults:', err);
  }
  return { ...SAFE_DEFAULTS };
};

export const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);
  const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_SUPPORTED_LANGUAGES);
  const [dataSource, setDataSource] = useState('defaults');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [motionPaused, setMotionPaused] = useState(getInitialMotionPaused);

  // Sync theme changes with DOM and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#F8F9FA' : '#050505');
    }
    try {
      localStorage.setItem('carebridge_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Sync motion-paused changes with DOM and localStorage
  useEffect(() => {
    if (motionPaused) {
      document.body.classList.add('motion-paused');
    } else {
      document.body.classList.remove('motion-paused');
    }
    try {
      localStorage.setItem('carebridge_motion_paused', motionPaused ? 'true' : 'false');
    } catch (e) {}
  }, [motionPaused]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleMotion = useCallback(() => {
    setMotionPaused((prev) => !prev);
  }, []);

  // Hydrate settings on mount: backend FIRST, localStorage only on network failure
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        const serverSettings = data.settings || {
          default_language: data.default_language || 'en',
          enabled_languages: data.enabled_languages || ['en'],
          ui_language: data.ui_language || 'en',
          read_aloud_language: data.read_aloud_language || 'en'
        };

        // Ensure English is always present
        if (!Array.isArray(serverSettings.enabled_languages)) {
          serverSettings.enabled_languages = ['en'];
        } else if (!serverSettings.enabled_languages.includes('en')) {
          serverSettings.enabled_languages = ['en', ...serverSettings.enabled_languages];
        }

        // If ui_language is not in enabled_languages, reset to 'en'
        if (!serverSettings.enabled_languages.includes(serverSettings.ui_language)) {
          serverSettings.ui_language = 'en';
        }

        setSettings(serverSettings);
        if (data.supported_languages && data.supported_languages.length > 0) {
          setSupportedLanguages(data.supported_languages);
        }
        setDataSource('backend');
        try {
          localStorage.setItem('dischargeai_settings', JSON.stringify(serverSettings));
        } catch (e) {}
        return serverSettings;
      }
    } catch (err) {
      console.warn('[Care Bridge Settings] Backend unreachable; using local storage/safe defaults:', err);
      const cached = localStorage.getItem('dischargeai_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setSettings(parsed);
            setDataSource('local_fallback');
            return parsed;
          }
        } catch (e) {}
      }
      setDataSource('defaults');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Helper to resolve nested keys like 'nav.dashboard'
  const resolvePath = (obj, path) => {
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
  };

  // Helper to interpolate {{key}} placeholders
  const interpolate = (str, params) => {
    if (typeof str !== 'string' || !params || typeof params !== 'object') return str;
    return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  };

  // Translate UI chrome strings with dot-notation and interpolation
  const t = useCallback((key, params = null, fallback = null) => {
    const lang = settings.ui_language || 'en';
    const dict = LOCALES[lang] || LOCALES.en || {};

    let val = resolvePath(dict, key);
    if ((val === undefined || val === null || val === '') && lang !== 'en') {
      val = resolvePath(LOCALES.en, key);
    }

    if (val === undefined || val === null || val === '') {
      val = (fallback !== null && fallback !== undefined) ? fallback : key;
    }

    return interpolate(val, params);
  }, [settings.ui_language]);

  const getLanguageMeta = useCallback((code) => {
    return supportedLanguages.find(l => l.code === code) || {
      code,
      name: code.toUpperCase(),
      native: code.toUpperCase(),
      bcp47: `${code}-IN`,
      font: 'Inter, sans-serif'
    };
  }, [supportedLanguages]);

  // Sync document attributes (lang, dir, font, title) on language change
  useEffect(() => {
    const currentLang = settings.ui_language || 'en';
    const meta = getLanguageMeta(currentLang);
    
    // 1. HTML lang attribute
    document.documentElement.lang = meta.bcp47 || currentLang;

    // 2. Text direction (Urdu is RTL)
    if (currentLang === 'ur') {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl-layout');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl-layout');
    }

    // 3. Document Title
    const titleAppName = t('nav.appName', null, 'Care Bridge');
    const titleSubtitle = t('nav.appSubtitle', null, 'Hospital Follow-up OS');
    document.title = `${titleAppName} – ${titleSubtitle}`;

    // 4. Data-lang attribute and Indic text class
    document.documentElement.setAttribute('data-lang', currentLang);
    if (currentLang !== 'en') {
      document.body.classList.add('indic-text');
    } else {
      document.body.classList.remove('indic-text');
    }

    // 5. Font family hint on body
    if (meta.font) {
      document.body.style.fontFamily = meta.font;
    }
  }, [settings.ui_language, getLanguageMeta, t]);

  // Update settings authoritative server call
  const updateSettings = async (newSettings) => {
    try {
      // Normalize: ensure English is always included
      const langs = Array.from(new Set(['en', ...(newSettings.enabled_languages || [])]));
      const payload = {
        default_language: 'en',
        enabled_languages: langs,
        ui_language: langs.includes(newSettings.ui_language) ? newSettings.ui_language : 'en',
        read_aloud_language: langs.includes(newSettings.read_aloud_language) ? newSettings.read_aloud_language : 'en'
      };

      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const serverSaved = data.settings || payload;

      setSettings(serverSaved);
      if (data.supported_languages && data.supported_languages.length > 0) {
        setSupportedLanguages(data.supported_languages);
      }
      setDataSource('backend');
      localStorage.setItem('dischargeai_settings', JSON.stringify(serverSaved));
      return { success: true, settings: serverSaved };
    } catch (err) {
      console.error('Settings update error:', err);
      throw err;
    }
  };

  const setUiLanguage = (langCode) => {
    if (settings.enabled_languages.includes(langCode)) {
      const updated = {
        ...settings,
        ui_language: langCode,
        read_aloud_language: langCode
      };
      setSettings(updated);
      localStorage.setItem('dischargeai_settings', JSON.stringify(updated));
    } else {
      // Reset to English if language is not enabled
      const updated = {
        ...settings,
        ui_language: 'en',
        read_aloud_language: 'en'
      };
      setSettings(updated);
      localStorage.setItem('dischargeai_settings', JSON.stringify(updated));
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        supportedLanguages,
        dataSource,
        loading,
        t,
        getLanguageMeta,
        updateSettings,
        setUiLanguage,
        fetchSettings,
        isMultiLangEnabled: settings.enabled_languages.length > 1,
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        motionPaused,
        setMotionPaused,
        toggleMotion
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Aliases for backwards compatibility with any existing I18n imports
export const useI18n = useSettings;
export const I18nProvider = SettingsProvider;
