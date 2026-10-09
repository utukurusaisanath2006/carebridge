/**
 * Re-export unified settings context for backwards compatibility.
 */
export {
  SettingsProvider as I18nProvider,
  useSettings as useI18n,
  DEFAULT_SUPPORTED_LANGUAGES,
  API_BASE
} from './SettingsContext';
