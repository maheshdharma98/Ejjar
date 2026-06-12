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
import {getLocalizedField, formatCurrency, formatDate} from '../utils/arabicFormatters';
import type {Job} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'all' | 'in_progress' | 'completed' | 'pending';

// Spec-specific tokens (complement designSystem.ts)
const T = {
  headerBg:        '#101828',
  headerSurfaceBg: '#101828',
  headerBtnBorder: '#1A2740',
  cardBorder:      '#E2E8F0',
  footerBg:        '#F8FAFC',
  chipSep:         '#E2E8F0',
  timeColor:       '#94A3B8',
  locColor:        '#64748B',
  emptyIconColor:  '#94A3B8',
  tabInactive:     '#64748B',
  tabBorder:       '#E2E8F0',
};

const TABS: {key: TabKey; labelEn: string; labelAr: string}[] = [
  {key: 'all',         labelEn: 'All',         labelAr: 'الكل'},
  {key: 'in_progress', labelEn: 'In Progress',  labelAr: 'جارية'},
  {key: 'completed',   labelEn: 'Completed',    labelAr: 'مكتملة'},
  {key: 'pending',     labelEn: 'Pending',      labelAr: 'معلقة'},
];

const getStatusConfig = (status: string) => {
  const map: Record<string, {bg: string; color: string; labelEn: string; labelAr: string}> = {
    pending_start: {bg: '#F1F5F9', color: '#475569', labelEn: 'Pending',     labelAr: 'قيد الانتظار'},
    in_progress:   {bg: '#FEF9C3', color: '#854D0E', labelEn: 'In Progress', labelAr: 'جارية'},
    paused:        {bg: '#F1F5F9', color: '#475569', labelEn: 'Paused',      labelAr: 'متوقفة'},
    completed:     {bg: '#DCFCE7', color: '#166534', labelEn: 'Completed',   labelAr: 'مكتملة'},
    cancelled:     {bg: '#FEE2E2', color: '#991B1B', labelEn: 'Cancelled',   labelAr: 'ملغاة'},
    disputed:      {bg: '#FEE2E2', color: '#991B1B', labelEn: 'Disputed',    labelAr: 'متنازع عليها'},
  };
  return map[status] ?? map.pending_start;
};

const getCategoryMeta = (cat: string, sub?: string) => {
  if (sub === 'electrician' || sub === 'plumber') {
    return {bg: '#DCFCE7', color: '#166534', icon: 'lightning-bolt'};
  }
  if (cat === 'manpower')  return {bg: '#FFF0D6', color: '#C9974A', icon: 'account-hard-hat'};
  if (cat === 'machinery') return {bg: '#E0F2FE', color: '#0369A1', icon: 'excavator'};
  if (cat === 'shipping')  return {bg: '#FEF3C7', color: '#D97706', icon: 'truck-outline'};
  return {bg: '#F1F5F9', color: '#475569', icon: 'briefcase-outline'};
};

const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemMs  = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = todayMs - itemMs;
  if (diff === 0)        return 'TODAY';
  if (diff === 86400000) return 'YESTERDAY';
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

type ListItem =
  | {type: 'section'; label: string}
  | {type: 'job'; data: Job};

