import {create} from 'zustand';
import {I18nManager} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LANGUAGE_KEY = 'ejjar_language';

type Language = 'en' | 'ar';

interface LanguageStore {
  currentLanguage: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  loadSavedLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: 'en',
  isRTL: false,

  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    I18nManager.forceRTL(lang === 'ar');
    set({currentLanguage: lang, isRTL: lang === 'ar'});
  },

  loadSavedLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved === 'en' || saved === 'ar') {
        await i18n.changeLanguage(saved);
        I18nManager.forceRTL(saved === 'ar');
        set({currentLanguage: saved, isRTL: saved === 'ar'});
      }
    } catch {}
  },
}));
