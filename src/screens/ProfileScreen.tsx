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
import Icon from '../components/common/Icon';
import EjjarLogo from '../components/common/EjjarLogo';
import {colors, shadows} from '../theme/designSystem';
import {maskPhone} from '../utils/masking';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const rfqsAll: Array<{status: string}> = require('../../../shared/mock/rfqs.json');
const jobsAll: Array<{status: string}> = require('../../../shared/mock/jobs.json');
const ACTIVE_SET = new Set(['new', 'supplier_responded', 'negotiation', 'accepted', 'confirmed']);
const activeRFQCount = rfqsAll.filter(r => ACTIVE_SET.has(r.status)).length;
const doneJobsCount = jobsAll.filter(j => j.status === 'completed').length;

const STATS_DEF = [
  {value: 34, labelEn: 'Jobs Done', labelAr: 'أعمال منجزة', icon: 'briefcase-check', color: colors.success, bg: '#DCFCE7'},
  {value: '4.7', labelEn: 'Rating', labelAr: 'التقييم', icon: 'star', color: colors.warning, bg: colors.warningLight},
  {value: activeRFQCount || 3, labelEn: 'Active RFQs', labelAr: 'طلبات نشطة', icon: 'file-document-outline', color: colors.primary, bg: colors.primaryLight},
];

export default function ProfileScreen() {
  const {t, i18n} = useTranslation();
  const isAr = i18n.language === 'ar';
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
    {icon: 'file-document-outline', label: isAr ? 'طلباتي' : 'My RFQs', color: colors.primary, bg: colors.primaryLight, onPress: () => navigation.navigate('MyRFQs')},
    {icon: 'briefcase-outline', label: isAr ? 'أعمالي' : 'My Jobs', color: colors.success, bg: '#DCFCE7', onPress: () => navigation.navigate('MyJobs')},
    {icon: 'bell-outline', label: isAr ? 'الإشعارات' : t('notifications.title'), color: colors.warning, bg: colors.warningLight, onPress: () => navigation.navigate('Notifications')},
    {icon: 'help-circle-outline', label: isAr ? 'المساعدة والدعم' : 'Help & Support', color: '#8B5CF6', bg: '#F3E8FF', onPress: () => showToast('Coming soon', 'info')},
    {icon: 'information-outline', label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions', color: colors.textSecondary, bg: '#F1F5F9', onPress: () => showToast('Coming soon', 'info')},
  ];

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* GRADIENT HEADER */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={{paddingTop: insets.top + 16, paddingBottom: 48, paddingHorizontal: 20}}
        >
          {/* Logo mark top-right */}
          <View style={{position: 'absolute', top: insets.top + 12, right: 20, opacity: 0.25}}>
            <EjjarLogo variant="white" width={32} height={42} />
          </View>

          {isLoggedIn && user ? (
            <View style={{alignItems: 'flex-start'}}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
              }}>
                <Text style={{fontSize: 28, fontWeight: '800', color: '#FFFFFF'}}>{initials}</Text>
              </View>
              <Text style={{fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12}}>
                {user.name}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4}}>
                <Icon name="phone" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.8)'}}>
                  {maskPhone(user.phone)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{alignItems: 'flex-start'}}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
              }}>
                <Text style={{fontSize: 28, fontWeight: '800', color: '#FFFFFF'}}>
                  {isAr ? 'أح' : 'AB'}
                </Text>
              </View>
              <Text style={{fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12}}>
                {isAr ? 'أحمد البلوشي' : 'Ahmed Al-Balushi'}
              </Text>
              <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 3}}>
                {isAr ? 'شركة مسقط للإنشاءات' : 'Muscat Construction Co.'}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4}}>
                <Icon name="map-marker-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.8)'}}>
                  {isAr ? 'مسقط، عُمان' : 'Muscat, Oman'}
                </Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4}}>
                <Icon name="calendar-check-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.8)'}}>
                  {isAr ? 'عضو منذ 2023' : 'Member since 2023'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
                  marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
                }}
                onPress={() => setLoginOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={{fontSize: 14, fontWeight: '600', color: '#FFFFFF'}}>
                  {isAr ? 'تسجيل الدخول / التسجيل' : 'Login / Register'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* QUICK STATS */}
        <View style={{
          flexDirection: 'row', marginHorizontal: 16, gap: 10,
          marginTop: -24,
        }}>
          {STATS_DEF.map(stat => (
            <View
              key={stat.labelEn}
              style={[{
                flex: 1, backgroundColor: colors.card, borderRadius: 16,
                padding: 12, alignItems: 'center', gap: 4,
              }, shadows.md]}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: stat.bg, alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={{fontSize: 18, fontWeight: '800', color: colors.textPrimary}}>
                {stat.value}
              </Text>
              <Text style={{fontSize: 10, color: colors.textSecondary, textAlign: 'center'}}>
                {isAr ? stat.labelAr : stat.labelEn}
              </Text>
            </View>
          ))}
        </View>

        {/* LANGUAGE CARD */}
        <View style={[{
          backgroundColor: colors.card, borderRadius: 20,
          marginHorizontal: 16, marginTop: 16, padding: 16,
        }, shadows.sm]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="translate" size={16} color={colors.primary} />
            </View>
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.textSecondary}}>
              Language / اللغة
            </Text>
          </View>

          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity
              style={{
                flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
                backgroundColor: currentLanguage === 'en' ? colors.primary : '#F8FAFC',
                borderWidth: 1.5,
                borderColor: currentLanguage === 'en' ? colors.primary : colors.border,
              }}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16, fontWeight: '700',
                color: currentLanguage === 'en' ? '#FFFFFF' : colors.textPrimary,
              }}>EN</Text>
              <Text style={{
                fontSize: 11, marginTop: 2,
                color: currentLanguage === 'en' ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
              }}>English</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
                backgroundColor: currentLanguage === 'ar' ? colors.primary : '#F8FAFC',
                borderWidth: 1.5,
                borderColor: currentLanguage === 'ar' ? colors.primary : colors.border,
              }}
              onPress={() => setLanguage('ar')}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16, fontWeight: '700',
                color: currentLanguage === 'ar' ? '#FFFFFF' : colors.textPrimary,
              }}>عربي</Text>
              <Text style={{
                fontSize: 11, marginTop: 2,
                color: currentLanguage === 'ar' ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
              }}>Arabic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MENU LIST */}
        <View style={[{
          backgroundColor: colors.card, borderRadius: 20,
          marginHorizontal: 16, marginTop: 16, overflow: 'hidden',
        }, shadows.sm]}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={{
                padding: 16, flexDirection: 'row', alignItems: 'center',
                borderBottomWidth: idx < MENU_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: '#F8FAFC',
              }}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={{flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary}}>
                {item.label}
              </Text>
              <Icon name="chevron-right" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[{
              backgroundColor: '#FEE2E2', borderRadius: 16,
              marginHorizontal: 16, marginTop: 16,
              padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }, shadows.sm]}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color={colors.error} />
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.error}}>
              {t('common.logout')}
            </Text>
          </TouchableOpacity>
        )}

        {/* VERSION */}
        <Text style={{
          textAlign: 'center', color: colors.muted,
          fontSize: 12, marginTop: 24, paddingBottom: 8,
        }}>
          EJJAR v1.0.0 · Oman Contractor Platform
        </Text>
      </ScrollView>

      <LoginBottomSheet
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </View>
  );
}
