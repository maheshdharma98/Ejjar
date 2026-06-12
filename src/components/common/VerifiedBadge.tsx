import React from 'react';
import {View, Text} from 'react-native';
import Icon from './Icon';

export default function VerifiedBadge() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8EDF2',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Icon name="check-decagram" size={12} color="#192433" />
      <Text style={{fontSize: 11, fontWeight: '600', color: '#101828'}}>
        Verified
      </Text>
    </View>
  );
}

