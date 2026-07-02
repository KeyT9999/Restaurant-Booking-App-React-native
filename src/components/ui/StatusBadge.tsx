import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { T } from '@/src/theme/tokens';

export type BadgeStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pending: {
      label: 'Chờ xác nhận',
      bg: 'rgba(212, 150, 83, 0.15)',
      text: T.color.primary,
    },
    confirmed: {
      label: 'Đã xác nhận',
      bg: 'rgba(16, 185, 129, 0.15)',
      text: T.color.success,
    },
    completed: {
      label: 'Hoàn thành',
      bg: 'rgba(255, 255, 255, 0.1)',
      text: T.color.text2,
    },
    cancelled: {
      label: 'Đã hủy',
      bg: 'rgba(244, 63, 94, 0.15)',
      text: T.color.error,
    },
    noshow: {
      label: 'Vắng mặt',
      bg: 'rgba(244, 63, 94, 0.15)',
      text: T.color.error,
    },
  };

  const current = map[status] ?? map.pending;

  return (
    <View style={[styles.badge, { backgroundColor: current.bg }, style]}>
      <Text style={[styles.text, { color: current.text }]}>{current.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.xs,
    borderRadius: T.radius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
