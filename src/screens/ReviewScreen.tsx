import React, {useRef, useState} from 'react';
import {
  Animated,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import type {Supplier} from '../types';
import {useToastStore} from '../store/toastStore';
import {maskSupplierName} from '../utils/masking';

interface RawJob {id: string; rfq_id: string; supplier_id: string; end_date: string; status: string; [k: string]: unknown}
interface RawRFQ {id: string; category: string; [k: string]: unknown}

const jobsData: RawJob[] = require('../../../shared/mock/jobs.json');
const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');
const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Review'>;

export default function ReviewScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {showToast} = useToastStore();

  const {jobId, supplierId} = route.params;
  const job = jobsData.find(j => j.id === jobId) ?? jobsData[0];
  const rfq = rfqsData.find(r => r.id === job.rfq_id);
  const supplier = suppliersData.find(s => s.id === (supplierId ?? job.supplier_id));

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{rating?: string; text?: string}>({});

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStarPress = (star: number) => {
    setRating(star);
    setErrors(e => ({...e, rating: undefined}));
    Animated.sequence([
      Animated.spring(scaleAnim, {toValue: 1.15, useNativeDriver: true, speed: 50}),
      Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, speed: 20}),
    ]).start();
  };

  const togglePhoto = (idx: number) => {
    setPhotos(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    const e: {rating?: string; text?: string} = {};
    if (rating === 0) e.rating = t('common.required');
    if (reviewText.trim().length < 20) e.text = 'Minimum 20 characters';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    showToast(t('review.submitted'), 'success');
    navigation.goBack();
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});

  const displayName = supplier ? maskSupplierName(supplier.id) : '●●●●';

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* HEADER */}
        <View
          className="bg-white shadow-sm flex-row items-center px-4"
          style={{paddingTop: insets.top + 12, paddingBottom: 12}}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text className="text-[#1A4FBA] text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#1A1A2E] flex-1">{t('review.title')}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
          {/* SUPPLIER CARD */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#1A1A2E] text-base font-bold flex-1 me-2" numberOfLines={1}>
                {displayName}
              </Text>
              <View className="bg-[#E8EEFB] rounded-full px-3 py-1">
                <Text className="text-[#1A4FBA] text-xs font-medium capitalize">
                  {rfq?.category ?? 'service'}
                </Text>
              </View>
            </View>
            <Text className="text-[#6B7280] text-xs mt-1">{fmtDate(job.end_date)}</Text>
          </View>

          {/* STAR RATING */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-4 p-6">
            <Text className="text-[#1A1A2E] text-base font-semibold text-center mb-4">
              How was the service?
            </Text>
            <Animated.View
              className="flex-row justify-center gap-3"
              style={{transform: [{scale: scaleAnim}]}}
            >
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                  <Text style={{fontSize: 40, color: star <= rating ? '#F59E0B' : '#E5E7EB'}}>★</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
            {!!errors.rating && (
              <Text className="text-[#EF4444] text-xs text-center mt-2">{errors.rating}</Text>
            )}
          </View>

          {/* REVIEW TEXT */}
          <View className="mx-4 mt-3">
            <TextInput
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-[#1A1A2E] text-base shadow-sm"
              value={reviewText}
              onChangeText={v => {setReviewText(v); setErrors(e => ({...e, text: undefined}));}}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder={t('review.placeholder')}
              placeholderTextColor="#9CA3AF"
            />
            <View className="flex-row justify-between mt-1 px-1">
              {!!errors.text ? (
                <Text className="text-[#EF4444] text-xs">{errors.text}</Text>
              ) : (
                <Text className="text-[#9CA3AF] text-xs">Min. 20 characters</Text>
              )}
              <Text className="text-[#9CA3AF] text-xs">{reviewText.length}</Text>
            </View>
          </View>

          {/* PHOTOS */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
            <Text className="text-[#1A1A2E] text-sm font-semibold mb-3">Add Photos</Text>
            <View className="flex-row gap-3">
              {[0, 1, 2].map(idx => {
                const selected = photos.has(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => togglePhoto(idx)}
                    className="w-24 h-24 rounded-xl items-center justify-center border-2"
                    style={{
                      borderStyle: 'dashed',
                      borderColor: selected ? '#1A4FBA' : '#E5E7EB',
                      backgroundColor: selected ? '#E8EEFB' : '#FFFFFF',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{fontSize: 24, color: selected ? '#1A4FBA' : '#9CA3AF'}}>
                      {selected ? '✓' : '+'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center mx-4 mt-4 mb-8"
            style={{shadowColor: '#1A4FBA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6}}
            activeOpacity={0.85}
            onPress={handleSubmit}
          >
            <Text className="text-white text-base font-semibold tracking-wide">{t('review.submit')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
