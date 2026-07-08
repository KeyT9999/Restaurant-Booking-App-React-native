import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Button } from '@/src/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RegisterSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <FontAwesome name="check-circle" size={48} color={T.color.success} />
        </View>

        <Text style={[typography.displaySM, styles.title]}>Xác thực thành công! 🎉</Text>
        
        <Text style={[typography.bodyMD, styles.subtitle]}>
          Chào mừng bạn đến với <Text style={{ color: T.color.primary, fontWeight: '700' }}>BookEat</Text>. {'\n'}
          Tài khoản của bạn đã sẵn sàng hoạt động. Trải nghiệm tinh hoa ẩm thực cao cấp ngay hôm nay.
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <FontAwesome name="shield" size={12} color={T.color.success} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Bảo mật tối đa</Text>
          </View>
          <View style={styles.badge}>
            <FontAwesome name="star" size={12} color={T.color.primary} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Thành viên VIP</Text>
          </View>
        </View>

        <Button
          label="Đăng nhập ngay"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.loginBtn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    paddingHorizontal: T.space.xl,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius['2xl'],
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.xl,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: T.space.md,
  },
  subtitle: {
    color: T.color.text2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: T.space.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: T.space['2xl'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
  },
});
