import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

interface EmptyStateProps {
  icon?: keyof typeof FontAwesome.glyphMap;
  title: string;
  description: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-o',
  title,
  description,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <FontAwesome name={icon} size={40} color={T.color.text3} style={styles.icon} />
      <Text style={[typography.titleSM, styles.title]}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: T.space.base,
  },
  title: {
    color: T.color.text1,
    marginBottom: T.space.xs,
    textAlign: 'center',
  },
  description: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
export default EmptyState;
