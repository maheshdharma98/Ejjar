import './global.css';
import React, {useEffect, useState} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {I18nextProvider} from 'react-i18next';
import i18n, {initializeI18n} from './src/i18n/index';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from './src/components/common/Toast';
import {useAuthStore} from './src/store/authStore';
import {useLanguageStore} from './src/store/languageStore';

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const loadUser = useAuthStore(s => s.loadUser);
  const loadSavedLanguage = useLanguageStore(s => s.loadSavedLanguage);

  useEffect(() => {
    initializeI18n().then(() => {
      loadUser();
      loadSavedLanguage();
      setI18nReady(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <RootNavigator />
        </I18nextProvider>
      </SafeAreaProvider>
      {/* Toast rendered outside NavigationContainer so it overlays everything */}
      <Toast />
    </GestureHandlerRootView>
  );
}
