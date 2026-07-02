import React, { useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '@/src/api/auth.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { BackButton } from '@/src/components/ui/BackButton';
import { validateEmail } from '@/src/utils/validation';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function ForgotPassword() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setLoading(false);
      if (res.success) {
        setSent(true);
        showToast('Link đặt lại mật khẩu đã được gửi!', 'success');
      } else {
        setErrorMsg(res.message || 'Gửi yêu cầu thất bại');
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
        <Text style={[typography.titleMD, styles.headerTitle]}>Quên mật khẩu</Text>
      </View>

      {!sent ? (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <FontAwesome name="lock" size={28} color={T.color.primary} />
          </View>

          <Text style={[typography.displaySM, styles.title]}>Đặt lại mật khẩu</Text>
          <Text style={[typography.bodyMD, styles.subtitle]}>
            Nhập email của bạn và chúng tôi sẽ gửi liên kết để thiết lập lại mật khẩu mới.
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TextField
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />

          <Button
            label="Gửi link đặt lại"
            onPress={handleSubmit}
            variant={loading ? 'loading' : 'primary'}
          />
        </View>
      ) : (
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <FontAwesome name="check-circle" size={44} color={T.color.success} />
          </View>

          <Text style={[typography.displaySM, styles.successTitle]}>Đã gửi email!</Text>
          <Text style={[typography.bodyMD, styles.successSubtitle]}>
            Vui lòng kiểm tra hộp thư <Text style={styles.highlight}>{email}</Text> và làm theo hướng dẫn để đặt lại mật khẩu.
          </Text>

          <Button
            label="Quay lại đăng nhập"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.backButton}
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
    marginBottom: T.space['2xl'],
  },
  headerTitle: {
    marginLeft: T.space.base,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
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
  errorText: {
    color: T.color.error,
    fontSize: 14,
    marginBottom: T.space.base,
  },
  input: {
    marginBottom: T.space.xl,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.xl,
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
  highlight: {
    color: T.color.text1,
    fontWeight: '600',
  },
  backButton: {
    marginTop: T.space.base,
  },
});
