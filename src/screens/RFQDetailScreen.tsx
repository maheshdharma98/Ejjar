import React, {useMemo, useState} from 'react';
import {FlatList, I18nManager, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {maskSupplierName} from '../utils/masking';

interface RawResponse {
  id: string;
  supplier_id: string;
  resource_id: string;
  unit_price_usd: number;
  total_price_usd: number;
  currency: string;
  notes: string;
  submitted_at: string;
  status: string;
}
interface RawRFQ {
  id: string;
  contractor_id: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  country: string;
  city: string;
  region: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  supplier_responses: RawResponse[];
}

const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RFQDetail'>;

const STEPS = [
  {key: 'new', label: 'New'},
  {key: 'supplier_responded', label: 'Quotes'},
  {key: 'negotiation', label: 'Negotiating'},
  {key: 'accepted', label: 'Accepted'},
  {key: 'confirmed', label: 'Confirmed'},
  {key: 'completed', label: 'Done'},
];

const STATUS_STEP: Record<string, number> = {
  new: 0,
  supplier_responded: 1,
  negotiation: 2,
  accepted: 3,
  confirmed: 4,
  completed: 5,
  rejected: -1,
};

const RESPONSE_STATUS_STYLE: Record<string, {bg: string; color: string; label: string}> = {
  submitted: {bg: '#FEF3C7', color: '#D97706', label: 'Pending'},
  pending:   {bg: '#FEF3C7', color: '#D97706', label: 'Pending'},
  accepted:  {bg: '#DCFCE7', color: '#15803D', label: 'Accepted'},
  rejected:  {bg: '#FEE2E2', color: '#DC2626', label: 'Rejected'},
  countered: {bg: '#E8EEFB', color: '#1A4FBA', label: 'Countered'},
};

function StarRating({rating}: {rating: number}) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Text key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'}`}>★</Text>
      ))}
    </View>
  );
}

