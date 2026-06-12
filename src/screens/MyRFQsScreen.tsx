import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import Icon from '../components/common/Icon';
import {colors} from '../theme/designSystem';
import {useDemoData} from '../store/demoDataStore';
import {getLocalizedField, formatRelativeTime} from '../utils/arabicFormatters';
import type {RFQ} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'all' | 'active' | 'accepted' | 'rejected';

// Spec-specific tokens (complement designSystem.ts)
const T = {
  headerBg:        '#101828',
  headerSurfaceBg: '#101828',
  headerBtnBorder: '#1A2740',
  cardBorder:      '#E2E8F0',
  footerBg:        '#F8FAFC',
  chipSep:         '#E2E8F0',
  timeColor:       '#64748B',
  locColor:        '#64748B',
  emptyIconColor:  '#94A3B8',
  tabInactive:     '#64748B',
  tabBorder:       '#E2E8F0',
};

const TABS: {key: TabKey; labelEn: string; labelAr: string}[] = [
  {key: 'all',      labelEn: 'All',      labelAr: 'الكل'},
  {key: 'active',   labelEn: 'Active',   labelAr: 'نشطة'},
  {key: 'accepted', labelEn: 'Accepted', labelAr: 'مقبولة'},
  {key: 'rejected', labelEn: 'Rejected', labelAr: 'مرفوضة'},
];

const ACTIVE_STATUSES = new Set(['broadcasted', 'receiving_quotes', 'negotiating']);

const getStatusConfig = (status: string) => {
  const map: Record<string, {bg: string; color: string; labelEn: string; labelAr: string}> = {
    draft:            {bg: '#F1F5F9', color: '#475569', labelEn: 'Pending',     labelAr: 'مسودة'},
    broadcasted:      {bg: '#E0F2FE', color: '#0369A1', labelEn: 'Broadcasted', labelAr: 'تم البث'},
    receiving_quotes: {bg: '#FEF9C3', color: '#854D0E', labelEn: 'Quotes In',   labelAr: 'عروض واردة'},
    negotiating:      {bg: '#FEF9C3', color: '#854D0E', labelEn: 'Active',      labelAr: 'قيد التفاوض'},
    accepted:         {bg: '#DCFCE7', color: '#166534', labelEn: 'Accepted',    labelAr: 'مقبول'},
    rejected:         {bg: '#FEE2E2', color: '#991B1B', labelEn: 'Rejected',    labelAr: 'مرفوض'},
    expired:          {bg: '#F1F5F9', color: '#475569', labelEn: 'Expired',     labelAr: 'منتهي'},
  };
  return map[status] ?? map.draft;
};

const getCategoryMeta = (cat: string) => {
  if (cat === 'manpower') return {bg: '#FFF0D6', color: '#C9974A', icon: 'account-hard-hat'};
  if (cat === 'machinery') return {bg: '#E0F2FE', color: '#0369A1', icon: 'excavator'};
  if (cat === 'shipping')  return {bg: '#FEF3C7', color: '#D97706', icon: 'truck-outline'};
  return {bg: '#DCFCE7', color: '#166534', icon: 'lightning-bolt'};
};

const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemMs  = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = todayMs - itemMs;
  if (diff === 0)         return 'TODAY';
  if (diff === 86400000)  return 'YESTERDAY';
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

