import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  sm?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip: React.FC<ChipProps> = ({
  label,
  active,
  onPress,
  sm = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const height = sm ? 32 : 36;
  const paddingHorizontal = sm ? T.space.sm : T.space.base;
  const fontSize = sm ? 12 : 13;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[
        styles.chip,
        {
          height,
          paddingHorizontal,
          backgroundColor: active ? T.color.primary : T.color.card,
        },
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            color: active ? T.color.text1 : T.color.text2,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});
