import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, I18nManager, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {maskSupplierName} from '../utils/masking';

interface AllocatedResource {resource_id: string; quantity: number; unit: string}
interface RawJob {
  id: string; rfq_id: string; supplier_id: string; contractor_id: string;
  allocated_resources: AllocatedResource[];
  start_date: string; end_date: string;
  status: string; country: string; city: string;
}
interface RawRFQ {id: string; category: string; subcategory: string; [k: string]: unknown}

const jobsData: RawJob[] = require('../../../shared/mock/jobs.json');
const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'in_progress' | 'completed';

const FILTERS: {key: FilterKey; labelKey: string}[] = [
  {key: 'in_progress', labelKey: 'job.inProgress'},
  {key: 'completed', labelKey: 'job.completed'},
];

const STATUS_BADGE: Record<string, {bg: string; color: string}> = {
  in_progress: {bg: '#FEF3C7', color: '#D97706'},
  completed:   {bg: '#DCFCE7', color: '#15803D'},
};

const CAT_EMOJI: Record<string, string> = {
  manpower: '👷', machinery: '🏗️', vehicles: '🚛', shipping: '📦',
};
const CAT_BG: Record<string, string> = {
  manpower: '#E8EEFB', machinery: '#FEF3C7', vehicles: '#F0FFF4', shipping: '#F0F9FF',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}

// Module-level lookup map
const rfqMap = new Map(rfqsData.map(r => [r.id, r]));

function SkeletonCard() {
  const bg = '#E5E7EB';
  return (
    <View className="bg-white rounded-2xl shadow-sm mx-4 mb-3 p-4">
      <View className="flex-row items-center">
        <View style={{width: 40, height: 40, borderRadius: 10, backgroundColor: bg}} />
        <View className="flex-1 ms-3">
          <View style={{width: '50%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '65%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
        </View>
      </View>
      <View style={{width: '45%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 10}} />
      <View style={{width: '35%', height: 10, borderRadius: 4, backgroundColor: bg, marginTop: 5}} />
    </View>
  );
}

export default function MyJobsScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('in_progress');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filtered = useMemo(
    () => jobsData.filter(j => j.status === activeFilter),
    [activeFilter],
  );

  const renderJob = ({item}: {item: RawJob}) => {
    const rfq = rfqMap.get(item.rfq_id);
    const category = rfq?.category ?? 'manpower';
    const emoji = CAT_EMOJI[category] ?? '📦';
    const catBg = CAT_BG[category] ?? '#E8EEFB';
    const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.in_progress;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl shadow-sm mx-4 mb-3 p-4"
        activeOpacity={0.85}
        onPress={() => navigation.navigate('JobTracking', {jobId: item.id})}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center me-3" style={{backgroundColor: catBg}}>
            <Text style={{fontSize: 18}}>{emoji}</Text>
          </View>
          <Text className="text-[#1A1A2E] text-base font-bold flex-1 capitalize me-2" numberOfLines={1}>
            {rfq?.subcategory?.replace(/_/g, ' ') ?? category}
          </Text>
          <View className="rounded-full px-2 py-0.5" style={{backgroundColor: badge.bg}}>
            <Text className="text-xs font-semibold capitalize" style={{color: badge.color}}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text className="text-[#6B7280] text-sm mt-2">
          {maskSupplierName(item.supplier_id)} · {item.city}
        </Text>
        <Text className="text-[#9CA3AF] text-xs mt-0.5">
          {fmtDate(item.start_date)} → {fmtDate(item.end_date)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center pt-16">
      <Text style={{fontSize: 40}}>💼</Text>
      <Text className="text-[#6B7280] text-base mt-3">{t('common.noResults')}</Text>
    </View>
  );

  const canGoBack = navigation.canGoBack();

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* HEADER */}
      <View
        className="bg-white shadow-sm flex-row items-center px-4"
        style={{paddingTop: insets.top + 12, paddingBottom: 12}}
      >
        {canGoBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text className="text-[#1A4FBA] text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-[#1A1A2E] flex-1">My Jobs</Text>
        <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
          <Text className="text-[#1A4FBA] text-xs font-semibold">{loading ? '…' : filtered.length}</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View className="bg-white border-b border-[#E5E7EB]">
        <View className="flex-row px-4 py-3 gap-2">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                className={`rounded-full px-4 py-2 ${isActive ? 'bg-[#1A4FBA]' : 'bg-[#F5F7FA] border border-[#E5E7EB]'}`}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>
                  {t(f.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingTop: 12, paddingBottom: 24}}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderJob}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{paddingTop: 12, paddingBottom: 24 + insets.bottom, flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A4FBA']} tintColor="#1A4FBA" />}
        />
      )}
    </View>
  );
}
