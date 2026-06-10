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
import {getLocalizedField, formatCurrency} from '../utils/arabicFormatters';
import type {Job} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'in_progress' | 'completed';

const FILTERS: {key: FilterKey; labelEn: string; labelAr: string; icon: string}[] = [
  {key: 'all',         labelEn: 'All',         labelAr: 'الكل',        icon: 'briefcase-outline'},
  {key: 'in_progress', labelEn: 'In Progress',  labelAr: 'جارية',       icon: 'lightning-bolt'},
  {key: 'completed',   labelEn: 'Completed',    labelAr: 'مكتملة',      icon: 'check-circle'},
];

const getJobStatusConfig = (status: string) => {
  const configs: Record<string, {bg: string; color: string; labelAr: string; labelEn: string}> = {
    pending_start: {bg: '#F3F4F6',          color: '#6B7280', labelAr: 'قيد الانتظار', labelEn: 'Pending'},
    in_progress:   {bg: colors.warningLight, color: '#D97706', labelAr: 'جارية',        labelEn: 'In Progress'},
    paused:        {bg: '#FEF3C7',           color: '#B45309', labelAr: 'متوقفة',       labelEn: 'Paused'},
    completed:     {bg: '#DCFCE7',           color: '#15803D', labelAr: 'مكتملة',       labelEn: 'Completed'},
    cancelled:     {bg: colors.errorLight,   color: colors.error, labelAr: 'ملغاة',    labelEn: 'Cancelled'},
    disputed:      {bg: '#FEE2E2',           color: '#DC2626', labelAr: 'متنازع عليها', labelEn: 'Disputed'},
  };
  return configs[status] ?? configs.pending_start;
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
          <View style={{width: '50%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '65%', height: 11, borderRadius: 4, backgroundColor: bg}} />
        </View>
      </View>
      <View style={{width: '45%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 10}} />
      <View style={{height: 6, borderRadius: 3, backgroundColor: bg, marginTop: 10}} />
    </View>
  );
}

export default function MyJobsScreen() {
  const {i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAr = i18n.language === 'ar';

  const getMyJobs = useDemoData(s => s.getMyJobs);
  const jobs = getMyJobs();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return jobs;
    return jobs.filter(j => j.status === activeFilter);
  }, [activeFilter, jobs]);

  const renderJob = ({item}: {item: Job}) => {
    const cfg = getJobStatusConfig(item.status);
    const progressPct = item.progress;

    return (
      <TouchableOpacity
        style={[{backgroundColor: colors.card, borderRadius: 16, marginBottom: 10}, shadows.sm]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('JobTracking', {jobId: item.id})}
      >
        {/* Status accent bar */}
        <View style={{
          height: 3, backgroundColor: cfg.color,
          borderTopLeftRadius: 16, borderTopRightRadius: 16, opacity: 0.7,
        }} />

        <View style={{padding: 14}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CategoryIcon category={item.category} size={22} withBackground />
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
            <View style={{backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4}}>
              <Text style={{fontSize: 11, fontWeight: '600', color: cfg.color}}>
                {isAr ? cfg.labelAr : cfg.labelEn}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 10}} />

          {/* Amount row */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Icon name="cash-multiple" size={12} color={colors.textSecondary} />
              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Icon name="calendar-range" size={11} color={colors.textSecondary} />
              <Text style={{fontSize: 12, color: colors.textSecondary}}>{item.startDate}</Text>
            </View>
          </View>

          {/* Progress bar (in_progress only) */}
          {item.status === 'in_progress' && (
            <View style={{marginTop: 10}}>
              <View style={{height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden'}}>
                <View style={{
                  width: `${progressPct}%`,
                  height: 6, backgroundColor: colors.warning, borderRadius: 3,
                }} />
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
                <Text style={{fontSize: 10, color: colors.textSecondary}}>
                  {progressPct}% {isAr ? 'مكتمل' : 'complete'}
                </Text>
                <Text style={{fontSize: 10, color: colors.warning, fontWeight: '600'}}>
                  {isAr ? 'جارية' : 'In Progress'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64}}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name="briefcase-outline" size={32} color={colors.success} />
      </View>
      <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary}}>
        {isAr ? 'لا توجد أعمال' : 'No jobs found'}
      </Text>
      <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 5}}>
        {isAr ? 'لا توجد أعمال في هذه الفئة' : 'No jobs in this category'}
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
          {isAr ? 'أعمالي' : 'My Jobs'}
        </Text>
        <View style={{
          backgroundColor: colors.primaryLight, borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 4,
        }}>
          <Text style={{fontSize: 13, fontWeight: '700', color: colors.primary}}>
            {loading ? '…' : jobs.length}
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
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
                  backgroundColor: isActive ? colors.primary : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                activeOpacity={0.8}
              >
                <Icon name={f.icon as any} size={13} color={isActive ? '#FFFFFF' : colors.textSecondary} />
                <Text style={{
                  fontSize: 13, fontWeight: '500',
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
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24}}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderJob}
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
