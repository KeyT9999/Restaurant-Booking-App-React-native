import React from 'react';
import { StyleSheet, Text, ActivityIndicator, Pressable, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { shadows } from '@/src/theme/shadows';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'disabled' | 'loading';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  label: string;
  onPress?: () => void;
  icon?: React.ComponentType<{ size: number; color: string }>;
  fullWidth?: boolean;
  size?: ButtonSize;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  label,
  onPress,
  icon: Icon,
  fullWidth = true,
  size = 'lg',
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (variant !== 'disabled' && variant !== 'loading') {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (variant !== 'disabled' && variant !== 'loading') {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    }
  };

  // Kiểu dáng chiều cao & padding
  const heightStyles = {
    sm: { height: 36, paddingHorizontal: T.space.md, borderRadius: T.radius.md },
    md: { height: 44, paddingHorizontal: T.space.lg, borderRadius: T.radius.lg },
    lg: { height: 52, paddingHorizontal: T.space.xl, borderRadius: T.radius.lg },
  }[size];

  // Font size tương ứng
  const fontSize = {
    sm: 13,
    md: 14,
    lg: 15,
  }[size];

  // Colors & Borders theo variant
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: T.color.primary,
      borderWidth: 0,
      ...shadows.amber,
    },
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(212, 150, 83, 0.4)',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    destructive: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(244, 63, 94, 0.25)',
    },
    disabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    loading: {
      backgroundColor: T.color.primary,
      borderWidth: 0,
      ...shadows.amber,
    },
  };

  // Text color theo variant
  const textColors: Record<ButtonVariant, string> = {
    primary: T.color.text1,
    secondary: T.color.text1,
    outline: T.color.primary,
    ghost: T.color.primary,
    destructive: T.color.error,
    disabled: T.color.text3,
    loading: T.color.text1,
  };

  const currentTextColor = textColors[variant];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={variant !== 'disabled' && variant !== 'loading' ? onPress : undefined}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        heightStyles,
        variantStyles[variant],
        animatedStyle,
        style,
      ]}
      disabled={variant === 'disabled' || variant === 'loading'}
    >
      {variant === 'loading' && (
        <ActivityIndicator size="small" color={currentTextColor} style={styles.indicator} />
      )}
      {Icon && variant !== 'loading' && (
        <Icon size={fontSize + 2} color={currentTextColor} />
      )}
      <Text style={[styles.text, { color: currentTextColor, fontSize }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: T.space.xs,
  },
  indicator: {
    marginRight: T.space.xs,
  },
});
