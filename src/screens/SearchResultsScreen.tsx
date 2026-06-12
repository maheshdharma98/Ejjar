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
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import type {Supplier} from '../types';
import {useAuthStore} from '../store/authStore';
import {maskSupplierName} from '../utils/masking';
import LoginBottomSheet from '../components/common/LoginBottomSheet';
import {colors} from '../theme/designSystem';
import {useDemoData} from '../store/demoDataStore';
import {formatCurrency, getLocalizedField} from '../utils/arabicFormatters';
import type {Subcategory, Supplier as DemoSupplier} from '../../../shared/types/demo';
import Icon from '../components/common/Icon';

const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SearchResults'>;
type SortKey = 'bestMatch' | 'nearest' | 'topRated' | 'available' | 'priceLow' | 'priceHigh';
type ViewMode = 'list' | 'grid';

// Spec-specific tokens
const T = {
  cardBorder:      '#E2E8F0',
  footerBg:        '#F8FAFC',
  chipBorder:      '#E2E8F0',
  locColor:        '#7a9090',
  emptyIconColor:  '#d4c9b8',
  priceLabelColor: '#64748B',
  statDivider:     '#E2E8F0',
  ctaBarBg:        '#101828',
  ctaBarBorder:    '#101828',
  inactiveTab:     '#94A3B8',
};

const SORT_CHIPS: {key: SortKey; labelEn: string; labelAr: string; icon: string}[] = [
  {key: 'bestMatch',  labelEn: 'Best Match',  labelAr: 'الأفضل',         icon: 'auto-fix'},
  {key: 'nearest',    labelEn: 'Nearest',     labelAr: 'الأقرب',         icon: 'map-marker-outline'},
  {key: 'topRated',   labelEn: 'Top Rated',   labelAr: 'الأعلى تقييماً', icon: 'star-outline'},
  {key: 'available',  labelEn: 'Available',   labelAr: 'متاح',           icon: 'lightning-bolt'},
  {key: 'priceLow',   labelEn: 'Price: Low',  labelAr: 'السعر ↑',        icon: 'sort-ascending'},
  {key: 'priceHigh',  labelEn: 'Price: High', labelAr: 'السعر ↓',        icon: 'sort-descending'},
];

const getCategoryMeta = (cat: string) => {
  if (cat === 'manpower') return {bg: '#FFF0D6', color: '#C9974A', icon: 'account-hard-hat'};
  if (cat === 'machinery') return {bg: '#E0F2FE', color: '#0369A1', icon: 'excavator'};
  if (cat === 'shipping') return {bg: '#FEF3C7', color: '#D97706', icon: 'truck-outline'};
  return {bg: '#E2E8F0', color: '#64748B', icon: 'briefcase-outline'};
};

const getAvailConfig = (avail: string) => {
  if (avail === 'available') return {bg: '#DCFCE7', color: '#166534', labelEn: 'Available', labelAr: 'متاح'};
  if (avail === 'busy')      return {bg: '#FEF9C3', color: '#854D0E', labelEn: 'Busy',      labelAr: 'مشغول'};
  return {bg: '#FEE2E2', color: '#991B1B', labelEn: 'Unavailable', labelAr: 'غير متاح'};
};

// Normalized card data — merges local Supplier + DemoSupplier into one shape
interface CardData {
  id: string;
  displayName: string;
  contactName?: string;
  city: string;
  category: string;
  rating: number;
  totalJobs: number;
  responseTime: string;
  yearsExperience: number;
  pricePerDay: number;
  availability: 'available' | 'busy' | 'unavailable';
  verified: boolean;
}

function fromLocalSupplier(s: Supplier, loggedIn: boolean, category: string): CardData {
  const tierMap: Record<string, {exp: number; resp: string; price: number; jobs: number}> = {
    basic:      {exp: 2,  resp: '< 4 hrs', price: 45,  jobs: 20},
    premium:    {exp: 5,  resp: '< 2 hrs', price: 70,  jobs: 60},
    enterprise: {exp: 10, resp: '< 1 hr',  price: 100, jobs: 150},
  };
  const t = tierMap[s.subscription_tier] ?? tierMap.basic;
  return {
    id: s.id,
    displayName: loggedIn ? s.name : maskSupplierName(s.id),
    city: s.city,
    category,
    rating: s.rating,
    totalJobs: t.jobs,
    responseTime: t.resp,
    yearsExperience: t.exp,
    pricePerDay: t.price,
    availability: 'available',
    verified: s.verified,
  };
}