type ListItem =
  | {type: 'section'; label: string}
  | {type: 'rfq'; data: RFQ};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const S = '#E2E8F0';
  return (
    <View style={{
      backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 8,
      borderWidth: 1, borderColor: T.cardBorder,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    }}>
      <View style={{padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <View style={{width: 44, height: 44, borderRadius: 13, backgroundColor: S}} />
        <View style={{flex: 1, gap: 8}}>
          <View style={{width: '65%', height: 13, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: '40%', height: 11, borderRadius: 4, backgroundColor: S}} />
        </View>
        <View style={{alignItems: 'flex-end', gap: 7}}>
          <View style={{width: 44, height: 10, borderRadius: 4, backgroundColor: S}} />
          <View style={{width: 72, height: 22, borderRadius: 20, backgroundColor: S}} />
        </View>
      </View>
      <View style={{
        borderTopWidth: 1, borderTopColor: T.cardBorder,
        paddingHorizontal: 14, paddingVertical: 10,
        flexDirection: 'row', gap: 8, backgroundColor: T.footerBg,
      }}>
        <View style={{width: 64, height: 20, borderRadius: 6, backgroundColor: S}} />
        <View style={{width: 56, height: 20, borderRadius: 6, backgroundColor: S}} />
        <View style={{width: 38, height: 20, borderRadius: 6, backgroundColor: S, marginStart: 'auto' as any}} />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyRFQsScreen() {
  const {i18n} = useTranslation();
  const insets  = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab]   = useState<TabKey>('all');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = i18n.language === 'ar';

  const getMyRFQs = useDemoData(s => s.getMyRFQs);
  const allRFQs   = getMyRFQs();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Stats — always from full unfiltered set
  const activeCount = useMemo(
    () => allRFQs.filter(r => ACTIVE_STATUSES.has(r.status)).length,
    [allRFQs],
  );
  const quotesCount = useMemo(
    () => allRFQs.filter(r => (r.quotes?.length ?? 0) > 0).length,
    [allRFQs],
  );
  const totalCount = allRFQs.length;
  const badgeCount = useMemo(
    () => allRFQs.filter(r => r.status === 'receiving_quotes').length,
    [allRFQs],
  );

  // Filtered list
  const filtered = useMemo(() => {
    if (activeTab === 'active')   return allRFQs.filter(r => ACTIVE_STATUSES.has(r.status));
    if (activeTab === 'accepted') return allRFQs.filter(r => r.status === 'accepted');
    if (activeTab === 'rejected') return allRFQs.filter(r => r.status === 'rejected' || r.status === 'expired');
    return allRFQs;
  }, [activeTab, allRFQs]);

  // Group by date → flat list items
  const listData = useMemo<ListItem[]>(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const items: ListItem[] = [];
    let lastLabel = '';
    for (const rfq of sorted) {
      const label = getDateLabel(rfq.createdAt);
      if (label !== lastLabel) {
        items.push({type: 'section', label});
        lastLabel = label;
      }
      items.push({type: 'rfq', data: rfq});
    }
    return items;
  }, [filtered]);

  // ── Render list item ────────────────────────────────────────────────────────

  const renderItem = ({item}: {item: ListItem}) => {
    if (item.type === 'section') {
      return (
        <Text style={{
          fontSize: 10, fontWeight: '600', color: '#64748B',
          letterSpacing: 0.8, textTransform: 'uppercase',
          marginBottom: 8, marginTop: 4,
        }}>
          {item.label}
        </Text>
      );
    }

    const rfq = item.data;
    const cfg = getStatusConfig(rfq.status);
    const cat = getCategoryMeta(rfq.category);
    const quoteCount = rfq.quotes?.length ?? 0;
    const row = isAr ? 'row-reverse' : 'row';

    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 8,
          borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden',
          shadowColor: '#000', shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RFQDetail', {rfqId: rfq.id})}
      >
        {/* ── Main section ── */}
        <View style={{padding: 14, flexDirection: row, alignItems: 'center', gap: 12}}>
          {/* Icon box */}
          <View style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={cat.icon as any} size={20} color={cat.color} />
          </View>

          {/* Middle: title + location */}
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 13, fontWeight: '600', color: colors.textPrimary,
                lineHeight: 17, marginBottom: 3,
              }}
              numberOfLines={2}
            >
              {getLocalizedField(rfq, 'title')}
            </Text>
            <View style={{flexDirection: row, alignItems: 'center', gap: 3}}>
              <Icon name="map-marker-outline" size={11} color={T.locColor} />
              <Text style={{fontSize: 11, color: T.locColor}}>
                {getLocalizedField(rfq, 'city')}
              </Text>
            </View>
          </View>

          {/* Right: time ago + status badge */}
          <View style={{flexShrink: 0, alignItems: isAr ? 'flex-start' : 'flex-end', gap: 6}}>
            <Text style={{fontSize: 10, color: T.timeColor}}>
              {formatRelativeTime(rfq.createdAt)}
            </Text>
            <View style={{
              backgroundColor: cfg.bg, borderRadius: 20,
              paddingHorizontal: 9, paddingVertical: 4,
            }}>
              <Text style={{fontSize: 10, fontWeight: '600', color: cfg.color}}>
                {isAr ? cfg.labelAr : cfg.labelEn}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer section ── */}
        <View style={{
          backgroundColor: T.footerBg, paddingHorizontal: 14, paddingVertical: 8,
          borderTopWidth: 1, borderTopColor: T.cardBorder,
          flexDirection: row, alignItems: 'center', gap: 8,
        }}>
          {/* Quote count chip */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 4}}>
            <Icon name="message-outline" size={12} color={colors.primary} />
            <Text style={{fontSize: 11, color: colors.textSecondary}}>
              {quoteCount}{' '}
              {isAr
                ? (quoteCount === 1 ? 'عرض' : 'عروض')
                : (quoteCount === 1 ? 'quote' : 'quotes')}
            </Text>
          </View>

          {/* Separator */}
          <View style={{width: 1, height: 14, backgroundColor: T.chipSep}} />

          {/* Duration chip */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 4}}>
            <Icon name="clock-outline" size={12} color="#64748B" />
            <Text style={{fontSize: 11, color: colors.textSecondary}}>
              {getLocalizedField(rfq, 'duration')}
            </Text>
          </View>

          {/* View CTA */}
          <View style={{
            flexDirection: row, alignItems: 'center', gap: 3,
            marginStart: 'auto' as any,
          }}>
            <Text style={{fontSize: 11, fontWeight: '600', color: '#E67E3A'}}>
              {isAr ? 'عرض' : 'View'}
            </Text>
            <Icon
              name={isAr ? 'arrow-left' : 'arrow-right'}
              size={12}
              color={'#E67E3A'}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────────

  const currentTab = TABS.find(t => t.key === activeTab)!;

  const renderEmpty = () => (
    <View style={{alignItems: 'center', paddingTop: 40, paddingHorizontal: 20}}>
      <Icon name="clipboard-list-outline" size={48} color={T.emptyIconColor} />
      <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 12}}>
        {isAr ? 'لا توجد طلبات هنا' : 'No RFQs here'}
      </Text>
      <Text style={{
        fontSize: 13, color: T.locColor, marginTop: 4,
        textAlign: 'center', lineHeight: 19,
      }}>
        {isAr
          ? `طلبات "${currentTab.labelAr}" ستظهر هنا`
          : `Your ${currentTab.labelEn.toLowerCase()} requests will appear here`}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#E67E3A', borderRadius: 12,
          paddingHorizontal: 24, paddingVertical: 12, marginTop: 20,
        }}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RFQForm', {category: 'manpower', params: {}})}
      >
        <Text style={{fontSize: 14, fontWeight: '600', color: '#ffffff'}}>
          {isAr ? '+ إنشاء طلب' : '+ Create RFQ'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

  const row = isAr ? 'row-reverse' : 'row';

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>

      {/* ════════ HEADER ════════ */}
      <View style={{
        backgroundColor: '#101828',
        paddingTop: insets.top + 14,
        paddingHorizontal: 18,
        paddingBottom: 14,
      }}>
        {/* Top row */}
        <View style={{
          flexDirection: row, alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14,
        }}>
          <Text style={{fontSize: 20, fontWeight: '600', color: '#ffffff'}}>
            {isAr ? 'طلباتي' : 'My RFQs'}
          </Text>

          <View style={{flexDirection: row, alignItems: 'center', gap: 8}}>
            {/* Filter button */}
            <TouchableOpacity
              style={{
                flexDirection: row, alignItems: 'center', gap: 5,
                backgroundColor: T.headerSurfaceBg,
                borderWidth: 1, borderColor: T.headerBtnBorder,
                borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
              }}
              activeOpacity={0.8}
            >
              <Icon name="tune-vertical-variant" size={13} color={colors.muted} />
              <Text style={{fontSize: 11, color: colors.muted}}>
                {isAr ? 'تصفية' : 'Filter'}
              </Text>
            </TouchableOpacity>

            {/* Bell with badge */}
            <View>
              <Icon name="bell-outline" size={19} color={'#E67E3A'} />
              {badgeCount > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: colors.terracotta,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{fontSize: 8, fontWeight: '600', color: '#ffffff'}}>
                    {badgeCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats strip — 3 equal cards */}
        <View style={{flexDirection: row, gap: 8}}>
          {/* Active */}
          <View style={{
            flex: 1, backgroundColor: T.headerSurfaceBg, borderRadius: 12,
            padding: 10, flexDirection: row, alignItems: 'center', gap: 8,
          }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: '#E67E3A22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="lightning-bolt" size={14} color={'#E67E3A'} />
            </View>
            <View>
              <Text style={{fontSize: 15, fontWeight: '600', color: '#ffffff'}}>
                {loading ? '—' : activeCount}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'نشطة' : 'Active'}
              </Text>
            </View>
          </View>

          {/* Quotes */}
          <View style={{
            flex: 1, backgroundColor: T.headerSurfaceBg, borderRadius: 12,
            padding: 10, flexDirection: row, alignItems: 'center', gap: 8,
          }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: '#16653422',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check-circle-outline" size={14} color="#166534" />
            </View>
            <View>
              <Text style={{fontSize: 15, fontWeight: '600', color: '#ffffff'}}>
                {loading ? '—' : quotesCount}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'عروض' : 'Quotes'}
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={{
            flex: 1, backgroundColor: T.headerSurfaceBg, borderRadius: 12,
            padding: 10, flexDirection: row, alignItems: 'center', gap: 8,
          }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: '#D9770622',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="file-document-outline" size={14} color="#D97706" />
            </View>
            <View>
              <Text style={{fontSize: 15, fontWeight: '600', color: '#ffffff'}}>
                {loading ? '—' : totalCount}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'الكل' : 'Total'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ════════ TAB BAR ════════ */}
      <View style={{
        backgroundColor: '#ffffff',
        flexDirection: row,
        borderBottomWidth: 1,
        borderBottomColor: T.tabBorder,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1, alignItems: 'center',
                paddingTop: 10, paddingBottom: 10, paddingHorizontal: 6,
                position: 'relative',
              }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: isActive ? '600' : '500',
                color: isActive ? colors.primary : T.tabInactive,
              }}>
                {isAr ? tab.labelAr : tab.labelEn}
              </Text>
              {isActive && (
                <View style={{
                  position: 'absolute', bottom: 0,
                  left: '20%' as any, right: '20%' as any,
                  height: 2, backgroundColor: '#E67E3A', borderRadius: 2,
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ════════ LIST BODY ════════ */}
      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24}}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.type === 'section' ? `s-${item.label}-${idx}` : `rfq-${item.data.id}`
          }
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 14, paddingTop: 12,
            paddingBottom: 80 + insets.bottom,
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
    </View>
  );
}
