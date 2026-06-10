import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useDemoStore } from '../../store/demoStore';

export default function DemoFloatingBar() {
  const { isActive, exitDemo } = useDemoStore();

  if (!isActive) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 52,
        right: 12,
        backgroundColor: '#192433',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
      }}
    >
      <Icon name="play-circle" size={16} color="white" />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>DEMO MODE</Text>
      <TouchableOpacity onPress={exitDemo} style={{ marginLeft: 8 }}>
        <Icon name="close-circle" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}
