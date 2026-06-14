import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {rfqId} = route.params;
  const getRFQById = useDemoData(s => s.getRFQById);
  const addQuoteToRFQ = useDemoData(s => s.addQuoteToRFQ);
  const acceptQuoteAction = useDemoData(s => s.acceptQuote);
  const rejectQuoteAction = useDemoData(s => s.rejectQuote);
  const updateRFQStatus = useDemoData(s => s.updateRFQStatus);
  const getSupplierById = useDemoData(s => s.getSupplierById);
  const rfq = getRFQById(rfqId) as RFQ | undefined;

  const {isActive, currentStep: demoStep, nextStep: demoNext} = useDemoStore();

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  // Simulation state
  type SimPhase = 'idle' | 'running' | 'done';
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [simStep, setSimStep] = useState(0);
  const simTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearSimTimers = () => { simTimers.current.forEach(clearTimeout); simTimers.current = []; };

  const SIM_STEPS = [
    {labelEn: 'Suppliers reviewing your RFQ…',   labelAr: 'الموردون يراجعون طلبك…'},
    {labelEn: 'First quote received!',             labelAr: 'تم استلام أول عرض!'},
    {labelEn: 'Second quote received!',            labelAr: 'تم استلام عرض ثانٍ!'},
    {labelEn: 'You countered the best quote',      labelAr: 'أرسلت عرضًا مقابلًا'},
    {labelEn: 'Supplier responded to your counter',labelAr: 'المورد رد على عرضك المقابل'},
    {labelEn: 'Quote accepted — job created! 🎉',  labelAr: 'تم قبول العرض وبدأ العمل! 🎉'},
  ];

  const runSimulation = useCallback(() => {
    if (!rfq) return;
    clearSimTimers();
    setSimPhase('running');
    setSimStep(0);

    const supplierId1 = rfq.broadcastedTo?.[0] ?? 'S001';
    const supplierId2 = rfq.broadcastedTo?.[1] ?? 'S002';
    const sup1 = getSupplierById(supplierId1);
    const sup2 = getSupplierById(supplierId2);
    const baseAmount = Math.round((rfq.budget.max || 800) * 0.9);

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      simTimers.current.push(id);
    };

    // Step 1 — first supplier quote (t+1.5s)
    schedule(() => {
      setSimStep(1);
      addQuoteToRFQ(rfq.id, {
        rfqId: rfq.id,
        fromRole: 'supplier',
        fromId: supplierId1,
        amount: baseAmount + 60,
        currency: 'OMR',
        duration: rfq.duration || '3 days',
        durationAr: rfq.durationAr || '3 أيام',
        message: `We can handle this professionally. ${sup1?.name ?? 'Our team'} is available from your start date. Price includes all labor.`,
        messageAr: `يمكننا التعامل مع ذلك باحترافية. فريقنا متاح من تاريخ البدء. السعر يشمل جميع العمالة.`,
        status: 'pending',
      });
    }, 1500);

    // Step 2 — second supplier quote (t+3s)
    schedule(() => {
      setSimStep(2);
      addQuoteToRFQ(rfq.id, {
        rfqId: rfq.id,
        fromRole: 'supplier',
        fromId: supplierId2,
        amount: baseAmount + 30,
        currency: 'OMR',
        duration: rfq.duration || '3 days',
        durationAr: rfq.durationAr || '3 أيام',
        message: `Competitive offer — ${sup2?.name ?? 'certified team'} with 10+ years experience. Includes tools & consumables.`,
        messageAr: `عرض تنافسي — فريق معتمد بخبرة 10+ سنوات. يشمل الأدوات والمواد الاستهلاكية.`,
        status: 'pending',
      });
    }, 3000);

    // Step 3 — contractor counter offer (t+5s)
    schedule(() => {
      setSimStep(3);
      addQuoteToRFQ(rfq.id, {
        rfqId: rfq.id,
        fromRole: 'contractor',
        fromId: rfq.contractorId,
        amount: baseAmount,
        currency: 'OMR',
        duration: rfq.duration || '3 days',
        durationAr: rfq.durationAr || '3 أيام',
        message: `Thanks for the quick quotes! Can you match OMR ${baseAmount}? We have ongoing projects and can offer repeat business.`,
        messageAr: `شكرًا للعروض السريعة! هل يمكنك مطابقة ${baseAmount} ريال عماني؟ لدينا مشاريع مستمرة ويمكننا تقديم أعمال متكررة.`,
        status: 'countered_by_contractor',
      });
    }, 5000);

    // Step 4 — supplier accepts counter (t+7s)
    schedule(() => {
      setSimStep(4);
      addQuoteToRFQ(rfq.id, {
        rfqId: rfq.id,
        fromRole: 'supplier',
        fromId: supplierId2,
        amount: baseAmount,
        currency: 'OMR',
        duration: rfq.duration || '3 days',
        durationAr: rfq.durationAr || '3 أيام',
        message: `Deal! OMR ${baseAmount} works for us. We'll confirm team allocation and send start-day details.`,
        messageAr: `اتفقنا! ${baseAmount} ريال عماني يناسبنا. سنؤكد توزيع الفريق ونرسل تفاصيل يوم البدء.`,
        status: 'pending',
      });
    }, 7000);

    // Step 5 — auto accept the final quote and create job (t+9s)
    schedule(() => {
      setSimStep(5);
      const currentRFQ = getRFQById(rfq.id);
      if (!currentRFQ) return;
      const lastSupplierQuote = [...currentRFQ.quotes].reverse().find(q => q.fromRole === 'supplier');
      if (lastSupplierQuote) {
        acceptQuoteAction(rfq.id, lastSupplierQuote.id);
      } else {
        updateRFQStatus(rfq.id, 'accepted');
      }
      setSimPhase('done');
    }, 9000);
  }, [rfq, addQuoteToRFQ, acceptQuoteAction, updateRFQStatus, getSupplierById, getRFQById]);

  useEffect(() => () => clearSimTimers(), []);

  const isAr = i18n.language === 'ar';

  if (!rfq) {
    return (
      <View style={{flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center'}}>
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
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>

      {/* HEADER */}
      <View
        style={[
          {
            backgroundColor: '#101828',
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
            <Icon name="arrow-left" size={24} color="#E67E3A" />
          </View>
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 17, fontWeight: '600', color: '#FFFFFF'}}>
            {t('rfq.title')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginRight: 8,
          }}
        >
          <Text style={{fontSize: 11, fontWeight: '600', color: '#FFFFFF'}}>#{rfq.id.slice(-6).toUpperCase()}</Text>
        </View>
        <TouchableOpacity hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="share-variant" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>

        {/* STATUS STEPPER */}
        <View
          style={[
            {backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, paddingVertical: 20, borderWidth: 1, borderColor: '#E2E8F0'},
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
                        fontWeight: isCurrent ? '600' : '400',
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
        <View style={[{backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginTop: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0'}, shadows.sm]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CategoryIcon category={rfq.category} size={24} withBackground />
            <View style={{flex: 1, marginStart: 12}}>
              <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary}} numberOfLines={2}>
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
          backgroundColor: '#E0F2FE', borderRadius: 12, padding: 12,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Icon name="broadcast" size={18} color="#0369A1" />
          <Text style={{color: '#0369A1', fontSize: 13, fontWeight: '600', flex: 1}}>
            {isAr
              ? `تم البث إلى ${rfq.broadcastedTo?.length ?? 0} مورد`
              : `Broadcasted to ${rfq.broadcastedTo?.length ?? 0} suppliers`}
          </Text>
        </View>

        {/* SIMULATION — idle CTA or live progress tracker */}
        {simPhase === 'idle' && (rfq.quotes?.length ?? 0) === 0 && (
          <View style={{marginHorizontal: 16, marginBottom: 4}}>
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
              borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
              ...shadows.sm,
            }}>
              <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 14}}>
                <Icon name="account-group-outline" size={34} color="#0369A1" />
              </View>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 6}}>
                {isAr ? 'الموردون يراجعون طلبك' : 'Suppliers Reviewing Your RFQ'}
              </Text>
              <Text style={{fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20}}>
                {isAr
                  ? `تم إرسال طلبك إلى ${rfq.broadcastedTo?.length ?? 0} موردين. اضغط لمشاهدة الدورة الكاملة.`
                  : `Your RFQ was sent to ${rfq.broadcastedTo?.length ?? 0} suppliers. Tap below to simulate the full quote lifecycle.`}
              </Text>
              <Pressable
                onPress={runSimulation}
                style={{
                  backgroundColor: '#101828', borderRadius: 14,
                  paddingHorizontal: 28, paddingVertical: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}
              >
                <Icon name="play-circle-outline" size={20} color="#E67E3A" />
                <Text style={{color: '#FFFFFF', fontWeight: '700', fontSize: 15}}>
                  {isAr ? 'تشغيل الدورة الكاملة' : 'Run Full Quote Flow'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {(simPhase === 'running' || simPhase === 'done') && (
          <View style={{marginHorizontal: 16, marginBottom: 16}}>
            <View style={{
              backgroundColor: '#101828', borderRadius: 16, padding: 20,
              borderWidth: 1, borderColor: '#1A2740', ...shadows.sm,
            }}>
              <Text style={{color: '#E67E3A', fontSize: 12, fontWeight: '700', marginBottom: 14, letterSpacing: 0.8}}>
                {isAr ? '● محاكاة مباشرة' : '● LIVE SIMULATION'}
              </Text>
              {SIM_STEPS.map((step, idx) => {
                const done   = idx < simStep;
                const active = idx === simStep && simPhase === 'running';
                return (
                  <View key={idx} style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10}}>
                    <View style={{
                      width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: done ? '#22C55E' : active ? '#E67E3A' : '#1A2740',
                      borderWidth: active ? 0 : 1, borderColor: '#2D3748',
                    }}>
                      {done
                        ? <Icon name="check" size={13} color="#FFFFFF" />
                        : active
                        ? <Icon name="dots-horizontal" size={13} color="#FFFFFF" />
                        : <Text style={{fontSize: 9, color: '#475569', fontWeight: '600'}}>{idx + 1}</Text>}
                    </View>
                    <Text style={{
                      fontSize: 13, flex: 1,
                      color: done ? '#22C55E' : active ? '#FFFFFF' : '#475569',
                      fontWeight: active ? '600' : '400',
                    }}>
                      {isAr ? step.labelAr : step.labelEn}
                    </Text>
                  </View>
                );
              })}
              {simPhase === 'done' && (
                <Pressable
                  onPress={() => navigation.navigate('MyJobs' as never)}
                  style={{
                    marginTop: 10, backgroundColor: '#22C55E', borderRadius: 12,
                    paddingVertical: 13, alignItems: 'center', flexDirection: 'row',
                    justifyContent: 'center', gap: 8,
                  }}
                >
                  <Icon name="briefcase-check-outline" size={18} color="#FFFFFF" />
                  <Text style={{color: '#FFFFFF', fontWeight: '700', fontSize: 14}}>
                    {isAr ? 'عرض الأعمال' : 'View My Jobs'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* QUOTE THREAD */}
        <Text style={{fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginHorizontal: 16, marginTop: 4, marginBottom: 12}}>
          {isAr ? 'خيط العروض' : 'Quote Thread'}
          {(rfq.quotes?.length ?? 0) > 0 && ` (${rfq.quotes.length})`}
        </Text>

        {(rfq.quotes?.length ?? 0) === 0 && simPhase === 'idle' ? (
          <View style={{alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24}}>
            <Icon name="chat-outline" size={32} color="#CBD5E1" />
            <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 8}}>
              {isAr ? 'لم يتم استلام عروض بعد' : 'No quotes received yet'}
            </Text>
          </View>
        ) : (rfq.quotes?.length ?? 0) === 0 ? null : (
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
                <Text style={{fontSize: 11, color: '#64748B', marginBottom: 4, marginHorizontal: 4}}>
                  {isFromSupplier
                    ? (isAr ? 'المورد' : 'Supplier')
                    : (isAr ? 'أنت' : 'You')}
                  {' • '}{formatRelativeTime(quote.timestamp)}
                </Text>

                {/* Quote bubble */}
                <View style={{
                  maxWidth: '85%',
                  backgroundColor: isFromContractor ? '#101828' : '#FFFFFF',
                  borderRadius: 16,
                  borderBottomEndRadius: isFromContractor ? 4 : 16,
                  borderBottomStartRadius: isFromSupplier ? 4 : 16,
                  padding: 14,
                  borderWidth: isFromSupplier ? 1 : 0,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <Text style={{fontSize: 22, fontWeight: '700', color: isFromContractor ? '#E67E3A' : colors.primary, marginBottom: 2}}>
                    {formatCurrency(quote.amount)}
                  </Text>
                  <Text style={{fontSize: 12, color: isFromContractor ? 'rgba(255,255,255,0.65)' : '#64748B', marginBottom: 8}}>
                    {getLocalizedField(quote, 'duration')}
                  </Text>
                  <Text style={{fontSize: 14, color: isFromContractor ? '#FFFFFF' : '#1A1A2E', lineHeight: 20}}>
                    {getLocalizedField(quote, 'message')}
                  </Text>
                </View>

                {/* Action buttons — only on latest supplier quote, RFQ not yet accepted */}
                {isLatest && isFromSupplier && rfq.status !== 'accepted' && (
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 8, marginHorizontal: 4}}>
                    <Pressable
                      onPress={() => handleAcceptQuote(quote.id)}
                      style={{backgroundColor: '#166534', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6}}
                    >
                      <Icon name="check" size={16} color="#FFFFFF" />
                      <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 13}}>
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
                      <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 13}}>
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
                  <View style={{backgroundColor: '#DCFCE7', borderRadius: 10, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Icon name="check-circle" size={18} color="#166534" />
                    <Text style={{color: '#166534', fontWeight: '600', fontSize: 13}}>
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
        title={tDemo('tour.rfq_new.title')}
        description={tDemo('tour.rfq_new.description')}
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_quotes_received'}
        stepNumber={12} totalSteps={18}
        title={tDemo('tour.rfq_quotes_received.title')}
        description={tDemo('tour.rfq_quotes_received.description')}
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_accept_quote'}
        stepNumber={13} totalSteps={18}
        title={tDemo('tour.rfq_accept_quote.title')}
        description={tDemo('tour.rfq_accept_quote.description')}
        onNext={demoNext}
      />
      <DemoTooltip
        visible={isActive && demoStep === 'rfq_confirmed'}
        stepNumber={14} totalSteps={18}
        title={tDemo('tour.rfq_confirmed.title')}
        description={tDemo('tour.rfq_confirmed.description')}
        onNext={() => {
          demoNext();
          navigation.navigate('JobTracking', {jobId: 'JOB_001'});
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
            backgroundColor: '#F8FAFC',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: insets.bottom + 24,
          }}>
            <Text style={{fontSize: 18, fontWeight: '600', color: '#101828', marginBottom: 20}}>
              {isAr ? 'تقديم عرض مقابل' : 'Submit Counter Offer'}
            </Text>

            <Text style={{fontSize: 13, color: '#64748B', marginBottom: 8}}>
              {isAr ? 'المبلغ المقترح (ر.ع.)' : 'Your Offer Amount (OMR)'}
            </Text>
            <TextInput
              value={counterAmount}
              onChangeText={setCounterAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#64748B"
              style={{
                borderWidth: 1.5,
                borderColor: colors.primary,
                borderRadius: 12,
                padding: 14,
                fontSize: 26,
                fontWeight: '600',
                color: '#101828',
                marginBottom: 16,
                textAlign: 'center',
              }}
            />

            <Text style={{fontSize: 13, color: '#64748B', marginBottom: 8}}>
              {isAr ? 'رسالة (اختياري)' : 'Message (optional)'}
            </Text>
            <TextInput
              value={counterMessage}
              onChangeText={setCounterMessage}
              multiline
              numberOfLines={3}
              placeholder={isAr ? 'اكتب رسالتك للمورد...' : 'Write a message to the supplier...'}
              placeholderTextColor="#64748B"
              style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: '#1A1A2E',
                marginBottom: 20,
                textAlignVertical: 'top',
                minHeight: 80,
              }}
            />

            <View style={{flexDirection: 'row', gap: 12}}>
              <Pressable
                onPress={() => setShowCounterModal(false)}
                style={{flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center'}}
              >
                <Text style={{color: '#64748B', fontWeight: '600'}}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitCounter}
                style={{flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#101828', alignItems: 'center'}}
              >
                <Text style={{color: '#FFFFFF', fontWeight: '600'}}>
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
