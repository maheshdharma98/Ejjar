import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAuthStore} from '../store/authStore';
import {useLanguageStore} from '../store/languageStore';
import {useToastStore} from '../store/toastStore';
import LoginBottomSheet from '../components/common/LoginBottomSheet';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {user, isLoggedIn, logout} = useAuthStore();
  const {currentLanguage, setLanguage} = useLanguageStore();
  const {showToast} = useToastStore();
  const [loginOpen, setLoginOpen] = React.useState(false);

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'GU';

  const handleLogout = async () => {
    await logout();
    navigation.navigate('HomeTabs');
  };

  const MENU_ITEMS = [
    {emoji: '📋', label: 'My RFQs', onPress: () => navigation.navigate('MyRFQs')},
    {emoji: '💼', label: 'My Jobs', onPress: () => navigation.navigate('MyJobs')},
    {emoji: '🔔', label: t('notifications.title'), onPress: () => navigation.navigate('Notifications')},
    {emoji: '❓', label: 'Help & Support', onPress: () => showToast('Coming soon', 'info')},
    {emoji: '📄', label: 'Terms & Conditions', onPress: () => showToast('Coming soon', 'info')},
  ];

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* GRADIENT HEADER */}
        <LinearGradient
          colors={['#1A4FBA', '#143D9B']}
          className="px-4 pb-10"
          style={{paddingTop: insets.top + 16}}
        >
          {isLoggedIn && user ? (
            <>
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                <Text className="text-white text-xl font-bold">{initials}</Text>
              </View>
              <Text className="text-white text-xl font-bold mt-3">{user.name}</Text>
              <Text className="text-white/80 text-sm mt-0.5">{user.phone}</Text>
            </>
          ) : (
            <>
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                <Text className="text-white text-xl font-bold">👤</Text>
              </View>
              <Text className="text-white text-xl font-bold mt-3">Guest User</Text>
              <TouchableOpacity
                className="bg-white/20 rounded-xl px-4 py-2 self-start mt-2"
                onPress={() => setLoginOpen(true)}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm font-semibold">Login / Register</Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>

        {/* LANGUAGE CARD */}
        <View className="bg-white rounded-2xl shadow-md mx-4 p-4 mb-4" style={{marginTop: -20}}>
          <Text className="text-sm font-semibold text-[#6B7280] mb-3">Language / اللغة</Text>
          <View className="flex-row gap-2">
            {/* EN option */}
            <TouchableOpacity
              className="flex-1 rounded-xl p-3 items-center"
              style={{
                backgroundColor: currentLanguage === 'en' ? '#1A4FBA' : '#F5F7FA',
                borderWidth: currentLanguage === 'en' ? 0 : 1,
                borderColor: '#E5E7EB',
              }}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                className="font-bold text-base"
                style={{color: currentLanguage === 'en' ? '#FFFFFF' : '#1A1A2E'}}
              >
                EN
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{color: currentLanguage === 'en' ? 'rgba(255,255,255,0.8)' : '#6B7280'}}
              >
                English
              </Text>
            </TouchableOpacity>

            {/* AR option */}
            <TouchableOpacity
              className="flex-1 rounded-xl p-3 items-center ms-2"
              style={{
                backgroundColor: currentLanguage === 'ar' ? '#1A4FBA' : '#F5F7FA',
                borderWidth: currentLanguage === 'ar' ? 0 : 1,
                borderColor: '#E5E7EB',
              }}
              onPress={() => setLanguage('ar')}
              activeOpacity={0.8}
            >
              <Text
                className="font-bold text-base"
                style={{color: currentLanguage === 'ar' ? '#FFFFFF' : '#1A1A2E'}}
              >
                عربي
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{color: currentLanguage === 'ar' ? 'rgba(255,255,255,0.8)' : '#6B7280'}}
              >
                Arabic
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MENU LIST */}
        <View className="bg-white rounded-2xl shadow-sm mx-4 overflow-hidden">
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              className={`p-4 flex-row items-center ${idx < MENU_ITEMS.length - 1 ? 'border-b border-[#F5F7FA]' : ''}`}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <Text style={{fontSize: 20}} className="me-3">{item.emoji}</Text>
              <Text className="flex-1 text-[#1A1A2E] text-sm font-medium">{item.label}</Text>
              <Text className="text-[#9CA3AF]">→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT */}
        {isLoggedIn && (
          <TouchableOpacity
            className="bg-[#FEE2E2] rounded-2xl mx-4 mt-4 mb-8 p-4 flex-row items-center justify-center"
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={{fontSize: 20}}>🚪</Text>
            <Text className="text-[#DC2626] font-semibold text-base ms-2">{t('common.logout')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <LoginBottomSheet
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </View>
  );
}
