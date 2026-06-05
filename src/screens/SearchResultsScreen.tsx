import React, {useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  I18nManager,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import type {Supplier} from '../types';
import {useAuthStore} from '../store/authStore';
import {maskSupplierName} from '../utils/masking';
import LoginBottomSheet from '../components/common/LoginBottomSheet';

const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SearchResults'>;

type SortKey = 'bestMatch' | 'nearest' | 'rating' | 'availability';

const SORT_OPTIONS: {key: SortKey; labelKey: string}[] = [
  {key: 'bestMatch', labelKey: 'search.sortBestMatch'},
  {key: 'nearest', labelKey: 'search.sortNearest'},
  {key: 'rating', labelKey: 'search.sortRating'},
  {key: 'availability', labelKey: 'search.sortAvailability'},
];

const CATEGORY_ICON: Record<string, {emoji: string; bg: string}> = {
  manpower:  {emoji: '👷', bg: '#E8EEFB'},
  machinery: {emoji: '🏗️', bg: '#FEF3C7'},
  vehicles:  {emoji: '🚛', bg: '#F0FFF4'},
  shipping:  {emoji: '📦', bg: '#F0F9FF'},
};

const CATEGORY_ACCENT: Record<string, string> = {
  manpower: '#1A4FBA',
  machinery: '#F59E0B',
  vehicles: '#22C55E',
  shipping: '#8B5CF6',
};

const TIER_STYLE: Record<string, {bg: string; color: string; label: string}> = {
  basic:    {bg: '#F3F4F6', color: '#6B7280', label: 'Basic'},
  pro:      {bg: '#E8EEFB', color: '#1A4FBA', label: 'Pro'},
  platinum: {bg: '#FEF3C7', color: '#D97706', label: 'Platinum'},
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({rating}: {rating: number}) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Text
          key={star}
          className={`text-sm ${star <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'}`}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function SkeletonCard() {
  const bg = '#E5E7EB';
  return (
    <View className="bg-white rounded-2xl shadow-sm mb-3 p-4">
      <View className="flex-row items-center">
        <View style={{width: 48, height: 48, borderRadius: 12, backgroundColor: bg}} />
        <View className="flex-1 ms-3">
          <View style={{width: '60%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '40%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
        </View>
      </View>
      <View style={{width: '45%', height: 12, borderRadius: 4, backgroundColor: bg, marginTop: 14}} />
      <View style={{width: '30%', height: 22, borderRadius: 11, backgroundColor: bg, marginTop: 10}} />
      <View style={{height: 1, backgroundColor: bg, marginTop: 14, marginBottom: 14}} />
      <View style={{width: '100%', height: 38, borderRadius: 12, backgroundColor: bg}} />
    </View>
  );
}

function AvailabilityBadge({t}: {t: (k: string) => string}) {
  return (
    <View className="bg-[#DCFCE7] rounded-full px-3 py-1 self-start">
      <Text className="text-[#15803D] text-xs font-medium">{t('common.available')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SearchResultsScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {category, params} = route.params;
  const city = (params?.city as string) ?? '';
  const country = (params?.country as string) ?? '';

  const {isLoggedIn} = useAuthStore();
  const [activeSort, setActiveSort] = useState<SortKey>('bestMatch');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Filter suppliers by category + country
  const filtered = useMemo(() => {
    return suppliersData.filter(s => {
      const matchCat = s.categories.includes(category);
      const matchCountry = !country || s.country === country;
      return matchCat && matchCountry;
    });
  }, [category, country]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (activeSort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (activeSort === 'availability') {
      list.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    } else if (activeSort === 'nearest') {
      list.sort((a, b) => {
        const aMatch = city ? (a.city === city ? 0 : 1) : 0;
        const bMatch = city ? (b.city === city ? 0 : 1) : 0;
        return aMatch - bMatch;
      });
    }
    // bestMatch: platinum first, then rating
    if (activeSort === 'bestMatch') {
      const tierOrder: Record<string, number> = {platinum: 0, pro: 1, basic: 2};
      list.sort((a, b) => {
        const tDiff = (tierOrder[a.subscription_tier] ?? 2) - (tierOrder[b.subscription_tier] ?? 2);
        return tDiff !== 0 ? tDiff : b.rating - a.rating;
      });
    }
    return list;
  }, [filtered, activeSort, city]);

  const iconInfo = CATEGORY_ICON[category] ?? CATEGORY_ICON.manpower;

  const handleViewProfile = (supplierId: string) => {
    navigation.navigate('SupplierProfile', {supplierId});
  };

  const handleBroadcastRFQ = () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    navigation.navigate('RFQForm', {category, params: {country, city}});
  };

  const handleLoginSuccess = () => {
    navigation.navigate('RFQForm', {category, params: {country, city}});
  };

  const renderSupplier = ({item}: {item: Supplier}) => {
    const tier = TIER_STYLE[item.subscription_tier] ?? TIER_STYLE.basic;
    const displayName = isLoggedIn ? item.name : maskSupplierName(item.id);
    const accentColor = CATEGORY_ACCENT[category] ?? '#1A4FBA';

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleViewProfile(item.id)}
        className="bg-white rounded-2xl shadow-sm mb-3"
        style={{overflow: 'hidden'}}
      >
      <View className="flex-row">
        {/* Left category accent bar */}
        <View style={{width: 4, backgroundColor: accentColor}} />
        <View className="flex-1 p-4">
        {/* Row 1 */}
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{backgroundColor: iconInfo.bg}}
          >
            <Text style={{fontSize: 22}}>{iconInfo.emoji}</Text>
          </View>

          <View className="flex-1 mx-3">
            <Text className="text-base font-bold text-[#1A1A2E]" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-xs text-[#6B7280] mt-0.5">
              {item.city}, {item.country}
            </Text>
          </View>

          {item.verified && (
            <View className="bg-[#E8EEFB] rounded-full px-2 py-0.5 flex-row items-center gap-1 self-start">
              <Text className="text-[#1A4FBA] text-xs">✓</Text>
              <Text className="text-[#1A4FBA] text-xs font-medium">{t('common.verified')}</Text>
            </View>
          )}
        </View>

        {/* Row 2 */}
        <View className="flex-row items-center mt-3">
          <StarRating rating={item.rating} />
          <Text className="text-sm font-bold text-[#1A1A2E] ms-1">
            {item.rating.toFixed(1)}
          </Text>
          <View
            className="rounded-full px-2 py-0.5 ms-auto"
            style={{backgroundColor: tier.bg}}
          >
            <Text className="text-xs font-medium" style={{color: tier.color}}>
              {tier.label}
            </Text>
          </View>
        </View>

        {/* Row 3 */}
        <View className="mt-2">
          <AvailabilityBadge t={t} />
        </View>

        {/* Divider */}
        <View className="h-px bg-[#E5E7EB] my-3" />

        {/* Row 4: Actions */}
        <View
          className="border-2 border-[#1A4FBA] h-[40px] rounded-xl items-center justify-center"
        >
          <Text className="text-[#1A4FBA] text-sm font-medium">{t('common.viewProfile')}</Text>
        </View>
        </View>{/* end flex-1 p-4 */}
      </View>{/* end flex-row */}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="items-center justify-center pt-16">
      <Text style={{fontSize: 40}}>🔍</Text>
      <Text className="text-base text-[#6B7280] mt-2 text-center">
        {t('search.noProviders')}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F5F7FA]">

      {/* ── HEADER ── */}
      <View
        className="bg-white shadow-sm"
        style={{paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 16}}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="me-3 p-1"
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Text className="text-[#1A4FBA] text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-[#1A1A2E]">{t('search.title')}</Text>
            <Text className="text-sm text-[#6B7280]">
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {city ? ` in ${city}` : ''}
            </Text>
          </View>
          <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
            <Text className="text-[#1A4FBA] text-xs font-semibold">
              {loading ? '…' : sorted.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── SORT BAR ── */}
      <View className="bg-white border-b border-[#E5E7EB]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingVertical: 12, paddingHorizontal: 16, gap: 8}}
        >
          {SORT_OPTIONS.map(opt => {
            const isActive = activeSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setActiveSort(opt.key)}
                className={`rounded-full px-4 py-2 ${
                  isActive ? 'bg-[#1A4FBA]' : 'bg-[#F5F7FA] border border-[#E5E7EB]'
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-white' : 'text-[#6B7280]'
                  }`}
                >
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── SUPPLIER LIST ── */}
      {loading ? (
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 112}}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={renderSupplier}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 112 + insets.bottom,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A4FBA']} tintColor="#1A4FBA" />}
        />
      )}

      {/* ── FLOATING BOTTOM BAR ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB]"
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12 + insets.bottom,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center"
          style={{shadowColor: '#1A4FBA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6}}
          activeOpacity={0.85}
          onPress={handleBroadcastRFQ}
        >
          <Text className="text-white text-base font-semibold tracking-wide">
            {t('search.broadcastRFQ')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LOGIN BOTTOM SHEET ── */}
      <LoginBottomSheet
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </View>
  );
}
