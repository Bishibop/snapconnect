import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from './Icon';
import { IconKey } from '../../constants/icons';
import { theme } from '../../constants/theme';
import { VibeCheckStatus } from '../../utils/status';

interface StatusIconProps {
  status: VibeCheckStatus;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

// Map status to icon keys
const statusIconMap: Record<VibeCheckStatus, IconKey> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  opened: 'OPENED',
  expired: 'EXPIRED',
};

export default function StatusIcon({
  status,
  size = 20,
  showLabel = false,
  style,
}: StatusIconProps) {
  const iconKey = statusIconMap[status];
  let color: string;
  let label: string;

  switch (status) {
    case 'sent':
      color = theme.colors.textSecondary;
      label = 'Sent';
      break;
    case 'delivered':
      color = theme.colors.primary;
      label = 'Delivered';
      break;
    case 'opened':
      color = theme.colors.success;
      label = 'Opened';
      break;
    case 'expired':
      color = theme.colors.error;
      label = 'Expired';
      break;
    default:
      color = theme.colors.gray;
      label = '';
  }

  return (
    <View style={[styles.container, style]}>
      <Icon name={iconKey} size={size} color={color} />
      {showLabel && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
