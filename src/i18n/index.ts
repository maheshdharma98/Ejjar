import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {I18nManager} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';
import enChat from './locales/chat.en.json';
import arChat from './locales/chat.ar.json';
import enDemo from './locales/demo.en.json';
import arDemo from './locales/demo.ar.json';

const LANGUAGE_KEY = 'ejjar_language';
const DEFAULT_LANGUAGE = 'ar';

let initialized = false;

export async function initializeI18n(): Promise<typeof i18n> {
  if (initialized) return i18n;

  let savedLanguage: string = DEFAULT_LANGUAGE;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ar') {
      savedLanguage = stored;
    }
  } catch {
    // First launch — use Arabic default
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: {translation: en, chat: enChat, demo: enDemo},
      ar: {translation: ar, chat: arChat, demo: arDemo},
    },
    lng: savedLanguage,
    fallbackLng: 'ar',
    ns: ['translation', 'chat', 'demo'],
    defaultNS: 'translation',
    interpolation: {escapeValue: false},
    compatibilityJSON: 'v3',
    react: {useSuspense: false},
  });

  const isRTL = savedLanguage === 'ar';
  I18nManager.allowRTL(isRTL);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }

  initialized = true;
  return i18n;
}

export async function changeLanguage(lang: 'ar' | 'en'): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    const isRTL = lang === 'ar';
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  } catch (e) {
    console.error('Failed to change language', e);
  }
}

// Fire immediately so i18n is available synchronously for non-awaited imports
initializeI18n();

export default i18n;
