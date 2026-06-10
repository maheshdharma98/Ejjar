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
import Icon from '../components/common/Icon';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import type {Supplier} from '../types';
import {useAuthStore} from '../store/authStore';
import {maskSupplierName} from '../utils/masking';
import LoginBottomSheet from '../components/common/LoginBottomSheet';
import {colors, shadows} from '../theme/designSystem';
import {categoryColors} from '../utils/iconMap';
import CategoryIcon from '../components/common/CategoryIcon';
import StatusBadge from '../components/common/StatusBadge';
import StarRating from '../components/common/StarRating';
import VerifiedBadge from '../components/common/VerifiedBadge';
import PremiumButton from '../components/common/PremiumButton';
import {useDemoData} from '../store/demoDataStore';
import {formatCurrency, getLocalizedField} from '../utils/arabicFormatters';
import type {Subcategory, Supplier as DemoSupplier} from '../../../shared/types/demo';

const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SearchResults'>;

type SortKey = 'bestMatch' | 'nearest' | 'rating' | 'availability';

const SORT_OPTIONS: {key: SortKey; labelKey: string; icon: string}[] = [
  {key: 'bestMatch', labelKey: 'search.sortBestMatch', icon: 'auto-fix'},
  {key: 'nearest', labelKey: 'search.sortNearest', icon: 'map-marker-radius'},
  {key: 'rating', labelKey: 'search.sortRating', icon: 'star'},
  {key: 'availability', labelKey: 'search.sortAvailability', icon: 'lightning-bolt'},
];