function fromDemoSupplier(s: DemoSupplier): CardData {
  return {
    id: s.id,
    displayName: getLocalizedField(s, 'company'),
    contactName: getLocalizedField(s, 'name'),
    city: getLocalizedField(s, 'city'),
    category: s.category,
    rating: s.rating,
    totalJobs: s.totalJobs,
    responseTime: s.responseTime,
    yearsExperience: s.yearsExperience,
    pricePerDay: s.pricePerDay ?? s.pricePerHour ?? 0,
    availability: s.availability,
    verified: s.verified,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const S = '#E2E8F0';
  return (
    <View style={{
      backgroundColor: '#ffffff', borderRadius: 16,
      marginHorizontal: 14, marginBottom: 10,
      borderWidth: 1, borderColor: T.cardBorder,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
      overflow: 'hidden',
    }}>
      {/* Top section */}
      <View style={{padding: 14, flexDirection: 'row', gap: 12}}>
        <View style={{width: 52, height: 52, borderRadius: 14, backgroundColor: S}} />
        <View style={{flex: 1, gap: 7, paddingTop: 2}}>
          <View style={{width: '55%', height: 14, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: '35%', height: 11, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: '45%', height: 11, borderRadius: 4, backgroundColor: S}} />
        </View>
        <View style={{alignItems: 'flex-end', gap: 6}}>
          <View style={{width: 60, height: 10, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: 52, height: 18, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: 64, height: 20, borderRadius: 999, backgroundColor: S}} />
        </View>
      </View>
      {/* Stats row */}
      <View style={{
        flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: T.statDivider, paddingVertical: 10,
      }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{
            flex: 1, alignItems: 'center', gap: 5,
            borderRightWidth: i < 2 ? 1 : 0, borderRightColor: T.statDivider,
          }}>
            <View style={{width: 24, height: 24, borderRadius: 6, backgroundColor: S}} />
            <View style={{width: 36, height: 11, borderRadius: 4, backgroundColor: S}} />
            <View style={{width: 52, height: 9, borderRadius: 4, backgroundColor: S}} />
          </View>
        ))}
      </View>
      {/* Buttons row */}
      <View style={{padding: 14, flexDirection: 'row', gap: 8}}>
        <View style={{flex: 1, height: 38, borderRadius: 10, backgroundColor: S}} />
        <View style={{flex: 1, height: 38, borderRadius: 10, backgroundColor: S}} />
      </View>
    </View>
  );
}

// ── Supplier Card ─────────────────────────────────────────────────────────────

interface CardProps {
  data: CardData;
  isAr: boolean;
  onViewProfile: (id: string) => void;
  onSendQuote: () => void;
}

