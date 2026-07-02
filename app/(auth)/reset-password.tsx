import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authApi } from '@/src/api/auth.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { BackButton } from '@/src/components/ui/BackButton';
import { validatePassword } from '@/src/utils/validation';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    const pwError = validatePassword(password);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    const resetToken = token || '';
    if (!resetToken) {
      setErrorMsg('Token đặt lại mật khẩu thiếu hoặc không hợp lệ');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        token: resetToken,
        password,
        confirmPassword,
      });
      setLoading(false);
      if (res.success) {
        setDone(true);
        showToast('Đặt lại mật khẩu thành công!', 'success');
      } else {
        setErrorMsg(res.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.headerTitle]}>Đặt lại mật khẩu</Text>
      </View>

      {!done ? (
        <View style={styles.content}>
          <Text style={[typography.bodyLG, styles.subtitle]}>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TextField
            label="Mật khẩu mới"
            placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TextField
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            label="Đặt lại mật khẩu"
            onPress={handleReset}
            variant={loading ? 'loading' : 'primary'}
          />
        </View>
      ) : (
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <FontAwesome name="check-circle" size={38} color={T.color.success} />
          </View>

          <Text style={[typography.displaySM, styles.successTitle]}>Thành công!</Text>
          <Text style={[typography.bodyMD, styles.successSubtitle]}>
            Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.
          </Text>

          <Button
            label="Về đăng nhập"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      )}
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
    marginBottom: T.space.xl,
  },
  headerTitle: {
    marginLeft: T.space.base,
  },
  content: {
    flex: 1,
    paddingTop: T.space.sm,
  },
  subtitle: {
    color: T.color.text2,
    marginBottom: T.space.xl,
  },
  errorText: {
    color: T.color.error,
    fontSize: 14,
    marginBottom: T.space.base,
  },
  input: {
    marginBottom: T.space.lg,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.lg,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: T.space.xs,
  },
  successSubtitle: {
    textAlign: 'center',
    color: T.color.text2,
    lineHeight: 22,
    marginBottom: 40,
  },
});
