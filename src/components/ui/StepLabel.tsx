import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { T } from '@/src/theme/tokens';

interface StepLabelProps {
  n: number;
  label: string;
  style?: ViewStyle;
}

export const StepLabel: React.FC<StepLabelProps> = ({ n, label, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{n}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.space.sm,
  },
  numberContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 150, 83, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.sm,
  },
  number: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
