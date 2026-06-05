import React, {useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../store/authStore';
import {maskPhone} from '../../utils/masking';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginBottomSheet({isOpen, onClose, onSuccess}: Props) {
  const {t} = useTranslation();
  const {login, isLoading} = useAuthStore();

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
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl px-4 pt-3 pb-10"
          >
            {/* Handle bar */}
            <View className="w-10 h-1 bg-[#E5E7EB] rounded-full self-center mb-6" />

            {step === 1 ? (
              <>
                {/* Logo */}
                <Text className="text-[#1A4FBA] text-2xl font-bold text-center mb-1">
                  EJJAR
                </Text>
                <Text className="text-[#1A1A2E] text-[22px] font-bold text-center mb-1">
                  {t('auth.welcome')}
                </Text>
                <Text className="text-[#6B7280] text-sm text-center mb-8">
                  {t('auth.subtitle')}
                </Text>

                {/* Phone input */}
                <View className="mb-6">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
                    {t('auth.phoneLabel')}
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center mx-4"
                  style={{shadowColor: '#1A4FBA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6}}
                  activeOpacity={0.85}
                  onPress={handleSendOtp}
                  disabled={phone.trim().length < 8}
                >
                  <Text className="text-white text-base font-semibold tracking-wide">
                    {t('auth.sendOtp')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-[#1A1A2E] text-[22px] font-bold text-center mb-1">
                  {t('auth.otpLabel')}
                </Text>
                <Text className="text-[#6B7280] text-sm text-center mb-8">
                  {t('auth.otpSent')} {maskPhone(phone)}
                </Text>

                {/* OTP boxes */}
                <View className="flex-row justify-center gap-3 mb-8">
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={el => {
                        otpRefs.current[i] = el;
                      }}
                      className={`w-[48px] h-[48px] border rounded-xl text-center text-[#1A1A2E] text-lg font-bold ${
                        digit ? 'border-[#1A4FBA] bg-[#E8EEFB]' : 'border-[#E5E7EB] bg-white'
                      }`}
                      value={digit}
                      onChangeText={text => handleOtpChange(text, i)}
                      onKeyPress={({nativeEvent}) =>
                        handleOtpKeyPress(nativeEvent.key, i)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      autoFocus={i === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center shadow-md mx-4 mb-4"
                  activeOpacity={0.8}
                  onPress={() => handleVerify()}
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-base font-semibold tracking-wide">
                      {t('auth.verify')}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center py-2"
                  activeOpacity={0.7}
                  onPress={handleResend}
                >
                  <Text className="text-[#1A4FBA] text-sm font-medium">
                    {t('auth.resend')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
