import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = 'ejjar_language';

const initI18n = async () => {
  let savedLang: string | null = null;

  try {
    savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {}

  let deviceLang = 'en';
  if (!savedLang) {
    const locales = getLocales();
    if (locales.length > 0) {
      const code = locales[0].languageCode;
      if (code === 'ar') {
        deviceLang = 'ar';
      }
    }
  }

  const language = savedLang ?? deviceLang;

  await i18n.use(initReactI18next).init({
    resources: {
      en: {translation: en},
      ar: {translation: ar},
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: {escapeValue: false},
    compatibilityJSON: 'v3',
  });
};

initI18n();

export default i18n;
