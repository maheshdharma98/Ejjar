import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../store/authStore';
import {maskPhone} from '../../utils/masking';
import Icon from './Icon';
import {colors, shadows} from '../../theme/designSystem';
import PremiumButton from './PremiumButton';
import {useDemoStore} from '../../store/demoStore';
import DemoTooltip from './DemoTooltip';
import EjjarLogo from './EjjarLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginBottomSheet({isOpen, onClose, onSuccess}: Props) {
  const {t} = useTranslation();
  const {login, isLoading} = useAuthStore();
  const {isActive, currentStep, nextStep} = useDemoStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.trim().length < 8) return;
    setStep(2);
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every(d => d !== '') && next.join('').length === 6) {
      handleVerify(next.join(''));
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalOtp = code ?? otp.join('');
    if (finalOtp.length !== 6) return;
    await login(phone, finalOtp);
    onSuccess();
    onClose();
    resetState();
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  };

  const resetState = () => {
    setStep(1);
    setPhone('');
    setOtp(['', '', '', '', '', '']);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <>
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={[{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingHorizontal: 24, paddingBottom: 40,
            }, shadows.md]}>
              {/* Handle bar */}
              <View style={{
                width: 40, height: 4, backgroundColor: '#D1D5DB',
                borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 24,
              }} />

              {step === 1 ? (
                <>
                  {/* Brand */}
                  <View style={{alignItems: 'center', marginBottom: 24}}>
                    <EjjarLogo variant="black" width={52} height={68} style={{marginBottom: 8}} />
                    <Text style={{fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 4}}>
                      {t('auth.welcome')}
                    </Text>
                    <Text style={{fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center'}}>
                      {t('auth.subtitle')}
                    </Text>
                  </View>

                  {/* Security notice */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, marginBottom: 20,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="shield-check" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary}}>
                        Secure Login
                      </Text>
                      <Text style={{fontSize: 11, color: colors.textSecondary, marginTop: 1}}>
                        OTP verified · No password needed
                      </Text>
                    </View>
                  </View>

                  {/* Phone input */}
                  <View style={{marginBottom: 20}}>
                    <Text style={{
                      fontSize: 13, fontWeight: '600', color: colors.textPrimary,
                      marginBottom: 8, paddingLeft: 4,
                    }}>
                      {t('auth.phoneLabel')}
                    </Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      borderWidth: 1.5, borderColor: phone.length >= 8 ? colors.primary : colors.border,
                      borderRadius: 14, backgroundColor: '#F8FAFC',
                      paddingHorizontal: 14, height: 52,
                    }}>
                      <Icon name="phone" size={18} color={colors.textSecondary} />
                      <TextInput
                        style={{
                          flex: 1, marginLeft: 10, fontSize: 15,
                          color: colors.textPrimary,
                        }}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t('auth.phonePlaceholder')}
                        placeholderTextColor={colors.muted}
                        keyboardType="phone-pad"
                        autoFocus
                      />
                      {phone.length >= 8 && (
                        <Icon name="check-circle" size={18} color={colors.success} />
                      )}
                    </View>
                  </View>

                  <PremiumButton
                    title={t('auth.sendOtp')}
                    iconName="send"
                    variant="primary"
                    onPress={handleSendOtp}
                  />
                </>
              ) : (
                <>
                  {/* OTP header */}
                  <View style={{alignItems: 'center', marginBottom: 24}}>
                    <View style={{
                      width: 56, height: 56, borderRadius: 28,
                      backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <Icon name="phone" size={26} color={colors.primary} />
                    </View>
                    <Text style={{fontSize: 20, fontWeight: '700', color: colors.textPrimary}}>
                      {t('auth.otpLabel')}
                    </Text>
                    <Text style={{fontSize: 13, color: colors.textSecondary, marginTop: 5, textAlign: 'center'}}>
                      {t('auth.otpSent')} {maskPhone(phone)}
                    </Text>
                  </View>

                  {/* OTP boxes */}
                  <View style={{flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24}}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={el => {otpRefs.current[i] = el;}}
                        style={{
                          width: 48, height: 56, borderRadius: 12, textAlign: 'center',
                          fontSize: 20, fontWeight: '700', color: colors.textPrimary,
                          borderWidth: 2,
                          borderColor: digit ? colors.primary : colors.border,
                          backgroundColor: digit ? colors.primaryLight : '#F8FAFC',
                        }}
                        value={digit}
                        onChangeText={text => handleOtpChange(text, i)}
                        onKeyPress={({nativeEvent}) => handleOtpKeyPress(nativeEvent.key, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        autoFocus={i === 0}
                      />
                    ))}
                  </View>

                  {isLoading ? (
                    <View style={{
                      height: 52, borderRadius: 14, backgroundColor: colors.primary,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={{opacity: otp.join('').length === 6 ? 1 : 0.5}}>
                      <PremiumButton
                        title={t('auth.verify')}
                        iconName="check-circle"
                        variant="primary"
                        onPress={() => handleVerify()}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 6, marginTop: 14, paddingVertical: 8,
                    }}
                    activeOpacity={0.7}
                    onPress={handleResend}
                  >
                    <Icon name="history" size={14} color={colors.primary} />
                    <Text style={{fontSize: 14, color: colors.primary, fontWeight: '500'}}>
                      {t('auth.resend')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>

    <DemoTooltip
      visible={isActive && currentStep === 'login_phone'}
      stepNumber={7} totalSteps={18}
      title="Step 6: Secure Login"
      description="EJJAR uses phone OTP authentication. No passwords needed. The contractor enters their Oman mobile number to receive a verification code."
      onNext={nextStep}
    />
    <DemoTooltip
      visible={isActive && currentStep === 'login_otp'}
      stepNumber={8} totalSteps={18}
      title="Step 7: Verify Identity"
      description="6-digit OTP sent via SMS. Once verified, contractor identity is established and they can submit RFQs."
      onNext={() => {
        nextStep();
        onSuccess();
        onClose();
      }}
    />
    </>
  );
}
