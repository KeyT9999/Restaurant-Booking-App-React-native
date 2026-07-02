import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import { validateEmail } from '@/src/utils/validation';
import { useToast } from '@/src/components/ui/Toast';

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    Alert.alert(
      'Đăng nhập Google',
      'Chọn phương thức đăng nhập bằng Google:',
      [
        {
          text: 'Google Demo (Khuyên dùng)',
          onPress: async () => {
            try {
              // Simulate Google authentication by auto-registering / logging in a Google test user.
              const emailDemo = 'google_diner_test@gmail.com';
              const nameDemo = 'Google Diner Test';
              const phoneDemo = '0988777666';
              const passDemo = 'GoogleDinerTestPassword123';

              await register(nameDemo, emailDemo, phoneDemo, passDemo);
              const res = await login(emailDemo, passDemo);
              if (res.success) {
                showToast('Đăng nhập bằng Google Demo thành công! 🎉', 'success');
                router.replace('/(tabs)');
              } else {
                setErrorMsg(res.message);
              }
            } catch (err) {
              setErrorMsg('Đăng nhập Google Demo thất bại');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'OAuth Web Flow (Cần cấu hình env BE)',
          onPress: async () => {
            try {
              const { getCustomBaseURL } = require('@/src/api/client');
              const baseUrl = await getCustomBaseURL();
              const googleAuthUrl = `${baseUrl}/auth/google`;

              const { openBrowserAsync } = require('expo-web-browser');
              await openBrowserAsync(googleAuthUrl);
            } catch (err) {
              setErrorMsg('Không thể mở liên kết Google OAuth');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => setLoading(false)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Dynamic IP Setting Cog */}
      <TouchableOpacity
        onPress={() => router.push('/settings/ip')}
        style={styles.settingsBtn}
      >
        <FontAwesome name="cog" size={20} color={T.color.primary} />
      </TouchableOpacity>

      <Text style={[typography.displayLG, styles.title]}>BookEat</Text>
      <Text style={[typography.bodyLG, styles.subtitle]}>Đăng nhập tài khoản khách hàng</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <TextField
        label="Email hoặc Username"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        icon={(props) => <FontAwesome name="envelope" {...props} />}
        style={styles.inputField}
      />

      <TextField
        label="Mật khẩu"
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        icon={(props) => <FontAwesome name="lock" {...props} />}
        style={styles.inputField}
      />

      <View style={styles.forgotContainer}>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      <Button
        label="Đăng nhập"
        onPress={handleLogin}
        variant={loading ? 'loading' : 'primary'}
      />

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>hoặc</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign In Button */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        style={styles.googleBtn}
      >
        <FontAwesome name="google" size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkButton}>
        <Text style={styles.linkText}>
          Chưa có tài khoản? <Text style={{ color: T.color.primary }}>Đăng ký ngay</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
    padding: T.space.xl,
    justifyContent: 'center',
  },
  settingsBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  title: {
    textAlign: 'center',
    marginBottom: T.space.xs,
  },
  subtitle: {
    textAlign: 'center',
    color: T.color.text2,
    marginBottom: T.space['2xl'],
  },
  errorText: {
    color: T.color.error,
    textAlign: 'center',
    marginBottom: T.space.base,
    fontSize: 14,
  },
  inputField: {
    marginBottom: T.space.lg,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: T.space.xl,
    marginTop: -T.space.xs,
  },
  forgotText: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  linkButton: {
    marginTop: T.space.xl,
    alignItems: 'center',
  },
  linkText: {
    color: T.color.text3,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: T.space.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: T.color.text3,
    fontSize: 12,
    marginHorizontal: T.space.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0F16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: T.radius.lg,
    height: 48,
    width: '100%',
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
