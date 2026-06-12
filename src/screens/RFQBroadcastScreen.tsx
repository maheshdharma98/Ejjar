import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  I18nManager,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {colors} from '../theme/designSystem';
import Icon from '../components/common/Icon';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RFQBroadcast'>;
type Phase = 'broadcasting' | 'success' | 'error';
type StepState = 'done' | 'active' | 'pending' | 'error';

// EJJAR Design System v1.0 — screen-local tokens
const T = {
  bg:          '#101828',
  surface:     '#101828',
  btnBorder:   '#1A2740',
  mutedText:   '#64748B',
  orangeColor: '#E67E3A',
  infoColor:   '#0369A1',
  greenColor:  '#22C55E',
  greenBg:     '#22C55E22',
  orangeBg:    '#E67E3A22',
  infoBg:      '#0369A122',
  errorColor:  '#EF4444',
  errorBg:     '#EF444422',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStepState(stepIndex: number, stepsDone: number, phase: Phase): StepState {
  if (phase === 'error' && stepsDone === stepIndex) return 'error';
  if (stepsDone > stepIndex) return 'done';
  if (stepsDone === stepIndex) return 'active';
  return 'pending';
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function SpinIcon({size, color, spin}: {size: number; color: string; spin: Animated.Value}) {
  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  return (
    <Animated.View style={{transform: [{rotate}]}}>
      <Icon name="loading" size={size} color={color} />
    </Animated.View>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────

interface StepCardProps {
  iconBg: string;
  iconName: string;
  iconColor: string;
  label: string;
  sub: string;
  state: StepState;
  spin: Animated.Value;
  row: 'row' | 'row-reverse';
}

function StepCard({iconBg, iconName, iconColor, label, sub, state, spin, row}: StepCardProps) {
  const statusConfig: Record<StepState, {bg: string; icon: string; color: string}> = {
    done:    {bg: T.greenBg, icon: 'check',        color: T.greenColor},
    active:  {bg: T.orangeBg,  icon: 'loading',      color: T.orangeColor},
    pending: {bg: T.surface, icon: 'clock-outline', color: T.mutedText},
    error:   {bg: T.errorBg, icon: 'close',         color: T.errorColor},
  };
  const sc = statusConfig[state];

  return (
    <View style={{
      backgroundColor: state === 'error' ? '#E67E3A11' : T.surface,
      borderRadius: 12, padding: 12, paddingHorizontal: 14,
      flexDirection: row, alignItems: 'center', gap: 12,
    }}>
      {/* Category icon */}
      <View style={{
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={iconName as any} size={15} color={iconColor} />
      </View>

      {/* Labels */}
      <View style={{flex: 1}}>
        <Text style={{fontSize: 12, fontWeight: '500', color: '#ffffff'}}>{label}</Text>
        <Text style={{fontSize: 11, color: T.mutedText, marginTop: 1}}>{sub}</Text>
      </View>

      {/* Status circle */}
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: sc.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {state === 'active' ? (
          <SpinIcon size={12} color={sc.color} spin={spin} />
        ) : (
          <Icon name={sc.icon as any} size={12} color={sc.color} />
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RFQBroadcastScreen() {
  const {i18n} = useTranslation();
  const insets   = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route    = useRoute<Route>();

  const {rfqId, supplierCount, city} = route.params;
  const isAr = i18n.language === 'ar';
  const row: 'row' | 'row-reverse' = isAr ? 'row-reverse' : 'row';

  const [stepsDone, setStepsDone] = useState(0);
  const [phase, setPhase]         = useState<Phase>('broadcasting');

  // ── Animation refs ────────────────────────────────────────────────────────

  // Pulse rings — phase-offset for staggered start (0.2 = 400ms / 2000ms period)
  const ring1 = useRef(new Animated.Value(0.0)).current;
  const ring2 = useRef(new Animated.Value(0.2)).current;
  const ring3 = useRef(new Animated.Value(0.4)).current;
  // Spinner for active step status indicators
  const spin  = useRef(new Animated.Value(0)).current;
  // Core circle background: 0 = gold, 1 = green, -1 = error-red
  const coreBgAnim = useRef(new Animated.Value(0)).current;

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Pulse rings — each loops 0→1 linearly over 2s, interpolated into scale+opacity wave
    const loopRing = (anim: Animated.Value) =>
      Animated.loop(
        Animated.timing(anim, {toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true}),
      );
    loopRing(ring1).start();
    loopRing(ring2).start();
    loopRing(ring3).start();

    // Spinner — 1 full rotation per second
    Animated.loop(
      Animated.timing(spin, {toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true}),
    ).start();

    // Step progression timers
    const t1 = setTimeout(() => setStepsDone(1), 500);
    const t2 = setTimeout(() => setStepsDone(2), 1500);
    const t3 = setTimeout(() => {
      setStepsDone(3);
      setPhase('success');
      Animated.timing(coreBgAnim, {
        toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: false,
      }).start();
    }, 3500);

    timers.current = [t1, t2, t3];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // ── Ring interpolations ───────────────────────────────────────────────────

  const ringStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.95, 1.05, 0.95]}),
    }],
    opacity: anim.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.8, 0.4, 0.8]}),
  });

  const coreBg = coreBgAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['#EF4444', '#E67E3A', '#22C55E'],
  });

  // ── Derived display state ────────────────────────────────────────────────

  const isSuccess = phase === 'success';
  const isError   = phase === 'error';
  const isActive  = phase === 'broadcasting';

  const coreIcon = isSuccess ? 'check-circle-outline'
    : isError ? 'alert-outline'
    : 'access-point';

  const titleText = isSuccess
    ? (isAr ? 'تم الإرسال!' : 'Broadcast Sent!')
    : isError
    ? (isAr ? 'فشل الإرسال' : 'Broadcast Failed')
    : (isAr ? 'جارٍ البث...' : 'Broadcasting RFQ...');

  const subtitleText = isSuccess
    ? (isAr
      ? `تم إرسال طلبك إلى ${supplierCount} مورد في ${city}`
      : `Your RFQ was sent to ${supplierCount} suppliers in ${city}`)
    : isError
    ? (isAr ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.')
    : (isAr
      ? `جارٍ إرسال طلبك إلى موردين في ${city}، عُمان`
      : `Sending your request to suppliers in ${city}, Oman`);

  // Step 3 sub-label changes with progress
  const step3Sub = stepsDone >= 3
    ? (isAr ? `تم إخطار جميع الـ ${supplierCount} مورد` : `All ${supplierCount} suppliers notified`)
    : stepsDone >= 2
    ? (isAr ? 'جارٍ إخطار الموردين...' : 'Notifying suppliers now...')
    : (isAr ? 'في الانتظار...' : 'Waiting...');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const clearTimers = () => timers.current.forEach(clearTimeout);

  const handleCancel = () => {
    clearTimers();
    navigation.goBack();
  };

  const handleCancelConfirm = () => {
    if (!isActive) return;
    Alert.alert(
      isAr ? 'إلغاء البث؟' : 'Cancel broadcast?',
      isAr
        ? 'الموردون الذين تم إخطارهم سيستقبلون طلبك.'
        : 'Suppliers already notified will still receive your RFQ.',
      [
        {text: isAr ? 'استمرار البث' : 'Keep broadcasting', style: 'cancel'},
        {text: isAr ? 'نعم، إلغاء' : 'Yes, cancel', style: 'destructive', onPress: handleCancel},
      ],
    );
  };

  const handleGoHome = () => {
    clearTimers();
    navigation.navigate('HomeTabs');
  };

  const handleViewQuotes = () => {
    navigation.navigate('RFQDetail', {rfqId});
  };

  const handleRetry = () => {
    setStepsDone(0);
    setPhase('broadcasting');
    coreBgAnim.setValue(0);
    // re-run timers
    const t1 = setTimeout(() => setStepsDone(1), 500);
    const t2 = setTimeout(() => setStepsDone(2), 1500);
    const t3 = setTimeout(() => {
      setStepsDone(3);
      setPhase('success');
      Animated.timing(coreBgAnim, {
        toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: false,
      }).start();
    }, 3500);
    timers.current = [t1, t2, t3];
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <View style={{flex: 1, backgroundColor: T.bg}}>

      {/* ════════ TOP BAR ════════ */}
      <View style={{
        paddingTop: insets.top + 20, paddingHorizontal: 18,
        flexDirection: row, justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Back / Submit RFQ label */}
        <TouchableOpacity
          onPress={handleCancelConfirm}
          style={{flexDirection: row, alignItems: 'center', gap: 6}}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}
        >
          <Icon name={isAr ? 'arrow-right' : 'arrow-left'} size={18} color="#E67E3A" />
          <Text style={{fontSize: 13, color: T.mutedText}}>
            {isAr ? 'إرسال طلب' : 'Submit RFQ'}
          </Text>
        </TouchableOpacity>

        {/* Close → home */}
        <TouchableOpacity
          onPress={handleGoHome}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: T.surface,
            alignItems: 'center', justifyContent: 'center',
          }}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          activeOpacity={0.8}
        >
          <Icon name="close" size={16} color={T.mutedText} />
        </TouchableOpacity>
      </View>

      {/* ════════ CENTER CONTENT ════════ */}
      <View style={{
        flex: 1,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 20, paddingBottom: insets.bottom + 16,
      }}>

        {/* ── Pulse rings / success icon ── */}
        <View style={{width: 160, height: 160, position: 'relative', marginBottom: 28}}>
          {isActive ? (
            <>
              {/* Ring 1 — outermost: 160×160 */}
              <Animated.View style={[{
                position: 'absolute', width: 160, height: 160,
                top: 0, left: 0, borderRadius: 80,
                borderWidth: 1.5, borderColor: '#E67E3A18',
              }, ringStyle(ring1)]} />

              {/* Ring 2 — middle: 120×120 */}
              <Animated.View style={[{
                position: 'absolute', width: 120, height: 120,
                top: 20, left: 20, borderRadius: 60,
                borderWidth: 1.5, borderColor: '#E67E3A30',
              }, ringStyle(ring2)]} />

              {/* Ring 3 — inner: 84×84 */}
              <Animated.View style={[{
                position: 'absolute', width: 84, height: 84,
                top: 38, left: 38, borderRadius: 42,
                borderWidth: 1.5, borderColor: '#E67E3A55',
              }, ringStyle(ring3)]} />
            </>
          ) : (
            /* Success / error — static ambient ring */
            <View style={{
              position: 'absolute', width: 120, height: 120,
              top: 20, left: 20, borderRadius: 60,
              borderWidth: 1.5,
              borderColor: isSuccess ? '#16663433' : '#E67E3A33',
            }} />
          )}

          {/* Core circle — bg animates gold → green on success */}
          <Animated.View style={{
            position: 'absolute', width: 52, height: 52,
            top: 54, left: 54, borderRadius: 26,
            backgroundColor: coreBg,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
          }}>
            <Icon name={coreIcon as any} size={24} color="#ffffff" />
          </Animated.View>
        </View>

        {/* ── Title ── */}
        <Text style={{
          fontSize: 20, fontWeight: '600', color: '#ffffff',
          textAlign: 'center', marginBottom: 8,
        }}>
          {titleText}
        </Text>

        {/* ── Subtitle ── */}
        <Text style={{
          fontSize: 13, color: T.mutedText, textAlign: 'center',
          lineHeight: 20, maxWidth: 240,
        }}>
          {subtitleText}
        </Text>

        {/* ── Step tracker ── */}
        <View style={{width: '100%', marginTop: 28, gap: 10}}>
          {/* Step 1 — RFQ Validated */}
          <StepCard
            iconBg={T.greenBg}
            iconName="check-circle-outline"
            iconColor={T.greenColor}
            label={isAr ? 'تم التحقق من الطلب' : 'RFQ validated'}
            sub={isAr ? 'تم تأكيد جميع التفاصيل' : 'All details confirmed'}
            state={getStepState(0, stepsDone, phase)}
            spin={spin}
            row={row}
          />

          {/* Step 2 — Matching Suppliers */}
          <StepCard
            iconBg={T.orangeBg}
            iconName="account-group-outline"
            iconColor={T.orangeColor}
            label={isAr ? 'مطابقة الموردين' : 'Matching suppliers'}
            sub={isAr
              ? `تم العثور على ${supplierCount} موردين موثقين`
              : `Found ${supplierCount} verified suppliers`}
            state={getStepState(1, stepsDone, phase)}
            spin={spin}
            row={row}
          />

          {/* Step 3 — Sending Broadcast */}
          <StepCard
            iconBg={T.infoBg}
            iconName="send-outline"
            iconColor={T.infoColor}
            label={isAr ? 'إرسال البث' : 'Sending broadcast'}
            sub={step3Sub}
            state={getStepState(2, stepsDone, phase)}
            spin={spin}
            row={row}
          />
        </View>

        {/* ── Bottom action area ── */}
        <View style={{width: '100%', marginTop: 20}}>

          {/* SUCCESS — View Quotes button */}
          {isSuccess && (
            <TouchableOpacity
              style={{
                backgroundColor: '#E67E3A', borderRadius: 12,
                paddingVertical: 12, paddingHorizontal: 28,
                flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              activeOpacity={0.85}
              onPress={handleViewQuotes}
            >
              <Icon name="message-outline" size={16} color="#ffffff" />
              <Text style={{fontSize: 14, fontWeight: '600', color: '#ffffff'}}>
                {isAr ? 'عرض العروض' : 'View Quotes'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ERROR — Go Back + Retry */}
          {isError && (
            <View style={{flexDirection: row, gap: 8}}>
              <TouchableOpacity
                style={{
                  flex: 1, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: T.btnBorder,
                  borderRadius: 10, paddingVertical: 10,
                }}
                activeOpacity={0.8}
                onPress={handleGoHome}
              >
                <Text style={{fontSize: 13, fontWeight: '500', color: T.mutedText}}>
                  {isAr ? 'العودة' : 'Go Back'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#E67E3A', borderRadius: 10, paddingVertical: 10,
                }}
                activeOpacity={0.85}
                onPress={handleRetry}
              >
                <Text style={{fontSize: 13, fontWeight: '600', color: '#ffffff'}}>
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* BROADCASTING — Cancel button */}
          {isActive && (
            <TouchableOpacity
              style={{
                alignSelf: 'center',
                flexDirection: row, alignItems: 'center', gap: 6,
                borderWidth: 1.5, borderColor: T.btnBorder,
                borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28,
              }}
              activeOpacity={0.8}
              onPress={handleCancelConfirm}
            >
              <Icon name="close" size={14} color={T.mutedText} />
              <Text style={{fontSize: 13, fontWeight: '500', color: T.mutedText}}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
