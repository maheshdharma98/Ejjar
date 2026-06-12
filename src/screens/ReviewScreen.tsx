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
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import type {Supplier} from '../types';
import {useToastStore} from '../store/toastStore';
import {maskSupplierName} from '../utils/masking';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';
import {categoryColors, categoryBgColors} from '../utils/iconMap';
import CategoryIcon from '../components/common/CategoryIcon';
import VerifiedBadge from '../components/common/VerifiedBadge';
import PremiumButton from '../components/common/PremiumButton';

interface RawJob {id: string; rfq_id: string; supplier_id: string; end_date: string; status: string; [k: string]: unknown}
interface RawRFQ {id: string; category: string; [k: string]: unknown}

const jobsData: RawJob[] = require('../../../shared/mock/jobs.json');
const rfqsData: RawRFQ[] = require('../../../shared/mock/rfqs.json');
const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Review'>;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const RATING_COLORS = ['', colors.error, colors.error, colors.warning, colors.success, colors.success];

const TAGS = [
  {key: 'professional', label: 'Professional', icon: 'account-tie'},
  {key: 'ontime', label: 'On Time', icon: 'clock-fast'},
  {key: 'quality', label: 'Quality Work', icon: 'wrench'},
  {key: 'communication', label: 'Good Communication', icon: 'chat-outline'},
  {key: 'safe', label: 'Safety Conscious', icon: 'shield-check'},
  {key: 'value', label: 'Great Value', icon: 'cash-multiple'},
];

