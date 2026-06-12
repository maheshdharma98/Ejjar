import React from 'react';
import {View, Text} from 'react-native';
import Icon from './Icon';

interface StatusConfig {
  bg: string;
  color: string;
  icon: string;
  label: string;
}

// EJJAR Design System v1.0 — semantic status pairs
const STATUS_MAP: Record<string, StatusConfig> = {
  new: {
    bg: '#E0F2FE', color: '#0369A1',
    icon: 'alert-circle-outline', label: 'New',
  },
  supplier_responded: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'message-text-outline', label: 'Quotes In',
  },
  quotes_in: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'message-text-outline', label: 'Quotes In',
  },
  negotiation: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'swap-horizontal', label: 'Negotiating',
  },
  negotiating: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'swap-horizontal', label: 'Negotiating',
  },
  accepted: {
    bg: '#DCFCE7', color: '#166534',
    icon: 'check-circle-outline', label: 'Accepted',
  },
  confirmed: {
    bg: '#E0F2FE', color: '#0369A1',
    icon: 'shield-check', label: 'Confirmed',
  },
  completed: {
    bg: '#DCFCE7', color: '#166534',
    icon: 'check-decagram', label: 'Completed',
  },
  rejected: {
    bg: '#FEE2E2', color: '#991B1B',
    icon: 'close-circle-outline', label: 'Rejected',
  },
  cancelled: {
    bg: '#FEE2E2', color: '#991B1B',
    icon: 'cancel', label: 'Cancelled',
  },
  in_progress: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'progress-clock', label: 'In Progress',
  },
  available: {
    bg: '#DCFCE7', color: '#166534',
    icon: 'check-circle', label: 'Available',
  },
  booked: {
    bg: '#FEF9C3', color: '#854D0E',
    icon: 'calendar-lock', label: 'Booked',
  },
  pending: {
    bg: '#F1F5F9', color: '#475569',
    icon: 'clock-outline', label: 'Pending',
  },
};

interface Props {
  status: string;
}

export default function StatusBadge({status}: Props) {
  const config = STATUS_MAP[status] ?? {
    bg: '#F1F5F9',
    color: '#475569',
    icon: 'help-circle-outline',
    label: status.replace(/_/g, ' '),
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: config.bg,
        borderRadius: 9999,
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
