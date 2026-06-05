import React from 'react';
import {View, Text} from 'react-native';
import {useToastStore} from '../../store/toastStore';

const BG_COLOR = {
  success: '#15803D',
  error: '#DC2626',
  info: '#1A1A2E',
};

export default function Toast() {
  const {visible, message, color} = useToastStore();

  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute bottom-24 left-4 right-4 rounded-2xl px-4 py-3 flex-row items-center shadow-lg"
      style={{backgroundColor: BG_COLOR[color], pointerEvents: 'none'}}
    >
      <Text className="text-white text-sm font-medium flex-1">{message}</Text>
    </View>
  );
}