export default function ReviewScreen() {
  const {t} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {showToast} = useToastStore();
  const {isActive, currentStep, nextStep} = useDemoStore();

  const {jobId, supplierId} = route.params;
  const job = jobsData.find(j => j.id === jobId) ?? jobsData[0];
  const rfq = rfqsData.find(r => r.id === job.rfq_id);
  const supplier = suppliersData.find(s => s.id === (supplierId ?? job.supplier_id));
  const category = rfq?.category ?? 'manpower';
  const accentColor = categoryColors[category] ?? colors.primary;
  const catBg = categoryBgColors[category] ?? colors.primaryLight;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<Set<number>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<{rating?: string; text?: string}>({});

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStarPress = (star: number) => {
    setRating(star);
    setErrors(e => ({...e, rating: undefined}));
    Animated.sequence([
      Animated.spring(scaleAnim, {toValue: 1.18, useNativeDriver: true, speed: 50}),
      Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, speed: 20}),
    ]).start();
  };

  const toggleTag = (key: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const togglePhoto = (idx: number) => {
    setPhotos(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    if (isActive) { nextStep(); return; }
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
  const canSubmit = rating > 0 && reviewText.trim().length >= 20;

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* HEADER */}
        <View style={[{
          backgroundColor: '#101828',
          paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center',
        }, shadows.sm]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{marginRight: 12, padding: 4}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}
          >
            <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
              <Icon name="arrow-left" size={24} color="#E67E3A" />
            </View>
          </TouchableOpacity>
          <Text style={{fontSize: 18, fontWeight: '600', color: '#FFFFFF', flex: 1}}>
            {t('review.title')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 40}}
        >
          {/* SUPPLIER CARD */}
          <View style={[{
            backgroundColor: '#FFFFFF', borderRadius: 20,
            borderWidth: 1, borderColor: '#E2E8F0',
            marginHorizontal: 16, marginTop: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }, shadows.md]}>
            <CategoryIcon category={category} size={28} withBackground />
            <View style={{flex: 1}}>
              <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary}} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 2}}>
                {fmtDate(job.end_date)}
              </Text>
            </View>
            {supplier?.verified && <VerifiedBadge />}
            <View style={{
              backgroundColor: catBg, borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{fontSize: 11, fontWeight: '600', color: accentColor, textTransform: 'capitalize'}}>
                {category}
              </Text>
            </View>
          </View>

          {/* STAR RATING */}
          <View style={[{
            backgroundColor: '#FFFFFF', borderRadius: 20,
            borderWidth: 1, borderColor: '#E2E8F0',
            marginHorizontal: 16, marginTop: 12, padding: 20,
            alignItems: 'center',
          }, shadows.sm]}>
            <Text style={{fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 4}}>
              How was the service?
            </Text>
            {rating > 0 && (
              <Text style={{
                fontSize: 14, fontWeight: '600',
                color: RATING_COLORS[rating],
                marginBottom: 12,
              }}>
                {RATING_LABELS[rating]}
              </Text>
            )}
            {rating === 0 && <View style={{height: 30}} />}

            <Animated.View style={{flexDirection: 'row', gap: 10, transform: [{scale: scaleAnim}]}}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                  <Icon
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? colors.warning : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </Animated.View>

            {!!errors.rating && (
              <Text style={{fontSize: 12, color: colors.error, marginTop: 8}}>{errors.rating}</Text>
            )}
          </View>

          {/* TAGS */}
          <View style={[{
            backgroundColor: '#FFFFFF', borderRadius: 20,
            borderWidth: 1, borderColor: '#E2E8F0',
            marginHorizontal: 16, marginTop: 12, padding: 16,
          }, shadows.sm]}>
            <Text style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12}}>
              What did you like?
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {TAGS.map(tag => {
                const isSelected = selectedTags.has(tag.key);
                return (
                  <TouchableOpacity
                    key={tag.key}
                    onPress={() => toggleTag(tag.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
                      backgroundColor: isSelected ? colors.primaryLight : '#F8FAFC',
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : '#E2E8F0',
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name={tag.icon} size={13} color={isSelected ? colors.primary : colors.textSecondary} />
                    <Text style={{
                      fontSize: 12, fontWeight: '600',
                      color: isSelected ? colors.primary : colors.textSecondary,
                    }}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* REVIEW TEXT */}
          <View style={{marginHorizontal: 16, marginTop: 12}}>
            <TextInput
              style={[{
                backgroundColor: '#FFFFFF', borderRadius: 16,
                borderWidth: 1.5,
                borderColor: errors.text ? colors.error : '#E2E8F0',
                padding: 14, fontSize: 14, color: colors.textPrimary,
                minHeight: 120, textAlignVertical: 'top',
              }, shadows.sm]}
              value={reviewText}
              onChangeText={v => {setReviewText(v); setErrors(e => ({...e, text: undefined}));}}
              multiline
              numberOfLines={5}
              placeholder={t('review.placeholder')}
              placeholderTextColor={colors.muted}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingHorizontal: 4}}>
              {errors.text ? (
                <Text style={{fontSize: 11, color: colors.error}}>{errors.text}</Text>
              ) : (
                <Text style={{fontSize: 11, color: colors.muted}}>Min. 20 characters</Text>
              )}
              <Text style={{fontSize: 11, color: colors.muted}}>{reviewText.length}/500</Text>
            </View>
          </View>

          {/* PHOTOS */}
          <View style={[{
            backgroundColor: '#FFFFFF', borderRadius: 20,
            borderWidth: 1, borderColor: '#E2E8F0',
            marginHorizontal: 16, marginTop: 12, padding: 16,
          }, shadows.sm]}>
            <Text style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12}}>
              Add Photos
            </Text>
            <View style={{flexDirection: 'row', gap: 12}}>
              {[0, 1, 2].map(idx => {
                const selected = photos.has(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => togglePhoto(idx)}
                    style={{
                      flex: 1, aspectRatio: 1, borderRadius: 14,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderStyle: 'dashed',
                      borderColor: selected ? colors.primary : '#E2E8F0',
                      backgroundColor: selected ? colors.primaryLight : '#F8FAFC',
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={selected ? 'check-circle' : 'camera-plus-outline'}
                      size={26}
                      color={selected ? colors.primary : colors.muted}
                    />
                    <Text style={{
                      fontSize: 10, fontWeight: '500', marginTop: 4,
                      color: selected ? colors.primary : colors.muted,
                    }}>
                      {selected ? 'Added' : 'Photo'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SUBMIT */}
          <View style={{marginHorizontal: 16, marginTop: 20, opacity: canSubmit ? 1 : 0.5}}>
            <PremiumButton
              title={t('review.submit')}
              iconName="send"
              variant="primary"
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && currentStep === 'review_screen'}
        stepNumber={17} totalSteps={18}
        title={tDemo('tour.review_screen.title')}
        description={tDemo('tour.review_screen.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'review_submitted'}
        stepNumber={18} totalSteps={18}
        title={tDemo('tour.review_submitted.title')}
        description={tDemo('tour.review_submitted.description')}
        onNext={() => {
          useDemoStore.getState().exitDemo();
          navigation.navigate('Home' as never);
        }}
      />

      <DemoFloatingBar />
    </View>
  );
}


