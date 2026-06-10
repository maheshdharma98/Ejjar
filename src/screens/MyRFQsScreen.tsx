import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';
import {useDemoData} from '../store/demoDataStore';
import {getLocalizedField, formatRelativeTime} from '../utils/arabicFormatters';
import type {RFQ} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'active' | 'completed' | 'rejected';

const FILTERS: {key: FilterKey; labelEn: string; labelAr: string; icon: string}[] = [
  {key: 'all',       labelEn: 'All',       labelAr: 'الكل',      icon: 'file-document-outline'},
  {key: 'active',    labelEn: 'Active',    labelAr: 'نشطة',      icon: 'lightning-bolt'},
  {key: 'completed', labelEn: 'Accepted',  labelAr: 'مقبولة',    icon: 'check-circle'},
  {key: 'rejected',  labelEn: 'Rejected',  labelAr: 'مرفوضة',    icon: 'close-circle-outline'},
];

const DEMO_ACTIVE_STATUSES = new Set(['broadcasted', 'receiving_quotes', 'negotiating', 'accepted']);

const getStatusConfig = (status: string) => {
  const configs: Record<string, {bg: string; color: string; accent: string; labelAr: string; labelEn: string}> = {
    draft:            {bg: '#F3F4F6',          color: '#6B7280', accent: '#9CA3AF', labelAr: 'مسودة',        labelEn: 'Draft'},
    broadcasted:      {bg: '#EEF2FF',          color: '#4F46E5', accent: '#818CF8', labelAr: 'تم البث',      labelEn: 'Broadcasted'},
    receiving_quotes: {bg: colors.primaryLight, color: colors.primary, accent: colors.primary, labelAr: 'عروض واردة', labelEn: 'Quotes In'},
    negotiating:      {bg: '#FEF3C7',          color: '#D97706', accent: '#F59E0B', labelAr: 'قيد التفاوض',  labelEn: 'Negotiating'},
    accepted:         {bg: '#DCFCE7',          color: '#15803D', accent: '#22C55E', labelAr: 'مقبول',        labelEn: 'Accepted'},
    rejected:         {bg: '#FEE2E2',          color: '#DC2626', accent: '#EF4444', labelAr: 'مرفوض',        labelEn: 'Rejected'},
    expired:          {bg: '#F3F4F6',          color: '#6B7280', accent: '#9CA3AF', labelAr: 'منتهي',        labelEn: 'Expired'},
  };
  return configs[status] ?? configs.draft;
};

const getCategoryIcon = (category: string) => {
  if (category === 'manpower') return 'account-hard-hat';
  if (category === 'machinery') return 'excavator';
  if (category === 'shipping') return 'truck';
  return 'file-document-outline';
};

const getCategoryColor = (category: string) => {
  if (category === 'manpower') return {bg: '#E8EEFB', color: '#1A4FBA'};
  if (category === 'machinery') return {bg: '#FEF3C7', color: '#D97706'};
  if (category === 'shipping') return {bg: '#DCFCE7', color: '#15803D'};
  return {bg: colors.primaryLight, color: colors.primary};
};

