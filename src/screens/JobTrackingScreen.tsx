import React, {useMemo} from 'react';
import {I18nManager, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import type {Supplier} from '../types';
import {isConfirmed, maskPhone, maskLocation, maskSupplierName} from '../utils/masking';
import {useToastStore} from '../store/toastStore';

interface AllocatedResource {resource_id: string; quantity: number; unit: string}
interface RawJob {
  id: string; rfq_id: string; supplier_id: string; contractor_id: string;
  allocated_resources: AllocatedResource[];
  start_date: string; end_date: string; work_order_url: string;
  status: string; country: string; city: string;
}
interface RawRFQ {id: string; category: string; subcategory: string; [k: string]: unknown}
interface RawResource {
  id: string; supplier_id: string; category: string; subcategory: string;
  status: string; specs: Record<string, unknown>;
}

const jobsData: RawJob[] = require('../../../shared/mock/jobs.json');
const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');
const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');
const resourcesData: RawResource[] = require('../../../shared/mock/resources.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'JobTracking'>;

const CAT_EMOJI: Record<string, string> = {
  manpower: '👷', machinery: '🏗️', vehicles: '🚛', shipping: '📦',
};
const CAT_BG: Record<string, string> = {
  manpower: '#E8EEFB', machinery: '#FEF3C7', vehicles: '#F0FFF4', shipping: '#F0F9FF',
};
const STATUS_BADGE: Record<string, {bg: string; color: string}> = {
  available: {bg: '#DCFCE7', color: '#15803D'},
  booked: {bg: '#FEE2E2', color: '#DC2626'},
  maintenance: {bg: '#FEF3C7', color: '#D97706'},
  in_transit: {bg: '#E8EEFB', color: '#1A4FBA'},
};

function getProgress(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 1;
  return (now - s) / (e - s);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}

export default function JobTrackingScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {showToast} = useToastStore();

  const {jobId} = route.params;
  const job = jobsData.find(j => j.id === jobId) ?? jobsData[0];
  const rfq = rfqsData.find(r => r.id === job.rfq_id);
  const supplier = suppliersData.find(s => s.id === job.supplier_id);
  const category = rfq?.category ?? 'manpower';
  const emoji = CAT_EMOJI[category] ?? '📦';
  const catBg = CAT_BG[category] ?? '#E8EEFB';

  const allocatedResources = useMemo(
    () => job.allocated_resources.map(a => ({
      ...a,
      resource: resourcesData.find(r => r.id === a.resource_id),
    })),
    [job],
  );

  const progress = getProgress(job.start_date, job.end_date);
  const confirmed = isConfirmed(job.status as any);

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* GRADIENT HEADER */}
      <LinearGradient
        colors={['#1A4FBA', '#143D9B']}
        className="px-4 pb-6"
        style={{paddingTop: insets.top + 12}}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text className="text-white text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1 capitalize">{category}</Text>
          <View className="border border-white/60 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-medium capitalize">
              {job.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* STATUS ALERT */}
        <View
          className="mx-4 mt-4 rounded-2xl p-4"
          style={{backgroundColor: job.status === 'completed' ? '#DCFCE7' : '#FEF3C7'}}
        >
          <Text
            className="font-semibold text-base"
            style={{color: job.status === 'completed' ? '#15803D' : '#D97706'}}
          >
            {job.status === 'completed' ? `✓ ${t('job.completed')}` : `⏱ ${t('job.inProgress')}`}
          </Text>
        </View>

        {/* JOB INFO CARD */}
        <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center me-3" style={{backgroundColor: catBg}}>
              <Text style={{fontSize: 20}}>{emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#1A1A2E] text-base font-bold capitalize">
                {rfq?.subcategory?.replace(/_/g, ' ') ?? category}
              </Text>
              <Text className="text-[#6B7280] text-xs mt-0.5">{job.city}, {job.country}</Text>
            </View>
          </View>
          <View className="h-px bg-[#F5F7FA] mb-3" />
          <Text className="text-[#6B7280] text-sm">
            {fmtDate(job.start_date)} → {fmtDate(job.end_date)}
          </Text>
        </View>

        {/* PROGRESS BAR */}
        <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
          <Text className="text-[#1A1A2E] text-sm font-semibold mb-3">{t('job.timeline')}</Text>
          <View className="flex-row items-center">
            <Text className="text-[#6B7280] text-xs">{fmtDate(job.start_date)}</Text>
            <View className="flex-1 mx-2 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
              <View
                className="h-2 rounded-full bg-[#1A4FBA]"
                style={{width: `${Math.round(progress * 100)}%`}}
              />
            </View>
            <Text className="text-[#6B7280] text-xs">{fmtDate(job.end_date)}</Text>
          </View>
          <Text className="text-[#9CA3AF] text-xs mt-2 text-center">
            {Math.round(progress * 100)}% complete
          </Text>
        </View>

        {/* ALLOCATED RESOURCES */}
        <View className="mx-4 mt-3">
          <Text className="text-[#1A1A2E] text-base font-bold mb-2">{t('job.allocatedResources')}</Text>
          {allocatedResources.map((item, idx) => {
            const res = item.resource;
            const resCat = res?.category ?? category;
            const badge = STATUS_BADGE[res?.status ?? 'available'] ?? STATUS_BADGE.available;
            const specEntries = res ? Object.entries(res.specs).slice(0, 2) : [];
            return (
              <View key={item.resource_id} className="bg-white rounded-xl shadow-sm p-3 mb-2 flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center me-3" style={{backgroundColor: CAT_BG[resCat] ?? '#E8EEFB'}}>
                  <Text style={{fontSize: 18}}>{CAT_EMOJI[resCat] ?? '📦'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[#1A1A2E] text-sm font-medium capitalize">
                    {res?.subcategory?.replace(/_/g, ' ') ?? item.resource_id}
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-0.5">
                    {item.quantity} {item.unit}
                    {specEntries.length > 0 && ' · '}
                    {specEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}
                  </Text>
                </View>
                <View className="rounded-full px-2 py-0.5" style={{backgroundColor: badge.bg}}>
                  <Text className="text-xs capitalize" style={{color: badge.color}}>
                    {(res?.status ?? 'available').replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* SUPPLIER CONTACT */}
        <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
          <Text className="text-[#1A1A2E] text-sm font-bold mb-3">{t('job.supplierContact')}</Text>
          {confirmed && supplier ? (
            <View>
              <Text className="text-[#1A1A2E] text-base font-semibold">{supplier.name}</Text>
              <Text className="text-[#6B7280] text-sm mt-0.5">{supplier.city}, {supplier.country}</Text>
              <TouchableOpacity
                className="bg-[#DCFCE7] rounded-xl py-2 px-4 self-start mt-3 flex-row items-center gap-2"
                activeOpacity={0.8}
                onPress={() => showToast(`Calling ${supplier.phone}`, 'success')}
              >
                <Text style={{fontSize: 16}}>📞</Text>
                <Text className="text-[#15803D] font-medium">{supplier.phone}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text className="text-[#1A1A2E] text-base font-semibold">
                {supplier ? maskSupplierName(supplier.id) : '●●●●'}
              </Text>
              <Text className="text-[#6B7280] text-sm mt-0.5">
                {job.city ? maskLocation(job.city, 5) : '●●●●'}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-2">
                📞 {maskPhone('')}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">
                Contact details available after confirmation
              </Text>
            </View>
          )}
        </View>

        {/* BOTTOM BUTTONS */}
        <TouchableOpacity
          className="border-2 border-[#1A4FBA] h-[48px] rounded-2xl items-center justify-center mx-4 mt-4"
          activeOpacity={0.7}
          onPress={() => showToast('Opening Work Order...', 'info')}
        >
          <Text className="text-[#1A4FBA] text-base font-medium">{t('job.workOrder')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center mx-4 mt-3 mb-8"
          style={{shadowColor: '#1A4FBA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6}}
          activeOpacity={0.85}
          onPress={() => showToast(t('job.completed'), 'success')}
        >
          <Text className="text-white text-base font-semibold tracking-wide">{t('common.markCompleted')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
