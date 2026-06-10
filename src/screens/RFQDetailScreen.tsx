import React, {useState} from 'react';
import {Alert, I18nManager, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from '../components/common/Icon';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useDemoData} from '../store/demoDataStore';
import {getLocalizedField, formatCurrency, formatRelativeTime} from '../utils/arabicFormatters';
import type {RFQ, QuoteMessage} from '../../../shared/types/demo';
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import {colors, shadows} from '../theme/designSystem';
import CategoryIcon from '../components/common/CategoryIcon';


type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RFQDetail'>;

const STEPS = [
  {key: 'broadcasted',      labelEn: 'Sent',        labelAr: 'تم البث',     icon: 'broadcast'},
  {key: 'receiving_quotes', labelEn: 'Quotes In',   labelAr: 'عروض واردة', icon: 'message-text-outline'},
  {key: 'negotiating',      labelEn: 'Negotiating', labelAr: 'تفاوض',       icon: 'swap-horizontal'},
  {key: 'accepted',         labelEn: 'Accepted',    labelAr: 'مقبول',       icon: 'check-circle-outline'},
];

const STATUS_STEP: Record<string, number> = {
  draft: 0,
  broadcasted: 0,
  receiving_quotes: 1,
  negotiating: 2,
  accepted: 3,
  rejected: -1,
  expired: -1,
};


