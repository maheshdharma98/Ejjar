import React, {useMemo, useState} from 'react';
import {FlatList, I18nManager, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import type {Supplier} from '../types';
import {maskPhone, maskLocation} from '../utils/masking';

interface RawResource {
  id: string;
  supplier_id: string;
  category: string;
  subcategory: string;
  status: string;
  availability_start: string;
  availability_end: string;
  specs: Record<string, unknown>;
}
interface RawReview {
  id: string;
  job_id: string;
  contractor_id: string;
  supplier_id: string;
  rating: number;
  text: string;
  created_at: string;
}

const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');
const resourcesData: RawResource[] = require('../../../shared/mock/resources.json');
const reviewsData: RawReview[] = require('../../../shared/mock/reviews.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SupplierProfile'>;

type TabKey = 'overview' | 'resources' | 'certifications' | 'reviews';

const TABS: {key: TabKey; labelKey: string}[] = [
  {key: 'overview', labelKey: 'profile.overview'},
  {key: 'resources', labelKey: 'profile.resources'},
  {key: 'certifications', labelKey: 'profile.certifications'},
  {key: 'reviews', labelKey: 'profile.reviews'},
];

const TIER_STYLE: Record<string, {bg: string; color: string; label: string}> = {
  basic:    {bg: '#F3F4F6', color: '#6B7280', label: 'Basic'},
  pro:      {bg: '#E8EEFB', color: '#1A4FBA', label: 'Pro'},
  platinum: {bg: '#FEF3C7', color: '#D97706', label: 'Platinum'},
};

const STATUS_BADGE: Record<string, {bg: string; color: string}> = {
  available:       {bg: '#DCFCE7', color: '#15803D'},
  booked:          {bg: '#FEE2E2', color: '#DC2626'},
  maintenance:     {bg: '#FEF3C7', color: '#D97706'},
  in_transit:      {bg: '#E8EEFB', color: '#1A4FBA'},
  available_soon:  {bg: '#FEF3C7', color: '#D97706'},
};

const CERTS = [
  'ISO 9001 Certified',
  'OHSAS 18001 Health & Safety',
  'Valid Trade License',
  'Civil Defense Approval',
  'Municipality Permit',
];

function StarRating({rating, size = 'sm'}: {rating: number; size?: 'sm' | 'base'}) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Text key={s} className={`text-${size} ${s <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'}`}>★</Text>
      ))}
    </View>
  );
}

