import React from 'react';
import {View, Text} from 'react-native';
import Icon from './Icon';

interface StatusConfig {
  bg: string;
  color: string;
  icon: string;
  label: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  new: {
    bg: '#EFF6FF',
    color: '#1D4ED8',
    icon: 'alert-circle-outline',
    label: 'New',
  },
  supplier_responded: {
    bg: '#EFF6FF',
    color: '#1D4ED8',
    icon: 'message-text-outline',
    label: 'Quotes In',
  },
  quotes_in: {
    bg: '#EFF6FF',
    color: '#1D4ED8',
    icon: 'message-text-outline',
    label: 'Quotes In',
  },
  negotiation: {
    bg: '#FFFBEB',
    color: '#B45309',
    icon: 'swap-horizontal',
    label: 'Negotiating',
  },
  negotiating: {
    bg: '#FFFBEB',
    color: '#B45309',
    icon: 'swap-horizontal',
    label: 'Negotiating',
  },
  accepted: {
    bg: '#F0FDF4',
    color: '#15803D',
    icon: 'check-circle-outline',
    label: 'Accepted',
  },
  confirmed: {
    bg: '#ECFDF5',
    color: '#065F46',
    icon: 'shield-check',
    label: 'Confirmed',
  },
  completed: {
    bg: '#F1F5F9',
    color: '#334155',
    icon: 'check-decagram',
    label: 'Completed',
  },
  rejected: {
    bg: '#FEF2F2',
    color: '#B91C1C',
    icon: 'close-circle-outline',
    label: 'Rejected',
  },
  in_progress: {
    bg: '#FFFBEB',
    color: '#B45309',
    icon: 'progress-clock',
    label: 'In Progress',
  },
  available: {
    bg: '#F0FDF4',
    color: '#15803D',
    icon: 'check-circle',
    label: 'Available',
  },
  booked: {
    bg: '#FEF2F2',
    color: '#B91C1C',
    icon: 'calendar-lock',
    label: 'Booked',
  },
};

interface Props {
  status: string;
}

export default function StatusBadge({status}: Props) {
  const config = STATUS_MAP[status] ?? {
    bg: '#F1F5F9',
    color: '#334155',
    icon: 'help-circle-outline',
    label: status.replace(/_/g, ' '),
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: config.bg,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        gap: 4,
      }}
    >
      <Icon name={config.icon} size={12} color={config.color} />
      <Text style={{fontSize: 11, fontWeight: '600', color: config.color}}>
        {config.label}
      </Text>
    </View>
  );
}