export default function RFQDetailScreen() {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {rfqId} = route.params;
  const getRFQById = useDemoData(s => s.getRFQById);
  const addQuoteToRFQ = useDemoData(s => s.addQuoteToRFQ);
  const acceptQuoteAction = useDemoData(s => s.acceptQuote);
  const rejectQuoteAction = useDemoData(s => s.rejectQuote);
  const rfq = getRFQById(rfqId) as RFQ | undefined;

  const {isActive, currentStep: demoStep, nextStep: demoNext} = useDemoStore();

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  const isAr = i18n.language === 'ar';

  if (!rfq) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: colors.textSecondary}}>
          {isAr ? 'الطلب غير موجود' : 'RFQ not found'}
        </Text>
      </View>
    );
  }

  const currentStep = STATUS_STEP[rfq.status] ?? 0;

  const handleAcceptQuote = (quoteId: string) => {
    Alert.alert(
      isAr ? 'تأكيد القبول' : 'Confirm Accept',
      isAr ? 'هل تريد قبول هذا العرض وبدء العمل؟' : 'Accept this quote and start the job?',
      [
        {text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel'},
        {
          text: isAr ? 'نعم، قبول' : 'Yes, Accept',
          onPress: () => {
            const newJob = acceptQuoteAction(rfq.id, quoteId);
            if (newJob) {
              Alert.alert(
                isAr ? '🎉 تم القبول!' : '🎉 Accepted!',
                isAr
                  ? 'تم قبول العرض وبدأ العمل. يمكنك متابعة التقدم في قسم الأعمال.'
                  : 'Quote accepted and job started. Track progress in My Jobs.',
                [{
                  text: isAr ? 'عرض الأعمال' : 'View Jobs',
                  onPress: () => navigation.navigate('MyJobs' as never),
                }],
              );
            }
          },
        },
      ],
    );
  };

  const handleRejectQuote = (quoteId: string) => {
    Alert.alert(
      isAr ? 'رفض العرض' : 'Reject Quote',
      isAr ? 'هل أنت متأكد من رفض هذا العرض؟' : 'Are you sure you want to reject this quote?',
      [
        {text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel'},
        {
          text: isAr ? 'رفض' : 'Reject',
          style: 'destructive',
          onPress: () => rejectQuoteAction(rfq.id, quoteId),
        },
      ],
    );
  };

  const handleSubmitCounter = () => {
    const amount = Number(counterAmount);
    if (!counterAmount || isNaN(amount) || amount <= 0) {
      Alert.alert(
        isAr ? 'خطأ' : 'Error',
        isAr ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount',
      );
      return;
    }
    const msg = counterMessage.trim() ||
      (isAr
        ? 'عرضنا المقابل — نأمل التوصل إلى اتفاق مناسب للطرفين.'
        : 'Our counter offer — hoping to reach a mutually beneficial agreement.');
    addQuoteToRFQ(rfq.id, {
      rfqId: rfq.id,
      fromRole: 'contractor',
      fromId: 'C001',
      amount,
      currency: 'OMR',
      duration: rfq.duration,
      durationAr: rfq.durationAr,
      message: isAr ? msg : msg,
      messageAr: msg,
      status: 'countered_by_contractor',
    });
    setShowCounterModal(false);
    setCounterAmount('');
    setCounterMessage('');
  };

  void selectedQuoteId;

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>

      {/* HEADER */}
      <View
        style={[
          {
            backgroundColor: colors.card,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top + 12,
            paddingBottom: 12,
          },
          shadows.sm,
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{marginRight: 12, padding: 4}}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        >
          <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary}}>
            {t('rfq.title')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginRight: 8,
          }}
        >
          <Text style={{fontSize: 11, fontWeight: '600', color: colors.primary}}>#{rfq.id.slice(-6).toUpperCase()}</Text>
        </View>
        <TouchableOpacity hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="share-variant" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>

        {/* STATUS STEPPER */}
        <View
          style={[
            {backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 16, paddingVertical: 20},
            shadows.sm,
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 16, alignItems: 'flex-start'}}
          >
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const circleSize = 36;
              const circleBg = isPast ? colors.success : isCurrent ? colors.primary : '#F1F5F9';
              const iconColor = isPast || isCurrent ? '#FFFFFF' : '#94A3B8';
              const textColor = isPast ? colors.success : isCurrent ? colors.primary : '#94A3B8';
              const lineColor = isPast ? colors.success : '#E2E8F0';

              return (
                <View key={step.key} style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                  <View style={{alignItems: 'center', width: 72}}>
                    <View
                      style={{
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: circleBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: isCurrent ? colors.primary : 'transparent',
                        shadowOffset: {width: 0, height: 3},
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: isCurrent ? 4 : 0,
                      }}
                    >
                      {isPast ? (
                        <Icon name="check" size={18} color="#FFFFFF" />
                      ) : (
                        <Icon name={step.icon} size={16} color={iconColor} />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: isCurrent ? '700' : '400',
                        color: textColor,
                        textAlign: 'center',
                        marginTop: 6,
                        maxWidth: 64,
                      }}
                    >
                      {isAr ? step.labelAr : step.labelEn}
                    </Text>
                  </View>

                  {/* Connecting line */}
                  {idx < STEPS.length - 1 && (
                    <View
                      style={{
                        height: 2,
                        width: 20,
                        borderRadius: 1,
                        backgroundColor: lineColor,
                        marginTop: 17,
                        marginHorizontal: -4,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* RFQ SUMMARY CARD */}
        <View style={[{backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginTop: 12, padding: 16}, shadows.sm]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CategoryIcon category={rfq.category} size={24} withBackground />
            <View style={{flex: 1, marginStart: 12}}>
              <Text style={{fontSize: 15, fontWeight: '700', color: colors.textPrimary}} numberOfLines={2}>
                {getLocalizedField(rfq, 'title')}
              </Text>
              <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 2}}>
                {isAr ? t('demo:categories.' + rfq.category) : rfq.category}
              </Text>
            </View>
          </View>
          <View style={{marginTop: 12, gap: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon name="calendar" size={14} color={colors.textSecondary} />
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{rfq.startDate}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon name="map-marker" size={14} color={colors.textSecondary} />
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{getLocalizedField(rfq, 'city')}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon name="currency-usd" size={14} color={colors.textSecondary} />
              <Text style={{fontSize: 13, color: colors.textSecondary}}>
                {formatCurrency(rfq.budget.min)} – {formatCurrency(rfq.budget.max)}
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 8}}>
              <View style={{marginTop: 2}}><Icon name="text-box-outline" size={14} color={colors.textSecondary} /></View>
              <Text style={{fontSize: 13, color: colors.textSecondary, flex: 1}} numberOfLines={3}>
                {getLocalizedField(rfq, 'description')}
              </Text>
            </View>
          </View>
        </View>

        {/* BROADCAST BANNER */}
        <View style={{
          marginHorizontal: 16, marginTop: 12,
          backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Icon name="broadcast" size={18} color="#4F46E5" />
          <Text style={{color: '#4F46E5', fontSize: 13, fontWeight: '600', flex: 1}}>
            {isAr
              ? `تم البث إلى ${rfq.broadcastedTo?.length ?? 0} مورد`
              : `Broadcasted to ${rfq.broadcastedTo?.length ?? 0} suppliers`}
          </Text>
        </View>

        {/* QUOTE THREAD */}
        <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginHorizontal: 16, marginTop: 20, marginBottom: 12}}>
          {isAr ? 'خيط العروض' : 'Quote Thread'}
          {(rfq.quotes?.length ?? 0) > 0 && ` (${rfq.quotes.length})`}
        </Text>

        {(rfq.quotes?.length ?? 0) === 0 ? (
          <View style={{alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24}}>
            <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16}}>
              <Icon name="chat-outline" size={40} color={colors.primary} />
            </View>
            <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center'}}>
              {isAr ? 'في انتظار الردود' : 'Awaiting Responses'}
            </Text>
            <Text style={{fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20}}>
              {isAr ? 'لم يتم استلام عروض بعد' : 'No quotes received yet'}
            </Text>
          </View>
        ) : (
          rfq.quotes.map((quote: QuoteMessage, index: number) => {
            const isFromSupplier = quote.fromRole === 'supplier';
            const isFromContractor = quote.fromRole === 'contractor';
            const isLatest = index === rfq.quotes.length - 1;
            return (
              <View
                key={quote.id}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  alignItems: isFromContractor ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Role label + timestamp */}
                <Text style={{fontSize: 11, color: '#9CA3AF', marginBottom: 4, marginHorizontal: 4}}>
                  {isFromSupplier
                    ? (isAr ? 'المورد' : 'Supplier')
                    : (isAr ? 'أنت' : 'You')}
                  {' • '}{formatRelativeTime(quote.timestamp)}
                </Text>

                {/* Quote bubble */}
                <View style={{
                  maxWidth: '85%',
                  backgroundColor: isFromContractor ? '#192433' : colors.card,
                  borderRadius: 16,
                  borderBottomEndRadius: isFromContractor ? 4 : 16,
                  borderBottomStartRadius: isFromSupplier ? 4 : 16,
                  padding: 14,
                  borderWidth: isFromSupplier ? 1 : 0,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <Text style={{fontSize: 22, fontWeight: '800', color: isFromContractor ? '#BB8D5A' : colors.primary, marginBottom: 2}}>
                    {formatCurrency(quote.amount)}
                  </Text>
                  <Text style={{fontSize: 12, color: isFromContractor ? 'rgba(255,255,255,0.65)' : '#9CA3AF', marginBottom: 8}}>
                    {getLocalizedField(quote, 'duration')}
                  </Text>
                  <Text style={{fontSize: 14, color: isFromContractor ? '#FFFFFF' : '#374151', lineHeight: 20}}>
                    {getLocalizedField(quote, 'message')}
                  </Text>
                </View>

                {/* Action buttons — only on latest supplier quote, RFQ not yet accepted */}
                {isLatest && isFromSupplier && rfq.status !== 'accepted' && (
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 8, marginHorizontal: 4}}>
                    <Pressable
                      onPress={() => handleAcceptQuote(quote.id)}
                      style={{backgroundColor: '#10B981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6}}
                    >
                      <Icon name="check" size={16} color="#FFFFFF" />
                      <Text style={{color: '#FFFFFF', fontWeight: '700', fontSize: 13}}>
                        {isAr ? 'قبول' : 'Accept'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setSelectedQuoteId(quote.id);
                        setCounterAmount(String(Math.round(quote.amount * 0.9)));
                        setShowCounterModal(true);
                      }}
                      style={{backgroundColor: '#F59E0B', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6}}
                    >
                      <Icon name="swap-horizontal" size={16} color="#FFFFFF" />
                      <Text style={{color: '#FFFFFF', fontWeight: '700', fontSize: 13}}>
                        {isAr ? 'عرض مقابل' : 'Counter'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectQuote(quote.id)}
                      style={{backgroundColor: colors.errorLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20}}
                    >
                      <Icon name="close" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                )}

                {/* Accepted banner */}
                {rfq.status === 'accepted' && isLatest && isFromSupplier && (
                  <View style={{backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Icon name="check-circle" size={18} color="#10B981" />
                    <Text style={{color: '#065F46', fontWeight: '600', fontSize: 13}}>
                      {isAr
                        ? `✓ تم قبول هذا العرض — ${formatCurrency(rfq.finalAmount ?? 0)}`
                        : `✓ Quote accepted — ${formatCurrency(rfq.finalAmount ?? 0)}`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_new'}
        stepNumber={11} totalSteps={18}
        title="Step 10: Waiting Stage"
        description="RFQ status: NEW. The system is now waiting for suppliers to respond with their quotes. Notice the status stepper at the top showing progress."
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_quotes_received'}
        stepNumber={12} totalSteps={18}
        title="Step 11: Quotes Received"
        description="Two suppliers responded with competitive quotes. Contractor can compare quote amount, allocated resources, and supplier ratings."
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_accept_quote'}
        stepNumber={13} totalSteps={18}
        title="Step 12: Accept Best Quote"
        description="Contractor accepts the best offer. Other suppliers are notified that they were not selected. EJJAR maintains transparency throughout."
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_confirmed'}
        stepNumber={14} totalSteps={18}
        title="Step 13: Job Confirmed"
        description="Once both parties confirm, contact details are unmasked. The contractor now sees the supplier's real name and phone number. Job creation begins."
        onNext={() => {
          demoNext();
          navigation.navigate('JobTracking', {jobId: 'job-001'});
        }}
      />

      {/* COUNTER OFFER MODAL */}
      <Modal
        visible={showCounterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCounterModal(false)}
      >
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: insets.bottom + 24,
          }}>
            <Text style={{fontSize: 18, fontWeight: '700', color: '#192433', marginBottom: 20}}>
              {isAr ? 'تقديم عرض مقابل' : 'Submit Counter Offer'}
            </Text>

            <Text style={{fontSize: 13, color: '#6B7280', marginBottom: 8}}>
              {isAr ? 'المبلغ المقترح (ر.ع.)' : 'Your Offer Amount (OMR)'}
            </Text>
            <TextInput
              value={counterAmount}
              onChangeText={setCounterAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1.5,
                borderColor: colors.primary,
                borderRadius: 12,
                padding: 14,
                fontSize: 26,
                fontWeight: '700',
                color: '#192433',
                marginBottom: 16,
                textAlign: 'center',
              }}
            />

            <Text style={{fontSize: 13, color: '#6B7280', marginBottom: 8}}>
              {isAr ? 'رسالة (اختياري)' : 'Message (optional)'}
            </Text>
            <TextInput
              value={counterMessage}
              onChangeText={setCounterMessage}
              multiline
              numberOfLines={3}
              placeholder={isAr ? 'اكتب رسالتك للمورد...' : 'Write a message to the supplier...'}
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: '#374151',
                marginBottom: 20,
                textAlignVertical: 'top',
                minHeight: 80,
              }}
            />

            <View style={{flexDirection: 'row', gap: 12}}>
              <Pressable
                onPress={() => setShowCounterModal(false)}
                style={{flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}
              >
                <Text style={{color: '#6B7280', fontWeight: '600'}}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitCounter}
                style={{flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#192433', alignItems: 'center'}}
              >
                <Text style={{color: '#FFFFFF', fontWeight: '700'}}>
                  {isAr ? 'إرسال العرض المقابل' : 'Send Counter Offer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <DemoFloatingBar />
    </View>
  );
}
