import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';

type Props = {
  variant?: 'white' | 'black';
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

const WHITE = require('../../assets/logo_white.png');
const BLACK = require('../../assets/logo_black.png');

export default function EjjarLogo({
  variant = 'white',
  width = 48,
  height = 64,
  style,
}: Props) {
  return (
    <Image
      source={variant === 'white' ? WHITE : BLACK}
      style={[{width, height, resizeMode: 'contain'}, style]}
    />
  );
}
