import React from 'react';
import {TouchableOpacity, Text, View} from 'react-native';
import {useLanguageStore} from '../../store/languageStore';

export default function LanguageToggle() {
  const {currentLanguage, setLanguage} = useLanguageStore();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1A2740',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: currentLanguage === 'en' ? '#1A2740' : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: currentLanguage === 'en' ? '600' : '400',
            color: currentLanguage === 'en' ? '#ffffff' : '#a8c5c5',
          }}
        >
          EN
        </Text>
      </TouchableOpacity>

      <View style={{width: 1, height: 16, backgroundColor: '#1A2740'}} />

      <TouchableOpacity
        onPress={() => setLanguage('ar')}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: currentLanguage === 'ar' ? '#1A2740' : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: currentLanguage === 'ar' ? '600' : '400',
            color: currentLanguage === 'ar' ? '#ffffff' : '#a8c5c5',
          }}
        >
          عربي
        </Text>
      </TouchableOpacity>
    </View>
  );
}
