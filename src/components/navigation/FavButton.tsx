import React, { useEffect } from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';

interface FavButtonProps {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FavButton: React.FC<FavButtonProps> = ({ liked, onToggle, size = 20, style }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    // Spring pop animation on tap
    scale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.button, animatedStyle, style]}
    >
      <FontAwesome
        name={liked ? 'heart' : 'heart-o'}
        size={size}
        color={liked ? T.color.error : '#FFFFFF'}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 15, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default FavButton;
