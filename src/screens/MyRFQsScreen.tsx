import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';
import CategoryIcon from '../components/common/CategoryIcon';
import {useDemoData} from '../store/demoDataStore';
import {getLocalizedField, formatRelativeTime} from '../utils/arabicFormatters';
import type {RFQ} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'active' | 'completed' | 'rejected';

const FILTERS: {key: FilterKey; label: string; icon: string}[] = [
  {key: 'all', label: 'All', icon: 'file-document-outline'},
  {key: 'active', label: 'Active', icon: 'lightning-bolt'},
  {key: 'completed', label: 'Completed', icon: 'check-circle'},
  {key: 'rejected', label: 'Rejected', icon: 'close-circle-outline'},
];

const DEMO_ACTIVE_STATUSES = new Set(['broadcasted', 'receiving_quotes', 'negotiating', 'accepted']);

const getStatusConfig = (status: string) => {
  const configs: Record<string, {bg: string; color: string; labelAr: string; labelEn: string}> = {
    draft:            {bg: '#F3F4F6',         color: '#6B7280', labelAr: 'مسودة',       labelEn: 'Draft'},
    broadcasted:      {bg: '#EEF2FF',         color: '#4F46E5', labelAr: 'تم البث',     labelEn: 'Broadcasted'},
    receiving_quotes: {bg: colors.primaryLight, color: colors.primary, labelAr: 'عروض واردة', labelEn: 'Quotes In'},
    negotiating:      {bg: colors.warningLight, color: '#D97706', labelAr: 'قيد التفاوض', labelEn: 'Negotiating'},
    accepted:         {bg: '#DCFCE7',         color: '#15803D', labelAr: 'مقبول',       labelEn: 'Accepted'},
    rejected:         {bg: colors.errorLight, color: colors.error, labelAr: 'مرفوض',   labelEn: 'Rejected'},
    expired:          {bg: '#F3F4F6',         color: '#6B7280', labelAr: 'منتهي',       labelEn: 'Expired'},
  };
  return configs[status] ?? configs.draft;
};

const getCategoryIcon = (category: string) => {
  if (category === 'manpower') return 'account-hard-hat';
  if (category === 'machinery') return 'excavator';
  if (category === 'shipping') return 'truck';
  return 'briefcase-outline';
};


function SkeletonCard() {
  const bg = '#E2E8F0';
  return (
    <View style={[{backgroundColor: colors.card, borderRadius: 16, marginBottom: 10, padding: 16}, shadows.sm]}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{width: 44, height: 44, borderRadius: 12, backgroundColor: bg}} />
        <View style={{flex: 1, marginLeft: 12, gap: 6}}>
          <View style={{width: '55%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '35%', height: 11, borderRadius: 4, backgroundColor: bg}} />
        </View>
        <View style={{width: 64, height: 24, borderRadius: 12, backgroundColor: bg}} />
      </View>
      <View style={{height: 1, backgroundColor: bg, marginVertical: 12}} />
      <View style={{flexDirection: 'row', gap: 8}}>
        <View style={{width: 80, height: 12, borderRadius: 4, backgroundColor: bg}} />
        <View style={{width: 60, height: 12, borderRadius: 4, backgroundColor: bg}} />
      </View>
    </View>
  );
}

export default function MyRFQsScreen() {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderRFQ = ({item}: {item: RFQ}) => {
    const cfg = getStatusConfig(item.status);
    const quoteCount = item.quotes?.length ?? 0;
    const isAr = i18n.language === 'ar';

    return (
      <TouchableOpacity
        style={[{backgroundColor: colors.card, borderRadius: 16, marginBottom: 10}, shadows.sm]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('RFQDetail', {rfqId: item.id})}
      >
        {/* Accent bar */}
        <View style={{
          height: 3, backgroundColor: cfg.color,
          borderTopLeftRadius: 16, borderTopRightRadius: 16, opacity: 0.7,
        }} />

        <View style={{padding: 14}}>
          {/* Row: icon + info + status */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={getCategoryIcon(item.category) as any} size={22} color={colors.primary} />
            </View>
            <View style={{flex: 1, marginStart: 10}}>
              <Text
                style={{fontSize: 15, fontWeight: '700', color: colors.textPrimary}}
                numberOfLines={1}
              >
                {getLocalizedField(item, 'title')}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
                <Icon name="map-marker-outline" size={11} color={colors.textSecondary} />
                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                  {getLocalizedField(item, 'city')}
                </Text>
              </View>
            </View>
            {/* Inline status badge */}
            <View style={{backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4}}>
              <Text style={{fontSize: 11, fontWeight: '600', color: cfg.color}}>
                {isAr ? cfg.labelAr : cfg.labelEn}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 10}} />

          {/* Date row + quote chip */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
              <Icon name="calendar-range" size={12} color={colors.textSecondary} />
              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                {formatRelativeTime(item.startDate)}
              </Text>
            </View>

            {quoteCount > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: colors.primaryLight, borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Icon name="cash-multiple" size={12} color={colors.primary} />
                <Text style={{fontSize: 12, fontWeight: '600', color: colors.primary}}>
                  {quoteCount} {isAr ? 'عرض' : 'quotes'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64}}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name="file-document-outline" size={32} color={colors.primary} />
      </View>
      <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary}}>
        {t('common.noResults')}
      </Text>
      <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 5}}>
        {i18n.language === 'ar' ? 'لا توجد طلبات في هذه الفئة' : 'No RFQs in this category'}
      </Text>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* HEADER */}
      <View style={[{
        backgroundColor: colors.card,
        paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
      }, shadows.sm]}>
        <Text style={{fontSize: 20, fontWeight: '700', color: colors.textPrimary, flex: 1}}>
          {i18n.language === 'ar' ? 'طلباتي' : 'My RFQs'}
        </Text>
        <View style={{
          backgroundColor: colors.primaryLight, borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 4,
        }}>
          <Text style={{fontSize: 13, fontWeight: '700', color: colors.primary}}>
            {loading ? '…' : demoRFQs.length}
          </Text>
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
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                  backgroundColor: isActive ? colors.primary : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                activeOpacity={0.8}
              >
                <Icon name={f.icon} size={13} color={isActive ? '#FFFFFF' : colors.textSecondary} />
                <Text style={{
                  fontSize: 13, fontWeight: '500',
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24}}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderRFQ}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16, paddingTop: 12,
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