export default function SupplierProfileScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {supplierId} = route.params;
  const supplier = suppliersData.find(s => s.id === supplierId);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const resources = useMemo(
    () => resourcesData.filter(r => r.supplier_id === supplierId),
    [supplierId],
  );
  const reviews = useMemo(
    () => reviewsData.filter(r => r.supplier_id === supplierId),
    [supplierId],
  );
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : supplier?.rating ?? 0;

  if (!supplier) {
    return (
      <View className="flex-1 bg-[#F5F7FA] items-center justify-center">
        <Text className="text-[#6B7280]">Supplier not found</Text>
      </View>
    );
  }

  const tier = TIER_STYLE[supplier.subscription_tier] ?? TIER_STYLE.basic;
  const initials = supplier.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const memberYear = new Date(supplier.id.includes('sup') ? '2022-01-01' : '2021-01-01').getFullYear();

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* GRADIENT HEADER */}
      <LinearGradient
        colors={['#1A4FBA', '#143D9B']}
        className="px-4 pb-8"
        style={{paddingTop: insets.top + 12}}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text className="text-white text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>{supplier.name}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* PROFILE INFO CARD — overlaps gradient */}
        <View className="bg-white rounded-2xl shadow-md mx-4 p-4" style={{marginTop: -20}}>
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#E8EEFB] items-center justify-center me-3">
              <Text className="text-[#1A4FBA] text-xl font-bold">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#1A1A2E]" numberOfLines={1}>{supplier.name}</Text>
              {supplier.verified && (
                <View className="bg-[#E8EEFB] rounded-full px-2 py-0.5 flex-row items-center gap-1 self-start mt-1">
                  <Text className="text-[#1A4FBA] text-xs">✓</Text>
                  <Text className="text-[#1A4FBA] text-xs font-medium">{t('common.verified')}</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row items-center mt-3 gap-2">
            <View className="rounded-full px-2 py-0.5" style={{backgroundColor: tier.bg}}>
              <Text className="text-xs font-medium" style={{color: tier.color}}>{tier.label}</Text>
            </View>
            <StarRating rating={supplier.rating} />
            <Text className="text-sm font-bold text-[#1A1A2E] ms-1">{supplier.rating.toFixed(1)}</Text>
          </View>

          <Text className="text-sm text-[#6B7280] mt-2">
            {maskLocation(supplier.city, Math.floor(Math.random() * 15) + 2)}
          </Text>
          <Text className="text-sm text-[#6B7280] mt-2 leading-6" numberOfLines={3}>
            {supplier.tagline}
          </Text>
        </View>

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 16, gap: 8}}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 ${isActive ? 'bg-[#1A4FBA]' : 'bg-white border border-[#E5E7EB]'}`}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB CONTENT */}
        <View className="px-4">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <View className="flex-row justify-around">
                  {[
                    {value: resources.length || 12, label: t('profile.totalJobs')},
                    {value: supplier.rating.toFixed(1), label: t('profile.reviews')},
                    {value: '2022', label: t('profile.memberSince')},
                    {value: '98%', label: t('profile.responseRate')},
                  ].map(stat => (
                    <View key={stat.label} className="items-center flex-1">
                      <Text className="text-lg font-bold text-[#1A1A2E]">{stat.value}</Text>
                      <Text className="text-xs text-[#6B7280] text-center mt-0.5" numberOfLines={2}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <Text className="text-[#1A1A2E] text-sm leading-6">{supplier.description}</Text>
              </View>

              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <Text className="text-[#1A1A2E] text-sm font-bold mb-3">Categories</Text>
                <View className="flex-row flex-wrap gap-2">
                  {supplier.categories.map(cat => (
                    <View key={cat} className="bg-[#E8EEFB] rounded-full px-3 py-1">
                      <Text className="text-[#1A4FBA] text-xs font-medium capitalize">{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* RESOURCES */}
          {activeTab === 'resources' && (
            <>
              {resources.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-[#6B7280] text-base">{t('common.noResults')}</Text>
                </View>
              ) : (
                resources.map(res => {
                  const badge = STATUS_BADGE[res.status] ?? STATUS_BADGE.available;
                  const specEntries = Object.entries(res.specs).slice(0, 3);
                  return (
                    <View key={res.id} className="bg-white rounded-xl border border-[#E5E7EB] p-3 mb-2">
                      <View className="flex-row items-center mb-2">
                        <View className="bg-[#E8EEFB] rounded-full px-2 py-0.5 me-2">
                          <Text className="text-[#1A4FBA] text-xs capitalize">{res.category}</Text>
                        </View>
                        <Text className="text-[#1A1A2E] text-sm font-medium flex-1" numberOfLines={1}>
                          {res.subcategory.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <View className="rounded-full px-2 py-0.5 me-2" style={{backgroundColor: badge.bg}}>
                          <Text className="text-xs font-medium capitalize" style={{color: badge.color}}>{res.status.replace(/_/g, ' ')}</Text>
                        </View>
                        <Text className="text-xs text-[#6B7280]">
                          {specEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-xs text-[#9CA3AF]">📞 {maskPhone(supplier.phone)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* CERTIFICATIONS */}
          {activeTab === 'certifications' && (
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              {CERTS.map((cert, i) => (
                <View key={cert}>
                  <View className="flex-row items-center py-3">
                    <View className="w-7 h-7 rounded-full bg-[#DCFCE7] items-center justify-center me-3">
                      <Text className="text-[#15803D] text-xs font-bold">✓</Text>
                    </View>
                    <Text className="text-[#1A1A2E] text-sm font-medium flex-1">{cert}</Text>
                  </View>
                  {i < CERTS.length - 1 && <View className="h-px bg-[#F5F7FA]" />}
                </View>
              ))}
            </View>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <>
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <View className="items-center">
                  <Text className="text-3xl font-bold text-[#1A1A2E]">{avgRating.toFixed(1)}</Text>
                  <View className="mt-1">
                    <StarRating rating={avgRating} size="base" />
                  </View>
                  <Text className="text-sm text-[#6B7280] mt-1">
                    {reviews.length} {t('profile.reviews').toLowerCase()}
                  </Text>
                </View>
              </View>

              {reviews.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-[#6B7280]">{t('common.noResults')}</Text>
                </View>
              ) : (
                reviews.map(rev => {
                  const maskedName = 'Contractor #' + rev.contractor_id.slice(-4).toUpperCase();
                  const date = new Date(rev.created_at).toLocaleDateString('en-GB', {month: 'short', year: 'numeric'});
                  return (
                    <View key={rev.id} className="bg-white rounded-xl border border-[#E5E7EB] p-3 mb-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[#1A1A2E] text-sm font-semibold">{maskedName}</Text>
                        <StarRating rating={rev.rating} />
                      </View>
                      <Text className="text-sm text-[#6B7280] mt-1 leading-5">{rev.text}</Text>
                      <Text className="text-xs text-[#9CA3AF] mt-1">{date}</Text>
                    </View>
                  );
                })
              )}
            </>
          )}
        </View>

        {/* BOTTOM NOTE */}
        <Text className="text-xs text-[#9CA3AF] text-center py-4 px-8">
          {t('rfq.broadcastNotice')}
        </Text>
      </ScrollView>
    </View>
  );
}
