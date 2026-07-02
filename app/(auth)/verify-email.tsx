import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authApi } from '@/src/api/auth.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Button } from '@/src/components/ui/Button';
import { BackButton } from '@/src/components/ui/BackButton';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { showToast } = useToast();

  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    if (!otpToken.trim()) {
      setErrorMsg('Vui lòng nhập mã xác thực');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authApi.verifyEmail(otpToken.trim());
      setLoading(false);
      if (res.success) {
        showToast('Xác thực email thành công! Đăng nhập ngay.', 'success');
        router.replace('/(auth)/login');
      } else {
        setErrorMsg(res.message || 'Xác thực thất bại');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast('Không tìm thấy email nhận mã', 'error');
      return;
    }

    setErrorMsg('');
    setResending(true);
    try {
      const res = await authApi.resendVerification(email);
      setResending(false);
      if (res.success) {
        showToast('Đã gửi lại email xác thực!', 'success');
      } else {
        showToast(res.message || 'Gửi lại thất bại', 'error');
      }
    } catch (err: any) {
      setResending(false);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.headerTitle]}>Xác thực Email</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="envelope" size={24} color={T.color.primary} />
        </View>

        <Text style={[typography.displaySM, styles.title]}>Nhập mã xác thực</Text>
        <Text style={[typography.bodyMD, styles.subtitle]}>
          Chúng tôi đã gửi link xác thực hoặc mã token đến địa chỉ email <Text style={styles.highlight}>{email || 'của bạn'}</Text>.
        </Text>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mã Token / Link Token</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mã xác thực của bạn"
            placeholderTextColor={T.color.placeholder}
            value={otpToken}
            onChangeText={setOtpToken}
            autoCapitalize="none"
          />
        </View>

        <Button
          label="Xác thực tài khoản"
          onPress={handleVerify}
          variant={loading ? 'loading' : 'primary'}
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Chưa nhận được mã?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={T.color.primary} />
            ) : (
              <Text style={styles.resendLink}> Gửi lại mã</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
    paddingHorizontal: T.space.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: T.space['2xl'],
  },
  headerTitle: {
    marginLeft: T.space.base,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: T.radius.lg,
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.lg,
  },
  title: {
    marginBottom: T.space.xs,
  },
  subtitle: {
    color: T.color.text2,
    lineHeight: 22,
    marginBottom: T.space['2xl'],
  },
  highlight: {
    color: T.color.text1,
    fontWeight: '600',
  },
  errorText: {
    color: T.color.error,
    fontSize: 14,
    marginBottom: T.space.base,
  },
  inputContainer: {
    marginBottom: T.space.xl,
  },
  label: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: T.space.xs,
  },
  input: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    height: 48,
    paddingHorizontal: T.space.base,
    color: T.color.text1,
    fontSize: 15,
  },
  verifyButton: {
    marginBottom: T.space.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  resendText: {
    color: T.color.text3,
    fontSize: 14,
  },
  resendLink: {
    color: T.color.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