const TIER_STYLE: Record<string, {bg: string; color: string; label: string}> = {
  basic:    {bg: '#F1F5F9', color: '#64748B', label: 'Basic'},
  pro:      {bg: '#E8EDF2', color: '#192433', label: 'Pro'},
  platinum: {bg: '#FEF3C7', color: '#D97706', label: 'Platinum'},
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonCard() {
  const bg = '#E2E8F0';
  return (
    <View style={[{backgroundColor: colors.card, borderRadius: 16, marginBottom: 12, padding: 16}, shadows.sm]}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{width: 56, height: 56, borderRadius: 12, backgroundColor: bg}} />
        <View style={{flex: 1, marginLeft: 12}}>
          <View style={{width: '60%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '40%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
        </View>
      </View>
      <View style={{height: 1, backgroundColor: bg, marginTop: 14, marginBottom: 14}} />
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        <View style={{width: 56, height: 32, borderRadius: 8, backgroundColor: bg}} />
        <View style={{width: 56, height: 32, borderRadius: 8, backgroundColor: bg}} />
        <View style={{width: 56, height: 32, borderRadius: 8, backgroundColor: bg}} />
      </View>
      <View style={{height: 1, backgroundColor: bg, marginTop: 14, marginBottom: 14}} />
      <View style={{width: '100%', height: 40, borderRadius: 12, backgroundColor: bg}} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SearchResultsScreen() {
  const {t} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {category, params} = route.params;
  const city = (params?.city as string) ?? '';
  const country = (params?.country as string) ?? '';
  const subcategoryId = (params?.subcategoryId as Subcategory) ?? null;
  const isDemoMode = !!subcategoryId;

  const {isLoggedIn} = useAuthStore();
  const {isActive, currentStep, nextStep} = useDemoStore();
  const [activeSort, setActiveSort] = useState<SortKey>('bestMatch');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const getSuppliersBySubcategory = useDemoData(s => s.getSuppliersBySubcategory);
  const demoSuppliers: DemoSupplier[] = isDemoMode ? getSuppliersBySubcategory(subcategoryId!) : [];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filtered = useMemo(() => {
    return suppliersData.filter(s => {
      const matchCat = s.categories.includes(category);
      const matchCountry = !country || s.country === country;
      return matchCat && matchCountry;
    });
  }, [category, country]);

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
    if (activeSort === 'bestMatch') {
      const tierOrder: Record<string, number> = {platinum: 0, pro: 1, basic: 2};
      list.sort((a, b) => {
        const tDiff = (tierOrder[a.subscription_tier] ?? 2) - (tierOrder[b.subscription_tier] ?? 2);
        return tDiff !== 0 ? tDiff : b.rating - a.rating;
      });
    }
    return list;
  }, [filtered, activeSort, city]);

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

  const getWorkerCount = (supplier: Supplier): string => {
    const tier = supplier.subscription_tier;
    if (tier === 'platinum') return '100+';
    if (tier === 'pro') return '50+';
    return '20+';
  };

  const renderSupplier = ({item}: {item: Supplier}) => {
    const tier = TIER_STYLE[item.subscription_tier] ?? TIER_STYLE.basic;
    const displayName = isLoggedIn ? item.name : maskSupplierName(item.id);
    const accentColor = categoryColors[category] ?? colors.primary;

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleViewProfile(item.id)}
        style={[
          {backgroundColor: colors.card, borderRadius: 16, marginBottom: 12},
          shadows.md,
        ]}
      >
        {/* Top accent line */}
        <View style={{height: 3, backgroundColor: accentColor, borderTopLeftRadius: 16, borderTopRightRadius: 16}} />

        <View style={{padding: 16}}>
          {/* Row 1: avatar + info + badges */}
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <CategoryIcon category={category} size={28} withBackground />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={{fontSize: 15, fontWeight: '700', color: colors.textPrimary}} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3}}>
                <Icon name="map-marker" size={12} color={colors.textSecondary} />
                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                  {item.city}, {item.country}
                </Text>
              </View>
            </View>
            <View style={{alignItems: 'flex-end', gap: 4}}>
              {item.verified && <VerifiedBadge />}
              <View
                style={{
                  backgroundColor: tier.bg,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{fontSize: 11, fontWeight: '600', color: tier.color}}>
                  {tier.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />

          {/* Stats row */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
            <View style={{alignItems: 'center', gap: 3}}>
              <Icon name="account-group" size={18} color={colors.primary} />
              <Text style={{fontSize: 13, fontWeight: '700', color: colors.textPrimary}}>{getWorkerCount(item)}</Text>
              <Text style={{fontSize: 10, color: colors.textSecondary}}>Units</Text>
            </View>
            <View style={{width: 1, backgroundColor: '#F1F5F9'}} />
            <View style={{alignItems: 'center', gap: 3}}>
              <Icon name="calendar-check" size={18} color={colors.textSecondary} />
              <Text style={{fontSize: 13, fontWeight: '700', color: colors.textPrimary}}>4+ yrs</Text>
              <Text style={{fontSize: 10, color: colors.textSecondary}}>Exp</Text>
            </View>
            <View style={{width: 1, backgroundColor: '#F1F5F9'}} />
            <View style={{alignItems: 'center', gap: 3}}>
              <Icon name="clock-fast" size={18} color={colors.success} />
              <Text style={{fontSize: 13, fontWeight: '700', color: colors.textPrimary}}>&lt; 2h</Text>
              <Text style={{fontSize: 10, color: colors.textSecondary}}>Response</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />

          {/* Rating + availability */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <StarRating rating={item.rating} showNumber />
              <Text style={{fontSize: 11, color: colors.textSecondary}}>
                ({Math.floor(item.rating * 30)} reviews)
              </Text>
            </View>
            <StatusBadge status="available" />
          </View>

          {/* Action */}
          <PremiumButton
            title={t('common.viewProfile')}
            iconName="arrow-right"
            variant="outline"
            onPress={() => handleViewProfile(item.id)}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDemoSupplier = ({item}: {item: DemoSupplier}) => {
    const availColor = item.availability === 'available' ? colors.success : '#9CA3AF';
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => handleViewProfile(item.id)}
        style={[
          {backgroundColor: colors.card, borderRadius: 16, marginBottom: 12},
          shadows.md,
        ]}
      >
        {/* Top accent */}
        <View style={{height: 3, backgroundColor: colors.primary, borderTopLeftRadius: 16, borderTopRightRadius: 16}} />

        <View style={{padding: 16}}>
          {/* Row 1: company + verified + price */}
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <CategoryIcon category={category} size={26} withBackground />
            <View style={{flex: 1, marginHorizontal: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap'}}>
                <Text style={{fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1}} numberOfLines={1}>
                  {getLocalizedField(item, 'company')}
                </Text>
                {item.verified && <VerifiedBadge />}
              </View>
              <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 2}}>
                {getLocalizedField(item, 'name')}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4}}>
                <Icon name="map-marker" size={12} color={colors.textSecondary} />
                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                  {getLocalizedField(item, 'city')}
                </Text>
              </View>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={{fontSize: 11, color: colors.textSecondary}}>{t('demo:labels.pricePerDay')}</Text>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary}}>
                {formatCurrency(item.pricePerDay ?? item.pricePerHour ?? 0)}
              </Text>
              <View style={{backgroundColor: availColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4}}>
                <Text style={{color: '#FFF', fontSize: 10, fontWeight: '700'}}>
                  {t(`demo:labels.${item.availability}`)}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />

          {/* Stats */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12}}>
            <View style={{alignItems: 'center', gap: 3}}>
              <StarRating rating={item.rating} showNumber />
              <Text style={{fontSize: 10, color: colors.textSecondary}}>
                ({item.totalJobs} {t('demo:labels.totalJobs')})
              </Text>
            </View>
            <View style={{width: 1, backgroundColor: '#F1F5F9'}} />
            <View style={{alignItems: 'center', gap: 3}}>
              <Icon name="clock-fast" size={18} color={colors.success} />
              <Text style={{fontSize: 12, fontWeight: '700', color: colors.textPrimary}}>{item.responseTime}</Text>
              <Text style={{fontSize: 10, color: colors.textSecondary}}>{t('demo:labels.responseTime')}</Text>
            </View>
            <View style={{width: 1, backgroundColor: '#F1F5F9'}} />
            <View style={{alignItems: 'center', gap: 3}}>
              <Icon name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={{fontSize: 12, fontWeight: '700', color: colors.textPrimary}}>{item.yearsExperience} yrs</Text>
              <Text style={{fontSize: 10, color: colors.textSecondary}}>{t('demo:labels.yearsExperience')}</Text>
            </View>
          </View>

          <PremiumButton
            title={t('common.viewProfile')}
            iconName="arrow-right"
            variant="outline"
            onPress={() => handleViewProfile(item.id)}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{alignItems: 'center', justifyContent: 'center', paddingTop: 64}}>
      <Icon name="magnify-close" size={64} color="#CBD5E1" />
      <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: 16}}>
        No suppliers found
      </Text>
      <Text style={{fontSize: 14, color: colors.textSecondary, marginTop: 6}}>
        Try different filters
      </Text>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>

      {/* HEADER */}
      <View
        style={[
          {
            backgroundColor: colors.card,
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
          },
          shadows.sm,
        ]}
      >
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{marginRight: 12, padding: 4}}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
              <Icon name="arrow-left" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary}}>
              {t('search.title')}
            </Text>
            <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 1}}>
              {loading
                ? '...'
                : isDemoMode
                  ? `${demoSuppliers.length} ${t('demo:labels.available')}`
                  : `${sorted.length} results${city ? ` in ${city}` : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Icon name="filter-variant" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SORT BAR */}
      <View style={{backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingVertical: 10, paddingHorizontal: 16, gap: 8}}
        >
          {SORT_OPTIONS.map(opt => {
            const isActive = activeSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setActiveSort(opt.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name={opt.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SUPPLIER LIST */}
      {loading ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 112,
          }}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : isDemoMode ? (
        <FlatList
          data={demoSuppliers}
          keyExtractor={item => item.id}
          renderItem={renderDemoSupplier}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 112 + insets.bottom,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FLOATING BOTTOM BAR */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12 + insets.bottom,
          shadowColor: '#000000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <PremiumButton
          title={t('search.broadcastRFQ')}
          iconName="bullhorn"
          variant="primary"
          onPress={handleBroadcastRFQ}
        />
      </View>

      {/* LOGIN BOTTOM SHEET */}
      <LoginBottomSheet
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && currentStep === 'search_results'}
        stepNumber={5} totalSteps={18}
        title={tDemo('tour.search_results.title')}
        description={tDemo('tour.search_results.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'tap_submit_rfq'}
        stepNumber={6} totalSteps={18}
        title={tDemo('tour.tap_submit_rfq.title')}
        description={tDemo('tour.tap_submit_rfq.description')}
        onNext={() => {
          nextStep();
          setLoginOpen(true);
        }}
      />

      <DemoFloatingBar />
    </View>
  );
}
