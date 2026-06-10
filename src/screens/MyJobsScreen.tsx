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
  {key: 'all',         labelEn: 'All',         labelAr: 'الكل',   icon: 'briefcase-outline'},
  {key: 'in_progress', labelEn: 'In Progress',  labelAr: 'جارية',  icon: 'lightning-bolt'},
  {key: 'completed',   labelEn: 'Completed',    labelAr: 'مكتملة', icon: 'check-circle'},
];

const getJobStatusConfig = (status: string) => {
  const configs: Record<string, {bg: string; color: string; accent: string; labelAr: string; labelEn: string}> = {
    pending_start: {bg: '#F3F4F6', color: '#6B7280', accent: '#9CA3AF', labelAr: 'قيد الانتظار', labelEn: 'Pending'},
    in_progress:   {bg: '#FEF3C7', color: '#D97706', accent: '#F59E0B', labelAr: 'جارية',        labelEn: 'In Progress'},
    paused:        {bg: '#FEF3C7', color: '#B45309', accent: '#D97706', labelAr: 'متوقفة',       labelEn: 'Paused'},
    completed:     {bg: '#DCFCE7', color: '#15803D', accent: '#22C55E', labelAr: 'مكتملة',       labelEn: 'Completed'},
    cancelled:     {bg: '#FEE2E2', color: '#DC2626', accent: '#EF4444', labelAr: 'ملغاة',        labelEn: 'Cancelled'},
    disputed:      {bg: '#FEE2E2', color: '#DC2626', accent: '#EF4444', labelAr: 'متنازع عليها', labelEn: 'Disputed'},
  };
  return configs[status] ?? configs.pending_start;
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
          <View style={{width: 76, height: 28, borderRadius: 14, backgroundColor: bg}} />
        </View>
        <View style={{height: 1, backgroundColor: '#F1F5F9', marginVertical: 12}} />
        <View style={{flexDirection: 'row', gap: 8}}>
          <View style={{width: 96, height: 30, borderRadius: 8, backgroundColor: bg}} />
          <View style={{width: 84, height: 30, borderRadius: 8, backgroundColor: bg}} />
        </View>
        <View style={{height: 8, borderRadius: 4, backgroundColor: bg, marginTop: 14}} />
      </View>
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

  const inProgressCount = useMemo(() => jobs.filter(j => j.status === 'in_progress' || j.status === 'pending_start').length, [jobs]);
  const completedCount = useMemo(() => jobs.filter(j => j.status === 'completed').length, [jobs]);

  const renderJob = ({item}: {item: Job}) => {
    const cfg = getJobStatusConfig(item.status);
    const isCompleted = item.status === 'completed';
    const isInProgress = item.status === 'in_progress';

    return (
      <TouchableOpacity
        style={[{backgroundColor: colors.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden'}, shadows.md]}
        activeOpacity={0.86}
        onPress={() => navigation.navigate('JobTracking', {jobId: item.id})}
      >
        {/* Left status accent */}
        <View style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: cfg.accent}} />

        <View style={{padding: 16, paddingStart: 20}}>
          {/* Top row */}
          <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 12}}>
            {/* Icon */}
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center',
            }}>
              <CategoryIcon category={item.category} size={26} />
            </View>

            {/* Title + location */}
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

          {/* Metadata chips */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
            }}>
              <Icon name="cash-multiple" size={13} color="#15803D" />
              <Text style={{fontSize: 12, fontWeight: '700', color: '#15803D'}}>
                {formatCurrency(item.amount)}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
            }}>
              <Icon name="calendar-month" size={13} color={colors.textSecondary} />
              <Text style={{fontSize: 12, fontWeight: '500', color: colors.textSecondary}}>
                {item.startDate}
              </Text>
            </View>

            {isCompleted && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              }}>
                <Icon name="check-decagram" size={13} color="#15803D" />
                <Text style={{fontSize: 11, fontWeight: '700', color: '#15803D'}}>
                  {isAr ? 'مكتمل' : '100%'}
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          {isInProgress && (
            <View style={{marginTop: 14}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6}}>
                <Text style={{fontSize: 11, fontWeight: '600', color: colors.textSecondary}}>
                  {isAr ? 'التقدم' : 'Progress'}
                </Text>
                <Text style={{fontSize: 12, fontWeight: '800', color: '#D97706'}}>
                  {item.progress}%
                </Text>
              </View>
              <View style={{height: 8, backgroundColor: '#FEF3C7', borderRadius: 4, overflow: 'hidden'}}>
                <View style={{width: `${item.progress}%`, height: 8, borderRadius: 4, backgroundColor: '#F59E0B'}} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32}}>
      <View style={{
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon name="briefcase-outline" size={40} color={colors.success} />
      </View>
      <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center'}}>
        {isAr ? 'لا توجد أعمال' : 'No jobs yet'}
      </Text>
      <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20}}>
        {isAr ? 'ستظهر أعمالك المؤكدة هنا' : 'Your confirmed jobs will appear here'}
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
              {isAr ? 'أعمالي' : 'My Jobs'}
            </Text>
            <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 3}}>
              {isAr ? 'تتبع وإدارة أعمالك' : 'Track and manage your work'}
            </Text>
          </View>
          <View style={{
            backgroundColor: colors.primaryLight, borderRadius: 16,
            paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
            borderWidth: 1, borderColor: colors.primary + '25',
          }}>
            <Text style={{fontSize: 22, fontWeight: '900', color: colors.primary}}>
              {loading ? '—' : jobs.length}
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
            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B'}} />
            <Text style={{color: colors.textPrimary, fontSize: 13, fontWeight: '700'}}>{inProgressCount}</Text>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>{isAr ? 'جارية' : 'Active'}</Text>
          </View>
          <View style={{width: 1, backgroundColor: colors.border}} />
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E'}} />
            <Text style={{color: colors.textPrimary, fontSize: 13, fontWeight: '700'}}>{completedCount}</Text>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>{isAr ? 'مكتملة' : 'Done'}</Text>
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
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderJob}
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
