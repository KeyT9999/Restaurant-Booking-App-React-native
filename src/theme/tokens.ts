import { Platform } from 'react-native';

export const T = {
  color: {
    bg: '#0C0F16',
    card: '#141720',
    elevated: '#1B2030',
    primary: '#D49653', // Amber brand
    text1: '#FFFFFF',
    text2: '#9BA3B2',
    text3: '#545E72',
    success: '#10B981',
    error: '#F43F5E',
    border: 'rgba(255,255,255,0.07)',
    placeholder: '#3A4255',
  },
  // 4px base grid
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  font: {
    display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'System' }),
    displayBlack: Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'System' }),
    regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    bold: Platform.select({ ios: 'System', android: 'sans-serif-condensed-bold', default: 'System' }),
  },
} as const;
