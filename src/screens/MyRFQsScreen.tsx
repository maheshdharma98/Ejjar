import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, I18nManager, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';

interface RawRFQ {
  id: string; category: string; subcategory: string;
  country: string; city: string; start_date: string; end_date: string;
  status: string; supplier_responses: unknown[];
}

const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'active' | 'completed' | 'rejected';

const FILTERS: {key: FilterKey; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'active', label: 'Active'},
  {key: 'completed', label: 'Completed'},
  {key: 'rejected', label: 'Rejected'},
];

const ACTIVE_STATUSES = new Set(['new', 'supplier_responded', 'negotiation', 'accepted', 'confirmed']);

const STATUS_BADGE: Record<string, {bg: string; color: string; label: string}> = {
  new:               {bg: '#F3F4F6', color: '#6B7280', label: 'New'},
  supplier_responded:{bg: '#E8EEFB', color: '#1A4FBA', label: 'Quotes In'},
  negotiation:       {bg: '#FEF3C7', color: '#D97706', label: 'Negotiating'},
  accepted:          {bg: '#DCFCE7', color: '#15803D', label: 'Accepted'},
  confirmed:         {bg: '#DCFCE7', color: '#15803D', label: 'Confirmed'},
  completed:         {bg: '#DCFCE7', color: '#15803D', label: 'Completed'},
  rejected:          {bg: '#FEE2E2', color: '#DC2626', label: 'Rejected'},
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

function SkeletonCard() {
  const bg = '#E5E7EB';
  return (
    <View className="bg-white rounded-2xl shadow-sm mx-4 mb-3 p-4">
      <View className="flex-row items-center">
        <View style={{width: 40, height: 40, borderRadius: 10, backgroundColor: bg}} />
        <View className="flex-1 ms-3">
          <View style={{width: '55%', height: 14, borderRadius: 4, backgroundColor: bg}} />
          <View style={{width: '35%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
        </View>
        <View style={{width: 60, height: 22, borderRadius: 11, backgroundColor: bg}} />
      </View>
      <View style={{width: '40%', height: 12, borderRadius: 4, backgroundColor: bg, marginTop: 12}} />
      <View style={{width: '30%', height: 10, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
    </View>
  );
}

export default function MyRFQsScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
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

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return rfqsData;
    if (activeFilter === 'active') return rfqsData.filter(r => ACTIVE_STATUSES.has(r.status));
    if (activeFilter === 'completed') return rfqsData.filter(r => r.status === 'completed');
    return rfqsData.filter(r => r.status === 'rejected');
  }, [activeFilter]);

  const renderRFQ = ({item}: {item: RawRFQ}) => {
    const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.new;
    const emoji = CAT_EMOJI[item.category] ?? '📦';
    const catBg = CAT_BG[item.category] ?? '#E8EEFB';
    const quoteCount = (item.supplier_responses ?? []).length;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl shadow-sm mx-4 mb-3 p-4"
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RFQDetail', {rfqId: item.id})}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center me-3" style={{backgroundColor: catBg}}>
            <Text style={{fontSize: 18}}>{emoji}</Text>
          </View>
          <Text className="text-[#1A1A2E] text-base font-bold flex-1 capitalize me-2" numberOfLines={1}>
            {item.subcategory.replace(/_/g, ' ')}
          </Text>
          <View className="rounded-full px-2 py-0.5" style={{backgroundColor: badge.bg}}>
            <Text className="text-xs font-semibold" style={{color: badge.color}}>{badge.label}</Text>
          </View>
        </View>
        <Text className="text-[#6B7280] text-sm mt-2">{item.city}, {item.country}</Text>
        <Text className="text-[#9CA3AF] text-xs mt-0.5">
          {fmtDate(item.start_date)} → {fmtDate(item.end_date)}
        </Text>
        {quoteCount > 0 && (
          <View className="flex-row mt-2">
            <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
              <Text className="text-[#1A4FBA] text-xs font-semibold">
                {quoteCount} {t('rfq.quotesReceived').toLowerCase()}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center pt-16">
      <Text style={{fontSize: 40}}>📋</Text>
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
        <Text className="text-lg font-bold text-[#1A1A2E] flex-1">My RFQs</Text>
        <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
          <Text className="text-[#1A4FBA] text-xs font-semibold">{loading ? '…' : filtered.length}</Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View className="bg-white border-b border-[#E5E7EB]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 12, gap: 8}}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                className={`rounded-full px-4 py-2 ${isActive ? 'bg-[#1A4FBA]' : 'bg-[#F5F7FA] border border-[#E5E7EB]'}`}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingTop: 12, paddingBottom: 24}}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderRFQ}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{paddingTop: 12, paddingBottom: 24 + insets.bottom, flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A4FBA']} tintColor="#1A4FBA" />}
        />
      )}
    </View>
  );
}
