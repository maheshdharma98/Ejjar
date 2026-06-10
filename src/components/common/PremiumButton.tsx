import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import Icon from './Icon';
import {shadows} from '../../theme/designSystem';

interface Props {
  title: string;
  iconName?: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

const VARIANT_STYLES = {
  primary: {
    bg: '#192433',
    border: '#192433',
    text: '#FFFFFF',
    icon: '#FFFFFF',
    shadow: shadows.primary,
  },
  outline: {
    bg: '#FFFFFF',
    border: '#192433',
    text: '#192433',
    icon: '#192433',
    shadow: shadows.sm,
  },
  danger: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#B91C1C',
    icon: '#B91C1C',
    shadow: shadows.sm,
  },
};

export default function PremiumButton({
  title,
  iconName,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const styles = VARIANT_STYLES[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 52,
          borderRadius: 14,
          borderWidth: 1.5,
          backgroundColor: styles.bg,
          borderColor: styles.border,
          paddingHorizontal: 20,
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        styles.shadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.icon} />
      ) : (
        <>
          {iconName && (
            <Icon name={iconName} size={18} color={styles.icon} />
          )}
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: styles.text,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Text>
          <View style={{marginLeft: 'auto'}}>
            <Icon name="chevron-right" size={18} color={styles.icon} />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
