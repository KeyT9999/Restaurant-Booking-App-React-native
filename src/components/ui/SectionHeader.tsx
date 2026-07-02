import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import { T } from '@/src/theme/tokens';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.lg,
    marginBottom: T.space.md,
  },
  title: {
    color: T.color.text1,
    fontFamily: T.font.display,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  action: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});
