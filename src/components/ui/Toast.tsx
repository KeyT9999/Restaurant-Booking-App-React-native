import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextType {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hằng số id tự tăng
let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, kind }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Component quản lý các Toasts hiển thị trên màn hình
const ToastHost: React.FC<{ toasts: ToastItem[]; onDismiss: (id: number) => void }> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <View style={styles.host} pointerEvents="none">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </SafeAreaView>
    </View>
  );
};

// Component thẻ Toast riêng lẻ với hiệu ứng chuyển động Reanimated
const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({
  toast,
  onDismiss,
}) => {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // Hiện lên
    translateY.value = withSpring(0, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 250 });

    // Ẩn đi sau 2.8 giây
    const timer = setTimeout(() => {
      translateY.value = withTiming(-50, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 }, () => {
        runOnJS(onDismiss)(toast.id);
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const config = {
    success: {
      icon: 'check-circle' as const,
      color: T.color.success,
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    error: {
      icon: 'exclamation-circle' as const,
      color: T.color.error,
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.25)',
    },
    info: {
      icon: 'info-circle' as const,
      color: T.color.primary,
      bg: 'rgba(212, 150, 83, 0.15)',
      border: 'rgba(212, 150, 83, 0.25)',
    },
  }[toast.kind];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        animatedStyle,
      ]}
    >
      <FontAwesome name={config.icon} size={15} color={config.color} style={styles.icon} />
      <Text style={[styles.text, { color: config.color }]}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: T.space.base,
  },
  safeArea: {
    gap: 8,
    marginTop: Platform.OS === 'android' ? 30 : 0, // padding top on Android
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.base,
    borderRadius: T.radius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  icon: {
    marginRight: T.space.sm,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
