import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';

interface RatingProps {
  value: number;
  count?: number;
  style?: ViewStyle;
}

export const Rating: React.FC<RatingProps> = ({ value, count, style }) => {
  return (
    <View style={[styles.container, style]}>
      <FontAwesome name="star" size={12} color={T.color.primary} style={styles.star} />
      <Text style={styles.value}>{value.toFixed(1)}</Text>
      {count !== undefined && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 4,
  },
  value: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  count: {
    color: T.color.text3,
    fontSize: 11,
    marginLeft: 3,
  },
});