function SupplierCard({data, isAr, onViewProfile, onSendQuote}: CardProps) {
  const row = isAr ? 'row-reverse' : 'row';
  const cat = getCategoryMeta(data.category);
  const avail = getAvailConfig(data.availability);

  // Render 5 stars inline for color control
  const stars = [1, 2, 3, 4, 5].map(i => {
    if (data.rating >= i) return 'star';
    if (data.rating >= i - 0.5) return 'star-half-full';
    return 'star-outline';
  });

  return (
    <View style={{
      backgroundColor: '#ffffff', borderRadius: 16,
      marginHorizontal: 14, marginBottom: 10,
      borderWidth: 1, borderColor: T.cardBorder,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
      overflow: 'hidden',
    }}>

      {/* ── Top section ── */}
      <View style={{padding: 14, flexDirection: row, alignItems: 'flex-start', gap: 12}}>
        {/* Avatar */}
        <View style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={cat.icon as any} size={24} color={cat.color} />
        </View>

        {/* Middle info */}
        <View style={{flex: 1}}>
          {/* Name + verified badge row */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2}}>
            <Text
              style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary, flexShrink: 1}}
              numberOfLines={1}
            >
              {data.displayName}
            </Text>
            {data.verified && (
              <View style={{
                flexDirection: row, alignItems: 'center', gap: 3,
                backgroundColor: '#E0F2FE', borderRadius: 999,
                paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0,
              }}>
                <Icon name="check-decagram" size={12} color={colors.primary} />
                <Text style={{fontSize: 10, fontWeight: '600', color: colors.primary}}>
                  {isAr ? 'موثق' : 'Verified'}
                </Text>
              </View>
            )}
          </View>

          {/* Contact name */}
          {!!data.contactName && (
            <Text style={{fontSize: 12, color: colors.textSecondary, marginBottom: 4}}>
              {data.contactName}
            </Text>
          )}

          {/* Location */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 3}}>
            <Icon name="map-marker-outline" size={11} color={T.locColor} />
            <Text style={{fontSize: 11, color: T.locColor}}>{data.city}</Text>
          </View>
        </View>

        {/* Right pricing */}
        <View style={{flexShrink: 0, alignItems: isAr ? 'flex-start' : 'flex-end'}}>
          <Text style={{
            fontSize: 10, fontWeight: '500', color: T.priceLabelColor, letterSpacing: 0.3,
          }}>
            {isAr ? 'السعر/يوم' : 'Price/Day'}
          </Text>
          <Text style={{fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 2}}>
            {formatCurrency(data.pricePerDay)}
          </Text>
          <View style={{
            backgroundColor: avail.bg, borderRadius: 999,
            paddingHorizontal: 9, paddingVertical: 3, marginTop: 4,
          }}>
            <Text style={{fontSize: 10, fontWeight: '600', color: avail.color}}>
              {isAr ? avail.labelAr : avail.labelEn}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={{
        flexDirection: row,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.statDivider,
      }}>
        {/* Rating */}
        <View style={{flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
          borderRightWidth: isAr ? 0 : 1, borderLeftWidth: isAr ? 1 : 0,
          borderColor: T.statDivider,
        }}>
          <View style={{flexDirection: 'row', gap: 2}}>
            {stars.map((name, idx) => (
              <Icon
                key={idx}
                name={name}
                size={13}
                color={name === 'star-outline' ? '#E2E8F0' : '#C9974A'}
              />
            ))}
          </View>
          <Text style={{fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 2}}>
            {data.rating.toFixed(1)}
          </Text>
          <Text style={{fontSize: 10, color: T.locColor, marginTop: 1}}>
            ({data.totalJobs} {isAr ? 'عمل' : 'Total Jobs'})
          </Text>
        </View>

        {/* Response Time */}
        <View style={{flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
          borderRightWidth: isAr ? 0 : 1, borderLeftWidth: isAr ? 1 : 0,
          borderColor: T.statDivider,
        }}>
          <Icon name="clock-outline" size={16} color={colors.primary} />
          <Text style={{fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 3}}>
            {data.responseTime}
          </Text>
          <Text style={{fontSize: 10, color: T.locColor, marginTop: 1}}>
            {isAr ? 'وقت الرد' : 'Response Time'}
          </Text>
        </View>

        {/* Experience */}
        <View style={{flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8}}>
          <Icon name="briefcase-outline" size={16} color={colors.gold} />
          <Text style={{fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 3}}>
            {data.yearsExperience} {isAr ? 'سنة' : 'yrs'}
          </Text>
          <Text style={{fontSize: 10, color: T.locColor, marginTop: 1}}>
            {isAr ? 'الخبرة' : 'Experience'}
          </Text>
        </View>
      </View>

      {/* ── Action row ── */}
      <View style={{padding: 14, flexDirection: row, gap: 8}}>
        {/* View Profile — outline */}
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 6,
            borderWidth: 1.5, borderColor: colors.primary,
            borderRadius: 10, paddingVertical: 10,
          }}
          activeOpacity={0.8}
          onPress={() => onViewProfile(data.id)}
        >
          <Icon name="account-outline" size={14} color={colors.primary} />
          <Text style={{fontSize: 13, fontWeight: '500', color: colors.primary}}>
            {isAr ? 'عرض الملف' : 'View Profile'}
          </Text>
        </TouchableOpacity>

        {/* Send Quote — orange CTA */}
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: '#E67E3A',
            borderRadius: 10, paddingVertical: 10,
          }}
          activeOpacity={0.85}
          onPress={onSendQuote}
        >
          <Icon name="send-outline" size={14} color="#ffffff" />
          <Text style={{fontSize: 13, fontWeight: '600', color: '#ffffff'}}>
            {isAr ? 'إرسال عرض' : 'Send Quote'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SearchResultsScreen() {
  const {t} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {category, params} = route.params;
  const city          = (params?.city as string) ?? '';
  const country       = (params?.country as string) ?? '';
  const subcategoryId = (params?.subcategoryId as Subcategory) ?? null;
  const isDemoMode    = !!subcategoryId;

  const {isLoggedIn}            = useAuthStore();
  const {isActive, currentStep, nextStep} = useDemoStore();
  const [activeSort, setActiveSort] = useState<SortKey>('bestMatch');
  const [viewMode, setViewMode]     = useState<ViewMode>('list');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginOpen, setLoginOpen]   = useState(false);
  const isAr = I18nManager.isRTL;
  const row  = isAr ? 'row-reverse' : 'row';

  const getSuppliersBySubcategory = useDemoData(s => s.getSuppliersBySubcategory);
  const demoSuppliers: DemoSupplier[] = isDemoMode
    ? getSuppliersBySubcategory(subcategoryId!)
    : [];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  // Normalize all suppliers to CardData
  const allCards: CardData[] = useMemo(() => {
    if (isDemoMode) {
      return demoSuppliers.map(fromDemoSupplier);
    }
    const base = suppliersData.filter(s => {
      const matchCat     = s.categories.includes(category);
      const matchCountry = !country || s.country === country;
      return matchCat && matchCountry;
    });
    return base.map(s => fromLocalSupplier(s, isLoggedIn, category));
  }, [isDemoMode, demoSuppliers, category, country, isLoggedIn]);

  // Sort
  const sorted: CardData[] = useMemo(() => {
    const list = [...allCards];
    switch (activeSort) {
      case 'topRated':   list.sort((a, b) => b.rating - a.rating); break;
      case 'available':  list.sort((a, b) => (a.availability === 'available' ? -1 : 1) - (b.availability === 'available' ? -1 : 1)); break;
      case 'priceLow':   list.sort((a, b) => a.pricePerDay - b.pricePerDay); break;
      case 'priceHigh':  list.sort((a, b) => b.pricePerDay - a.pricePerDay); break;
      case 'nearest':
        list.sort((a, b) => (city ? (a.city === city ? -1 : 1) - (b.city === city ? -1 : 1) : 0)); break;
      default: // bestMatch — verified first, then rating
        list.sort((a, b) => {
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          return b.rating - a.rating;
        });
    }
    return list;
  }, [allCards, activeSort, city]);

  const handleViewProfile = (supplierId: string) => {
    navigation.navigate('SupplierProfile', {supplierId});
  };

  const handleBroadcastRFQ = () => {
    if (!isLoggedIn) { setLoginOpen(true); return; }
    if (isDemoMode) {
      navigation.navigate('RFQBroadcast', {
        rfqId: 'RFQ_DEMO_001',
        supplierCount: sorted.length,
        city: (city as string) || 'Muscat',
      });
      return;
    }
    navigation.navigate('RFQForm', {category, params: {country, city}});
  };

  const handleLoginSuccess = () => {
    navigation.navigate('RFQForm', {category, params: {country, city}});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={{alignItems: 'center', paddingTop: 48, paddingHorizontal: 20}}>
      <Icon name="account-off-outline" size={48} color={T.emptyIconColor} />
      <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 12}}>
        {isAr ? 'لا يوجد موردون' : 'No suppliers found'}
      </Text>
      <Text style={{fontSize: 13, color: T.locColor, marginTop: 4, textAlign: 'center', lineHeight: 19}}>
        {isAr ? 'جرب تغيير الفلاتر أو الموقع' : 'Try changing your filters or location'}
      </Text>
      <TouchableOpacity
        style={{
          borderWidth: 1.5, borderColor: '#E2E8F0',
          borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10,
          marginTop: 20,
        }}
        onPress={() => setActiveSort('bestMatch')}
        activeOpacity={0.8}
      >
        <Text style={{fontSize: 13, fontWeight: '500', color: '#64748B'}}>
          {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const CTA_HEIGHT = 80;

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>

      {/* ════════ HEADER ════════ */}
      <View
        style={{
          backgroundColor: '#101828',
          paddingTop: insets.top + 14,
          paddingBottom: 16,
          paddingHorizontal: 18,
        }}
      >
        <View style={{flexDirection: row, alignItems: 'center', gap: 12}}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.7}
          >
            <Icon
              name={isAr ? 'arrow-right' : 'arrow-left'}
              size={20}
              color="#E67E3A"
            />
          </TouchableOpacity>

          {/* Title + count */}
          <View style={{flex: 1}}>
            <Text style={{fontSize: 18, fontWeight: '600', color: '#ffffff'}}>
              {isAr ? 'الموردون المتاحون' : 'Suppliers Found'}
            </Text>
            <Text style={{fontSize: 12, color: colors.muted, marginTop: 2}}>
              {loading
                ? '...'
                : `${sorted.length} ${isAr ? 'متاح' : 'Available'}`}
            </Text>
          </View>

          {/* Filter icon */}
          <TouchableOpacity
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.7}
          >
            <Icon name="tune-vertical-variant" size={20} color="#E67E3A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ════════ SORT CHIPS ════════ */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1, borderBottomColor: T.cardBorder,
      }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 14, paddingVertical: 10, gap: 8}}
        >
          {SORT_CHIPS.map(chip => {
            const isActive = activeSort === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setActiveSort(chip.key)}
                style={{
                  flexDirection: row, alignItems: 'center', gap: 5,
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: isActive ? colors.primary : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: isActive ? colors.primary : T.chipBorder,
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name={chip.icon as any}
                  size={14}
                  color={isActive ? '#ffffff' : '#a0b0b0'}
                />
                <Text style={{
                  fontSize: 12, fontWeight: '500',
                  color: isActive ? '#ffffff' : '#64748B',
                }}>
                  {isAr ? chip.labelAr : chip.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ════════ RESULTS COUNT BAR ════════ */}
      <View style={{
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
        flexDirection: row, justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Count text */}
        <Text style={{fontSize: 12, color: T.locColor}}>
          <Text style={{fontWeight: '600', color: colors.textPrimary}}>
            {loading ? '—' : sorted.length}
          </Text>
          {' '}
          {isAr ? 'مورد متاح' : 'suppliers found'}
        </Text>

        {/* View toggle */}
        <View style={{flexDirection: row, gap: 4}}>
          {(['list', 'grid'] as ViewMode[]).map(mode => {
            const isModeActive = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isModeActive ? '#FFF0D6' : 'transparent',
                }}
              >
                <Icon
                  name={mode === 'list' ? 'view-list-outline' : 'view-grid-outline'}
                  size={18}
                  color={isModeActive ? colors.gold : T.inactiveTab}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ════════ LIST ════════ */}
      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingTop: 10, paddingBottom: CTA_HEIGHT + insets.bottom + 20}}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <SupplierCard
              data={item}
              isAr={isAr}
              onViewProfile={handleViewProfile}
              onSendQuote={handleBroadcastRFQ}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: CTA_HEIGHT + insets.bottom + 20,
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

      {/* ════════ STICKY BOTTOM CTA ════════ */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: T.ctaBarBg,
        borderTopWidth: 1, borderTopColor: T.ctaBarBorder,
        paddingTop: 12, paddingBottom: 12 + insets.bottom,
        paddingHorizontal: 16,
        flexDirection: row, alignItems: 'center', gap: 12,
        zIndex: 50,
        shadowColor: '#000', shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 12,
      }}>
        {/* Broadcast icon */}
        <Icon name="access-point" size={20} color={colors.gold} />

        {/* Text */}
        <View style={{flex: 1}}>
          <Text style={{fontSize: 14, fontWeight: '600', color: '#ffffff'}}>
            {isAr ? 'إرسال طلب لجميع الموردين' : 'Submit RFQ to All Suppliers'}
          </Text>
          <Text style={{fontSize: 11, color: colors.muted, marginTop: 1}}>
            {isAr
              ? `بث إلى ${sorted.length} مورد موثق`
              : `Broadcast to ${sorted.length} verified suppliers`}
          </Text>
        </View>

        {/* Arrow circle */}
        <TouchableOpacity
          onPress={handleBroadcastRFQ}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: '#E67E3A',
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.85}
        >
          <Icon
            name={isAr ? 'arrow-left' : 'arrow-right'}
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>

      {/* ════════ OVERLAYS ════════ */}
      <LoginBottomSheet
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

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
        onNext={() => { nextStep(); setLoginOpen(true); }}
      />

      <DemoFloatingBar />
    </View>
  );
}
