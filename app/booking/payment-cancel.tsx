import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

export default function PaymentCancelScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <FontAwesome name="times" size={40} color={T.color.error} />
        </View>

        <Text style={styles.title}>Thanh toán đã hủy</Text>
        <Text style={styles.subtitle}>
          Giao dịch của bạn đã bị hủy hoặc không thành công.{'\n'}
          Đơn đặt bàn chưa được xác nhận thanh toán.
        </Text>

        {bookingId ? (
          <View style={styles.infoBox}>
            <FontAwesome name="info-circle" size={14} color={T.color.primary} />
            <Text style={styles.infoText}>
              Đặt bàn của bạn vẫn được giữ trong 10 phút. Bạn có thể thử lại thanh toán.
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {bookingId ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.replace({
                pathname: '/booking/summary',
                params: { bookingId },
              } as any)}
            >
              <FontAwesome name="refresh" size={15} color="#0C0F16" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Thử lại thanh toán</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.secondaryBtnText}>Xem đơn đặt bàn</Text>
          </Pressable>

          <Pressable
            style={styles.ghostBtn}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.ghostBtnText}>Về trang chủ</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Help */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.helpRow}>
        <FontAwesome name="headphones" size={14} color={T.color.text3} />
        <Text style={styles.helpText}>
          Cần hỗ trợ? Liên hệ{' '}
          <Text style={styles.helpLink}>support@bookeat.vn</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: T.color.bg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: T.space.base,
  },
  card: {
    width: '100%', backgroundColor: T.color.card,
    borderRadius: T.radius['2xl'], padding: T.space.xl,
    borderWidth: 1, borderColor: T.color.border,
    alignItems: 'center', gap: T.space.md,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(244,63,94,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: T.space.sm,
  },
  title: {
    fontFamily: T.font.displayBlack, fontSize: 24, color: T.color.text1,
    fontWeight: '800', textAlign: 'center',
  },
  subtitle: {
    color: T.color.text3, fontSize: 14, textAlign: 'center', lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'flex-start',
    backgroundColor: 'rgba(212,150,83,0.1)', borderRadius: T.radius.lg,
    padding: T.space.md, width: '100%',
  },
  infoText: { flex: 1, color: T.color.text2, fontSize: 13, lineHeight: 20 },
  actions: { width: '100%', gap: T.space.sm, marginTop: T.space.sm },
  primaryBtn: {
    backgroundColor: T.color.primary, borderRadius: T.radius.lg,
    paddingVertical: T.space.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#0C0F16', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: T.color.elevated, borderRadius: T.radius.lg,
    paddingVertical: T.space.md, alignItems: 'center',
    borderWidth: 1, borderColor: T.color.border,
  },
  secondaryBtnText: { color: T.color.text1, fontWeight: '600', fontSize: 14 },
  ghostBtn: { alignItems: 'center', paddingVertical: T.space.sm },
  ghostBtnText: { color: T.color.text3, fontSize: 14 },
  helpRow: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'center',
    marginTop: T.space.xl,
  },
  helpText: { color: T.color.text3, fontSize: 12 },
  helpLink: { color: T.color.primary },
});
