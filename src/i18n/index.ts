import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import { I18nManager } from 'react-native';

// Import translation files
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// RTL languages
const RTL_LANGUAGES = ['ur', 'ar', 'he', 'fa'];

// Get device language
const getDeviceLanguage = () => {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    return deviceLanguage;
  }
  return 'en';
};

// Check if language is RTL
const isRTL = (language: string) => {
  return RTL_LANGUAGES.includes(language);
};

// Set RTL layout
const setRTL = (language: string) => {
  const rtl = isRTL(language);
  I18nManager.forceRTL(rtl);
  I18nManager.allowRTL(rtl);
};

// Initialize i18n
const initI18n = () => {
  const deviceLanguage = getDeviceLanguage();
  const language = deviceLanguage === 'ur' ? 'ur' : 'en';
  
  // Set RTL for the detected language
  setRTL(language);

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng: language,
      fallbackLng: 'en',
      debug: __DEV__,
      
      resources: {
        en: {
          translation: en,
        },
        ur: {
          translation: ur,
        },
      },

      interpolation: {
        escapeValue: false, // React already does escaping
      },

      react: {
        useSuspense: false,
      },
    });

  return language;
};

// Change language function
export const changeLanguage = (language: string) => {
  setRTL(language);
  i18n.changeLanguage(language);
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Check if current language is RTL
export const isCurrentLanguageRTL = () => {
  return isRTL(getCurrentLanguage());
};

// Initialize and export
const language = initI18n();

export default i18n;
export { language };
