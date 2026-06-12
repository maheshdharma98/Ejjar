import React from 'react';
import {View, Text} from 'react-native';
import Icon from './Icon';

interface Props {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

export default function StarRating({rating, size = 14, showNumber = false}: Props) {
  const stars = [1, 2, 3, 4, 5].map(i => {
    if (rating >= i) return 'star';
    if (rating >= i - 0.5) return 'star-half-full';
    return 'star-outline';
  });

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
      {stars.map((name, idx) => (
        <Icon
          key={idx}
          name={name}
          size={size}
          color={name === 'star-outline' ? '#E5E7EB' : '#F59E0B'}
        />
      ))}
      {showNumber && (
        <Text
          style={{
            fontSize: size - 1,
            fontWeight: '600',
            color: '#0F172A',
            marginLeft: 4,
          }}
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

