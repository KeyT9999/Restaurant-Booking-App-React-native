import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { loginWithToken } = useAuth();
  const { token, error } = useLocalSearchParams<{ token?: string; error?: string }>();

  useEffect(() => {
    // Dismiss any web browsers that are currently open on mobile
    WebBrowser.dismissBrowser();

    const processLogin = async () => {
      if (error) {
        showToast('Đăng nhập Google thất bại. Vui lòng thử lại.', 'error');
        router.replace('/(auth)/login');
        return;
      }

      if (!token) {
        showToast('Không tìm thấy mã xác thực đăng nhập.', 'error');
        router.replace('/(auth)/login');
        return;
      }

      try {
        const res = await loginWithToken(token);
        if (res.success) {
          showToast('Đăng nhập bằng Google thành công! 🎉', 'success');
          router.replace('/(tabs)');
        } else {
          showToast(res.message || 'Đăng nhập Google thất bại.', 'error');
          router.replace('/(auth)/login');
        }
      } catch (err) {
        showToast('Lỗi hệ thống khi xử lý đăng nhập.', 'error');
        router.replace('/(auth)/login');
      }
    };

    processLogin();
  }, [token, error]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <FontAwesome name="google" size={32} color={T.color.primary} />
        </View>
        <ActivityIndicator size="large" color={T.color.primary} style={styles.spinner} />
        <Text style={[typography.titleMD, styles.title]}>Đang kết nối tài khoản Google</Text>
        <Text style={styles.subtitle}>
          Vui lòng đợi trong giây lát khi chúng tôi xác minh thông tin tài khoản của bạn.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  card: {
    width: '100%',
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.lg,
  },
  spinner: {
    marginVertical: T.space.md,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: T.space.xs,
  },
  subtitle: {
    color: T.color.text3,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: T.space.sm,
  },
});
