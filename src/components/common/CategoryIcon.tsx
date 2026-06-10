import React from 'react';
import {View} from 'react-native';
import Icon from './Icon';
import {categoryIcons, categoryColors, categoryBgColors} from '../../utils/iconMap';

interface Props {
  category: string;
  size?: number;
  withBackground?: boolean;
}

export default function CategoryIcon({category, size = 24, withBackground = true}: Props) {
  const iconName = categoryIcons[category] ?? 'briefcase-outline';
  const color = categoryColors[category] ?? '#192433';
  const bg = categoryBgColors[category] ?? '#E8EDF2';
  const padding = Math.round(size * 0.5);
  const borderRadius = Math.round((size + padding * 2) / 2);

  if (!withBackground) {
    return <Icon name={iconName} size={size} color={color} />;
  }

  return (
    <View
      style={{
        width: size + padding * 2,
        height: size + padding * 2,
        borderRadius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={iconName} size={size} color={color} />
    </View>
  );
}
