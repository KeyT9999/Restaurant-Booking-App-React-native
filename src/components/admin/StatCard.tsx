import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
}

export const StatGrid = ({ children }: { children: React.ReactNode }) => {
  return <View style={styles.grid}>{children}</View>;
};

export const StatCard = ({ 
  label, 
  value, 
  valueColor = '#FFFFFF', 
  delta, 
  deltaType = 'positive' 
}: StatCardProps) => {
  
  const deltaColor = deltaType === 'positive' ? '#10B981' : deltaType === 'negative' ? '#EF4444' : '#8A8A93';
  const deltaIcon = deltaType === 'positive' ? '↗' : deltaType === 'negative' ? '↘' : '→';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {delta ? (
        <Text style={[styles.delta, { color: deltaColor }]}>
          {deltaIcon} {delta}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#16171D',
    borderRadius: 14,
    padding: 16,
    width: '48%',
  },
  label: {
    fontSize: 10,
    color: '#8A8A93',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  delta: {
    fontSize: 12,
    fontWeight: '500',
  }
});
