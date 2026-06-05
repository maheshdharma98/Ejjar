import React from 'react';
import {TouchableOpacity, Text, View} from 'react-native';
import {useLanguageStore} from '../../store/languageStore';

export default function LanguageToggle() {
  const {currentLanguage, setLanguage} = useLanguageStore();

  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
        className="px-2 py-1"
      >
        <Text
          className={`text-sm ${
            currentLanguage === 'en'
              ? 'text-[#1A4FBA] font-semibold'
              : 'text-[#6B7280] font-normal'
          }`}
        >
          EN
        </Text>
      </TouchableOpacity>

      <View className="w-px h-4 bg-[#E5E7EB]" />

      <TouchableOpacity
        onPress={() => setLanguage('ar')}
        activeOpacity={0.7}
        className="px-2 py-1"
      >
        <Text
          className={`text-sm ${
            currentLanguage === 'ar'
              ? 'text-[#1A4FBA] font-semibold'
              : 'text-[#6B7280] font-normal'
          }`}
        >
          عربي
        </Text>
      </TouchableOpacity>
    </View>
  );
}
