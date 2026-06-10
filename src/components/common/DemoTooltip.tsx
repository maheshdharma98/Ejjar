import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';
import { useDemoStore } from '../../store/demoStore';

type Props = {
  visible: boolean;
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  position?: 'top' | 'center' | 'bottom';
};

export default function DemoTooltip({
  visible,
  title,
  description,
  stepNumber,
  totalSteps,
  onNext,
}: Props) {
  const exitDemo = useDemoStore(s => s.exitDemo);
  const { t } = useTranslation('demo');

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          {/* Drag handle */}
          <View style={{ width: 48, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF1FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Icon name="play-circle" size={16} color="#192433" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#192433', marginLeft: 4 }}>{t('tour.ui.label')}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{t('tour.ui.stepOf', { current: stepNumber, total: totalSteps })}</Text>
          </View>

          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
            <View style={{ height: 4, backgroundColor: '#192433', borderRadius: 2, width: `${(stepNumber / totalSteps) * 100}%` }} />
          </View>

          {/* Title */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>{title}</Text>

          {/* Description */}
          <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 24 }}>{description}</Text>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={exitDemo}
              style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}
            >
              <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '600' }}>{t('tour.ui.exitTour')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              style={{
                flex: 1, backgroundColor: '#192433', borderRadius: 12, paddingVertical: 12,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                shadowColor: '#192433', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', marginRight: 4 }}>
                {stepNumber === totalSteps ? t('tour.ui.finish') : t('tour.ui.next')}
              </Text>
              <Icon name="arrow-right" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
