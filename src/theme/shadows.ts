import { Platform, ViewStyle } from 'react-native';
import { T } from './tokens';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,
  amber: Platform.select({
    ios: {
      shadowColor: T.color.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
    },
    android: {
      elevation: 12,
      shadowColor: T.color.primary, // Android 9+ supports shadowColor for elevation
    },
  }) as ViewStyle,
  amberSm: Platform.select({
    ios: {
      shadowColor: T.color.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
    },
    android: {
      elevation: 6,
      shadowColor: T.color.primary,
    },
  }) as ViewStyle,
} as const;
