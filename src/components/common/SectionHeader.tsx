import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from './Icon';

interface Props {
  title: string;
  iconName?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function SectionHeader({title, iconName, action}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
      }}
    >
      {iconName && (
        <Icon name={iconName} size={18} color="#192433" />
      )}
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          color: '#0F172A',
        }}
      >
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={{fontSize: 13, fontWeight: '600', color: '#192433'}}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