export default function RFQDetailScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {rfqId} = route.params;
  const rfq = rfqsData.find(r => r.id === rfqId) ?? rfqsData[0];

  const currentStep = STATUS_STEP[rfq.status] ?? 0;

  // Local overrides for response statuses
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [counterState, setCounterState] = useState<{id: string; value: string} | null>(null);

  const responses = useMemo(() => rfq.supplier_responses ?? [], [rfq]);

  const getResponseStatus = (res: RawResponse) =>
    localStatus[res.id] ?? res.status;

  const handleAccept = (res: RawResponse) => {
    setLocalStatus(prev => ({...prev, [res.id]: 'accepted'}));
    setCounterState(null);
  };

  const handleReject = (res: RawResponse) => {
    setLocalStatus(prev => ({...prev, [res.id]: 'rejected'}));
    setCounterState(null);
  };

  const handleCounter = (res: RawResponse) => {
    setCounterState(cs => cs?.id === res.id ? null : {id: res.id, value: ''});
  };

  const handleCounterSubmit = (res: RawResponse) => {
    if (!counterState?.value) return;
    setLocalStatus(prev => ({...prev, [res.id]: 'countered'}));
    setCounterState(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
    } catch {
      return iso;
    }
  };

  const renderResponse = ({item}: {item: RawResponse}) => {
    const status = getResponseStatus(item);
    const badge = RESPONSE_STATUS_STYLE[status] ?? RESPONSE_STATUS_STYLE.pending;
    const isPending = status === 'submitted' || status === 'pending';
    const isCountering = counterState?.id === item.id;

    return (
      <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
        {/* Row 1: name + status */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[#1A1A2E] text-base font-bold flex-1 me-2" numberOfLines={1}>
            {maskSupplierName(item.supplier_id)}
          </Text>
          <View className="rounded-full px-3 py-1" style={{backgroundColor: badge.bg}}>
            <Text className="text-xs font-semibold" style={{color: badge.color}}>{badge.label}</Text>
          </View>
        </View>

        {/* Quote amount */}
        <View className="flex-row items-baseline mt-3">
          <Text className="text-base font-normal text-[#1A4FBA]">{item.currency} </Text>
          <Text className="text-2xl font-bold text-[#1A4FBA]">
            {item.total_price_usd.toLocaleString()}
          </Text>
        </View>

        {/* Notes */}
        {!!item.notes && (
          <Text className="text-sm text-[#6B7280] mt-2 leading-5">{item.notes}</Text>
        )}

        {/* Resources chips */}
        {!!item.resource_id && (
          <View className="flex-row flex-wrap gap-1 mt-2">
            <View className="bg-[#E8EEFB] rounded-full px-2 py-0.5">
              <Text className="text-[#1A4FBA] text-xs">{item.resource_id}</Text>
            </View>
          </View>
        )}

        <View className="h-px bg-[#E5E7EB] my-3" />

        {/* Action buttons (pending only) */}
        {isPending && (
          <>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="flex-1 h-10 rounded-xl items-center justify-center"
                style={{backgroundColor: '#22C55E'}}
                activeOpacity={0.8}
                onPress={() => handleAccept(item)}
              >
                <Text className="text-white text-sm font-semibold">{t('common.acceptQuote')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 h-10 rounded-xl items-center justify-center border-2 border-[#1A4FBA]"
                activeOpacity={0.7}
                onPress={() => handleCounter(item)}
              >
                <Text className="text-[#1A4FBA] text-sm font-medium">{t('common.counterQuote')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="h-10 px-4 rounded-xl items-center justify-center bg-[#FEE2E2]"
                activeOpacity={0.7}
                onPress={() => handleReject(item)}
              >
                <Text className="text-[#DC2626] text-sm font-medium">{t('common.reject')}</Text>
              </TouchableOpacity>
            </View>

            {/* Counter offer input */}
            {isCountering && (
              <View className="mt-3">
                <Text className="text-[#1A1A2E] text-sm font-medium mb-2 ps-1">Your Counter Offer ({item.currency})</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-white border-2 border-[#1A4FBA] rounded-xl h-[44px] px-4 text-[#1A1A2E] text-base"
                    value={counterState?.value ?? ''}
                    onChangeText={v => setCounterState(cs => cs ? {...cs, value: v} : null)}
                    keyboardType="decimal-pad"
                    placeholder={item.total_price_usd.toString()}
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                  />
                  <TouchableOpacity
                    className="bg-[#1A4FBA] h-[44px] px-4 rounded-xl items-center justify-center"
                    activeOpacity={0.8}
                    onPress={() => handleCounterSubmit(item)}
                  >
                    <Text className="text-white text-sm font-semibold">{t('common.submit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Non-pending footer */}
        {!isPending && (
          <Text className="text-xs text-[#9CA3AF]">
            {formatDate(item.submitted_at)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* HEADER */}
      <View
        className="bg-white shadow-sm flex-row items-center px-4"
        style={{paddingTop: insets.top + 12, paddingBottom: 12}}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text className="text-[#1A4FBA] text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#1A1A2E] flex-1">{t('rfq.title')}</Text>
        <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
          <Text className="text-[#1A4FBA] text-xs font-semibold">#{rfq.id}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* STATUS STEPPER */}
        <View
          className="bg-white mx-4 mt-3 rounded-2xl shadow-sm"
          style={{paddingVertical: 20}}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 20, alignItems: 'flex-start'}}
          >
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const circleSize = isCurrent ? 36 : 32;
              const circleColor = isPast ? '#22C55E' : isCurrent ? '#1A4FBA' : '#E5E7EB';
              const textColor = isPast ? '#22C55E' : isCurrent ? '#1A4FBA' : '#9CA3AF';
              const lineColor = isPast ? '#22C55E' : '#E5E7EB';

              return (
                <View key={step.key} className="flex-row items-center">
                  <View style={{alignItems: 'center', width: circleSize + 8}}>
                    {/* Circle */}
                    <View
                      style={{
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: circleColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: isCurrent ? '#1A4FBA' : 'transparent',
                        shadowOffset: {width: 0, height: 3},
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: isCurrent ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: isCurrent ? 13 : 11,
                          fontWeight: '700',
                        }}
                      >
                        {isPast ? '✓' : (idx + 1).toString()}
                      </Text>
                    </View>
                    {/* Label */}
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: isCurrent ? '700' : '400',
                        color: textColor,
                        textAlign: 'center',
                        marginTop: 6,
                        maxWidth: 56,
                      }}
                    >
                      {step.label}
                    </Text>
                  </View>

                  {/* Connecting line */}
                  {idx < STEPS.length - 1 && (
                    <View
                      style={{
                        height: 2,
                        width: 24,
                        borderRadius: 1,
                        backgroundColor: lineColor,
                        marginBottom: 22,
                        marginHorizontal: 2,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* RFQ SUMMARY CARD */}
        <View className="bg-white rounded-2xl shadow-sm mx-4 mt-1 p-4">
          <View className="flex-row items-center mb-2">
            <View className="bg-[#E8EEFB] rounded-full px-3 py-1 me-2">
              <Text className="text-[#1A4FBA] text-xs font-medium capitalize">{rfq.category}</Text>
            </View>
            <Text className="text-[#1A1A2E] text-base font-bold capitalize flex-1">
              {rfq.subcategory.replace(/_/g, ' ')}
            </Text>
          </View>

          <Text className="text-sm text-[#6B7280]">{rfq.city}, {rfq.country}</Text>
          <Text className="text-sm text-[#6B7280] mt-0.5">
            {formatDate(rfq.start_date)} → {formatDate(rfq.end_date)}
          </Text>
          <Text className="text-sm text-[#1A1A2E] leading-6 mt-2">{rfq.description}</Text>

          {responses.length > 0 && (
            <View className="flex-row items-center mt-3">
              <View className="bg-[#E8EEFB] rounded-full px-3 py-1 flex-row items-center gap-1">
                <Text className="text-[#1A4FBA] text-xs font-semibold">
                  {responses.length} {t('rfq.quotesReceived')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* QUOTES SECTION */}
        {responses.length > 0 && (
          <View className="px-4 mt-4">
            <Text className="text-lg font-bold text-[#1A1A2E] mb-3">{t('rfq.compareQuotes')}</Text>
            <FlatList
              data={responses}
              keyExtractor={item => item.id}
              renderItem={renderResponse}
              scrollEnabled={false}
            />
          </View>
        )}

        {responses.length === 0 && (
          <View className="items-center py-12 px-4">
            <Text style={{fontSize: 40}}>⏳</Text>
            <Text className="text-base text-[#6B7280] mt-3 text-center">
              {t('rfq.status_new')} — {t('search.broadcastRFQ')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
