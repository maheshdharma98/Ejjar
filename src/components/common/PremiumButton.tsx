import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

export default function PremiumButton({
  title,
  iconName,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={{opacity: disabled ? 0.5 : 1}}
      >
        <LinearGradient
          colors={['#E67E3A', '#D4692E']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              borderRadius: 14,
              paddingHorizontal: 20,
              gap: 8,
            },
            shadows.md,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              {iconName && <Icon name={iconName} size={18} color="#ffffff" />}
              <Text style={{fontSize: 14, fontWeight: '600', color: '#ffffff', letterSpacing: 0.2}}>
                {title}
              </Text>
              <View style={{marginLeft: 'auto'}}>
                <Icon name="chevron-right" size={18} color="#ffffff" />
              </View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 52,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: '#101828',
            backgroundColor: 'transparent',
            paddingHorizontal: 20,
            gap: 8,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#101828" />
        ) : (
          <>
            {iconName && <Icon name={iconName} size={18} color="#101828" />}
            <Text style={{fontSize: 13, fontWeight: '500', color: '#101828'}}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // danger
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 52,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: '#FECACA',
          backgroundColor: '#FEE2E2',
          paddingHorizontal: 20,
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        shadows.sm,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#E67E3A" />
      ) : (
        <>
          {iconName && <Icon name={iconName} size={18} color="#E67E3A" />}
          <Text style={{fontSize: 13, fontWeight: '500', color: '#E67E3A'}}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