function SkeletonCard() {
  const bg = '#E9EEF5';
  return (
    <View style={[{backgroundColor: colors.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden'}, shadows.md]}>
      <View style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: bg}} />
      <View style={{padding: 16, paddingStart: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 12}}>
          <View style={{width: 52, height: 52, borderRadius: 16, backgroundColor: bg}} />
          <View style={{flex: 1, gap: 8, paddingTop: 4}}>
            <View style={{width: '60%', height: 16, borderRadius: 6, backgroundColor: bg}} />
            <View style={{width: '35%', height: 12, borderRadius: 4, backgroundColor: bg}} />
          </View>
          <View style={{width: 80, height: 28, borderRadius: 14, backgroundColor: bg}} />
        </View>
        <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />
        <View style={{flexDirection: 'row', gap: 8}}>
          <View style={{width: 76, height: 28, borderRadius: 8, backgroundColor: bg}} />
          <View style={{width: 88, height: 28, borderRadius: 8, backgroundColor: bg}} />
        </View>
      </View>
    </View>
  );
}

export default function MyRFQsScreen() {
  const {i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = i18n.language === 'ar';

  const getMyRFQs = useDemoData(s => s.getMyRFQs);
  const demoRFQs = getMyRFQs();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return demoRFQs;
    if (activeFilter === 'active') return demoRFQs.filter(r => DEMO_ACTIVE_STATUSES.has(r.status));
    if (activeFilter === 'completed') return demoRFQs.filter(r => r.status === 'accepted');
    return demoRFQs.filter(r => r.status === 'rejected' || r.status === 'expired');
  }, [activeFilter, demoRFQs]);

  const activeCount  = useMemo(() => demoRFQs.filter(r => DEMO_ACTIVE_STATUSES.has(r.status)).length, [demoRFQs]);
  const pendingQuoteCount = useMemo(
    () => demoRFQs.reduce((acc, r) => acc + (r.quotes?.length ?? 0), 0),
    [demoRFQs],
  );

  const renderRFQ = ({item}: {item: RFQ}) => {
    const cfg = getStatusConfig(item.status);
    const catClr = getCategoryColor(item.category);
    const quoteCount = item.quotes?.length ?? 0;
    const hasQuotes = quoteCount > 0;
    const isBroadcasted = item.status === 'broadcasted';
    const isNegotiating = item.status === 'negotiating' || item.status === 'receiving_quotes';

    return (
      <TouchableOpacity
        style={[{backgroundColor: colors.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden'}, shadows.md]}
        activeOpacity={0.86}
        onPress={() => navigation.navigate('RFQDetail', {rfqId: item.id})}
      >
        {/* Left accent bar */}
        <View style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: cfg.accent}} />

        <View style={{padding: 16, paddingStart: 20}}>
          {/* Top row */}
          <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 12}}>
            {/* Category icon */}
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: catClr.bg, alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={getCategoryIcon(item.category) as any} size={26} color={catClr.color} />
            </View>

            {/* Title + city */}
            <View style={{flex: 1, paddingTop: 2}}>
              <Text
                style={{fontSize: 15, fontWeight: '700', color: colors.textPrimary, lineHeight: 22}}
                numberOfLines={2}
              >
                {getLocalizedField(item, 'title')}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4}}>
                <Icon name="map-marker" size={12} color={colors.primary} />
                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                  {getLocalizedField(item, 'city')}
                </Text>
              </View>
            </View>

            {/* Status badge */}
            <View style={{
              backgroundColor: cfg.bg, borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 5,
              borderWidth: 1, borderColor: cfg.color + '30',
            }}>
              <Text style={{fontSize: 11, fontWeight: '700', color: cfg.color}}>
                {isAr ? cfg.labelAr : cfg.labelEn}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />

          {/* Footer row */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {/* Date chip */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
            }}>
              <Icon name="calendar-range" size={13} color={colors.textSecondary} />
              <Text style={{fontSize: 12, fontWeight: '500', color: colors.textSecondary}}>
                {formatRelativeTime(item.startDate)}
              </Text>
            </View>

            {/* Quote count chip — prominent when has quotes */}
            {hasQuotes ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: isNegotiating ? '#FEF3C7' : colors.primaryLight,
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              }}>
                <Icon
                  name="message-text-outline"
                  size={13}
                  color={isNegotiating ? '#D97706' : colors.primary}
                />
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: isNegotiating ? '#D97706' : colors.primary,
                }}>
                  {quoteCount} {isAr ? (quoteCount === 1 ? 'عرض' : 'عروض') : (quoteCount === 1 ? 'quote' : 'quotes')}
                </Text>
              </View>
            ) : isBroadcasted ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              }}>
                <Icon name="antenna" size={13} color="#4F46E5" />
                <Text style={{fontSize: 12, fontWeight: '600', color: '#4F46E5'}}>
                  {isAr ? 'تم البث' : 'Broadcast sent'}
                </Text>
              </View>
            ) : null}

            {/* Arrow CTA */}
            <View style={{marginStart: 'auto' as any}}>
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: colors.primaryLight,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={isAr ? 'arrow-left' : 'arrow-right'} size={16} color={colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32}}>
      <View style={{
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon name="file-document-outline" size={40} color={colors.primary} />
      </View>
      <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center'}}>
        {isAr ? 'لا توجد طلبات' : 'No RFQs yet'}
      </Text>
      <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20}}>
        {isAr ? 'ستظهر طلبات عروض أسعارك هنا' : 'Your broadcast RFQs will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* HEADER */}
      <View style={{backgroundColor: colors.card, paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 0}}>
        <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 14}}>
          <View>
            <Text style={{fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5}}>
              {isAr ? 'طلباتي' : 'My RFQs'}
            </Text>
            <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 3}}>
              {isAr ? 'تتبع طلبات عروض الأسعار' : 'Track your broadcast requests'}
            </Text>
          </View>
          <View style={{
            backgroundColor: colors.primaryLight, borderRadius: 16,
            paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
            borderWidth: 1, borderColor: colors.primary + '25',
          }}>
            <Text style={{fontSize: 22, fontWeight: '900', color: colors.primary}}>
              {loading ? '—' : demoRFQs.length}
            </Text>
            <Text style={{fontSize: 10, color: colors.primary, marginTop: 1, fontWeight: '700', letterSpacing: 0.5}}>
              {isAr ? 'إجمالي' : 'TOTAL'}
            </Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={{
          flexDirection: 'row', gap: 10,
          borderTopWidth: 1, borderTopColor: colors.border,
          paddingVertical: 10,
        }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#818CF8'}} />
            <Text style={{color: colors.textPrimary, fontSize: 13, fontWeight: '700'}}>{activeCount}</Text>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>{isAr ? 'نشطة' : 'Active'}</Text>
          </View>
          <View style={{width: 1, backgroundColor: colors.border}} />
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBBF24'}} />
            <Text style={{color: colors.textPrimary, fontSize: 13, fontWeight: '700'}}>{pendingQuoteCount}</Text>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>{isAr ? 'عروض' : 'Quotes'}</Text>
          </View>
        </View>
      </View>

      {/* FILTER CHIPS */}
      <View style={{backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 10, gap: 8}}
        >
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
                  backgroundColor: isActive ? colors.primary : '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                activeOpacity={0.8}
              >
                <Icon name={f.icon as any} size={13} color={isActive ? '#FFFFFF' : colors.textSecondary} />
                <Text style={{
                  fontSize: 13, fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                }}>
                  {isAr ? f.labelAr : f.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24}}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderRFQ}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16, paddingTop: 14,
            paddingBottom: 24 + insets.bottom, flexGrow: 1,
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
    </View>
  );
}
