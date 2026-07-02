import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import { validateEmail, validatePhone, validatePassword, validateFullName } from '@/src/utils/validation';
import { useToast } from '@/src/components/ui/Toast';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    // Client-side validations
    const nameError = validateFullName(fullName);
    if (nameError) {
      setErrorMsg(nameError);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setErrorMsg(phoneError);
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }

    setErrorMsg('');
    setLoading(true);
    const res = await register(fullName, email, phoneNumber, password);
    setLoading(false);
    if (res.success) {
      showToast(res.message, 'success');
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email }
      });
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
        <Text style={[typography.displayMD, styles.title]}>Đăng ký tài khoản</Text>
        <Text style={[typography.bodyLG, styles.subtitle]}>Khám phá thế giới ẩm thực cao cấp</Text>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TextField
          label="Họ và tên"
          placeholder="Nguyễn Văn An"
          value={fullName}
          onChangeText={setFullName}
          icon={(props) => <FontAwesome name="user" {...props} />}
          style={styles.inputField}
        />

        <TextField
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          icon={(props) => <FontAwesome name="envelope" {...props} />}
          style={styles.inputField}
        />

        <TextField
          label="Số điện thoại"
          placeholder="0901 234 567"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          icon={(props) => <FontAwesome name="phone" {...props} />}
          style={styles.inputField}
        />

        <TextField
          label="Mật khẩu"
          placeholder="Mật khẩu (ít nhất 8 ký tự)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          icon={(props) => <FontAwesome name="lock" {...props} />}
          style={styles.inputField}
        />

        <Button
          label="Đăng ký miễn phí"
          onPress={handleRegister}
          variant={loading ? 'loading' : 'primary'}
          style={styles.button}
        />

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkButton}>
          <Text style={styles.linkText}>
            Đã có tài khoản? <Text style={{ color: T.color.primary }}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  scrollContainer: {
    padding: T.space.xl,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
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
  button: {
    marginTop: T.space.md,
  },
  linkButton: {
    marginTop: T.space.xl,
    alignItems: 'center',
  },
  linkText: {
    color: T.color.text3,
    fontSize: 14,
  },
});