// ── Skeleton ──────────────────────────────────────────────────────────────────

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
        <View style={{width: 72, height: 20, borderRadius: 6, backgroundColor: S}} />
        <View style={{width: 64, height: 20, borderRadius: 6, backgroundColor: S}} />
        <View style={{width: 56, height: 20, borderRadius: 6, backgroundColor: S}} />
        <View style={{width: 38, height: 20, borderRadius: 6, backgroundColor: S, marginStart: 'auto' as any}} />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyJobsScreen() {
  const {i18n} = useTranslation();
  const insets  = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab]   = useState<TabKey>('all');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = i18n.language === 'ar';

  const getMyJobs = useDemoData(s => s.getMyJobs);
  const allJobs   = getMyJobs();

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
    () => allJobs.filter(j => j.status === 'in_progress' || j.status === 'pending_start').length,
    [allJobs],
  );
  const completedCount = useMemo(
    () => allJobs.filter(j => j.status === 'completed').length,
    [allJobs],
  );
  const totalEarned = useMemo(
    () => allJobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.amount ?? 0), 0),
    [allJobs],
  );
  const badgeCount = useMemo(
    () => allJobs.filter(j => j.status === 'in_progress').length,
    [allJobs],
  );

  // Filter by tab
  const filtered = useMemo(() => {
    if (activeTab === 'in_progress') return allJobs.filter(j => j.status === 'in_progress');
    if (activeTab === 'completed')   return allJobs.filter(j => j.status === 'completed');
    if (activeTab === 'pending')     return allJobs.filter(j => j.status === 'pending_start' || j.status === 'paused');
    return allJobs;
  }, [activeTab, allJobs]);

  // Group by startDate into flat list items
  const listData = useMemo<ListItem[]>(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
    const items: ListItem[] = [];
    let lastLabel = '';
    for (const job of sorted) {
      const label = getDateLabel(job.startDate);
      if (label !== lastLabel) {
        items.push({type: 'section', label});
        lastLabel = label;
      }
      items.push({type: 'job', data: job});
    }
    return items;
  }, [filtered]);

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const row = isAr ? 'row-reverse' : 'row';

  // ── Earnings banner (scrolls with list as ListHeaderComponent) ─────────────

  const EarningsBanner = () => (
    <View style={{
      backgroundColor: T.headerBg, borderRadius: 14,
      padding: 14, marginBottom: 14,
      flexDirection: row, alignItems: 'center', gap: 12,
    }}>
      {/* Cash icon circle */}
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#E67E3A',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name="cash-multiple" size={18} color="#ffffff" />
      </View>

      {/* Labels */}
      <View style={{flex: 1}}>
        <Text style={{fontSize: 13, fontWeight: '600', color: '#ffffff'}}>
          {isAr ? 'إجمالي الأرباح' : 'Total Earnings'}
        </Text>
        <Text style={{fontSize: 11, color: colors.muted, marginTop: 2}}>
          {formatCurrency(totalEarned)}
        </Text>
      </View>

      {/* Jobs done badge */}
      <View style={{
        backgroundColor: '#E67E3A22',
        borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: '#E67E3A55',
        flexShrink: 0,
      }}>
        <Text style={{fontSize: 10, fontWeight: '600', color: '#E67E3A'}}>
          {completedCount} {isAr ? 'عمل مكتمل' : 'jobs done'}
        </Text>
      </View>
    </View>
  );

  // ── List item renderer ──────────────────────────────────────────────────────

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

    const job = item.data;
    const cfg = getStatusConfig(job.status);
    const cat = getCategoryMeta(job.category, job.subcategory);
    const pct = job.progress ?? 0;
    const progressColor = pct >= 100 ? '#166534' : pct >= 50 ? '#E67E3A' : '#94A3B8';

    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 8,
          borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden',
          shadowColor: '#000', shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('JobTracking', {jobId: job.id})}
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
              {getLocalizedField(job, 'title')}
            </Text>
            <View style={{flexDirection: row, alignItems: 'center', gap: 3}}>
              <Icon name="map-marker-outline" size={11} color={T.locColor} />
              <Text style={{fontSize: 11, color: T.locColor}}>
                {getLocalizedField(job, 'city')}
              </Text>
            </View>
          </View>

          {/* Right: date + status badge */}
          <View style={{
            flexShrink: 0,
            alignItems: isAr ? 'flex-start' : 'flex-end',
            gap: 6,
          }}>
            <Text style={{fontSize: 10, color: T.timeColor}}>
              {job.startDate}
            </Text>
            <View style={{
              backgroundColor: cfg.bg, borderRadius: 999,
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
          {/* Earnings chip */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 4}}>
            <Icon name="cash-multiple" size={13} color="#166534" />
            <Text style={{fontSize: 11, fontWeight: '600', color: '#166534'}}>
              {formatCurrency(job.amount)}
            </Text>
          </View>

          {/* Separator */}
          <View style={{width: 1, height: 14, backgroundColor: T.chipSep}} />

          {/* Date chip */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 4}}>
            <Icon name="calendar-month" size={12} color={T.timeColor} />
            <Text style={{fontSize: 11, color: T.tabInactive}}>
              {formatDate(job.startDate)}
            </Text>
          </View>

          {/* Separator */}
          <View style={{width: 1, height: 14, backgroundColor: T.chipSep}} />

          {/* Progress chip */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 4}}>
            <Icon name="check-circle-outline" size={12} color={progressColor} />
            <Text style={{fontSize: 11, color: T.tabInactive}}>
              {pct}{'% '}
              {isAr ? 'مكتمل' : 'done'}
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
              color='#E67E3A'
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={{alignItems: 'center', paddingTop: 40, paddingHorizontal: 20}}>
      <Icon name="briefcase-remove-outline" size={48} color={T.emptyIconColor} />
      <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 12}}>
        {isAr ? 'لا توجد أعمال هنا' : 'No jobs here'}
      </Text>
      <Text style={{fontSize: 13, color: T.locColor, marginTop: 4, textAlign: 'center', lineHeight: 19}}>
        {isAr
          ? `أعمال "${currentTab.labelAr}" ستظهر هنا`
          : `Your ${currentTab.labelEn.toLowerCase()} jobs will appear here`}
      </Text>
    </View>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

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
          flexDirection: row, alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: 14,
        }}>
          {/* Title + subtitle */}
          <View>
            <Text style={{fontSize: 20, fontWeight: '600', color: '#ffffff'}}>
              {isAr ? 'أعمالي' : 'My Jobs'}
            </Text>
            <Text style={{fontSize: 12, color: colors.muted, marginTop: 3}}>
              {isAr ? 'تتبع وإدارة أعمالك' : 'Track and manage your work'}
            </Text>
          </View>

          {/* Filter + Bell */}
          <View style={{flexDirection: row, alignItems: 'center', gap: 8}}>
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

            {/* Bell + badge */}
            <View>
              <Icon name="bell-outline" size={19} color='#E67E3A' />
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
              <Icon name="lightning-bolt" size={14} color='#E67E3A' />
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 15, fontWeight: '600', color: '#ffffff'}}>
                {loading ? '—' : activeCount}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'نشطة' : 'Active'}
              </Text>
            </View>
          </View>

          {/* Done */}
          <View style={{
            flex: 1, backgroundColor: T.headerSurfaceBg, borderRadius: 12,
            padding: 10, flexDirection: row, alignItems: 'center', gap: 8,
          }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: '#16663422',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check-circle-outline" size={14} color="#166634" />
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 15, fontWeight: '600', color: '#ffffff'}}>
                {loading ? '—' : completedCount}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'مكتملة' : 'Done'}
              </Text>
            </View>
          </View>

          {/* Earnings */}
          <View style={{
            flex: 1, backgroundColor: T.headerSurfaceBg, borderRadius: 12,
            padding: 10, flexDirection: row, alignItems: 'center', gap: 8,
          }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: colors.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="cash-multiple" size={14} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{fontSize: 13, fontWeight: '600', color: '#ffffff'}}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {loading ? '—' : formatCurrency(totalEarned)}
              </Text>
              <Text style={{fontSize: 9, color: colors.muted, marginTop: 1}}>
                {isAr ? 'المكتسب' : 'Earned'}
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
                paddingTop: 10, paddingBottom: 10, paddingHorizontal: 4,
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
        </ScrollView>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.type === 'section' ? `s-${item.label}-${idx}` : `job-${item.data.id}`
          }
          renderItem={renderItem}
          ListHeaderComponent={<EarningsBanner />}
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
