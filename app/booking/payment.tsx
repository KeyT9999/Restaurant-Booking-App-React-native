import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator,
  Pressable, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';

export default function PaymentWebViewScreen() {
  const router = useRouter();
  const { paymentUrl, bookingId } = useLocalSearchParams<{
    paymentUrl: string;
    bookingId: string;
  }>();

  const [opening, setOpening] = useState(false);

  const decodedUrl = paymentUrl ? decodeURIComponent(paymentUrl) : '';

  const handleOpenPayment = async () => {
    if (!decodedUrl) return;
    setOpening(true);
    try {
      const canOpen = await Linking.canOpenURL(decodedUrl);
      if (canOpen) {
        await Linking.openURL(decodedUrl);
      } else {
        await Linking.openURL(decodedUrl);
      }
    } catch (_) {}
    finally { setOpening(false); }
  };

  const handleSuccess = () => {
    router.replace({
      pathname: '/booking/success',
      params: { bookingId },
    } as any);
  };

  const handleCancel = () => {
    router.replace({
      pathname: '/booking/payment-cancel',
      params: { bookingId },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <FontAwesome name="lock" size={13} color={T.color.success} style={{ marginRight: 6 }} />
          <Text style={[typography.bodyMD, styles.secureLabel]}>Thanh toán bảo mật</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.content}>
        {/* PayOS Logo */}
        <View style={styles.payosCard}>
          <View style={styles.payosIcon}>
            <FontAwesome name="credit-card" size={36} color={T.color.primary} />
          </View>
          <Text style={styles.payosTitle}>Cổng thanh toán PayOS</Text>
          <Text style={styles.payosSubtitle}>
            Nhấn nút bên dưới để mở trang thanh toán PayOS trong trình duyệt.{'\n'}
            Thanh toán an toàn qua ngân hàng hoặc ví điện tử.
          </Text>

          {decodedUrl ? (
            <Pressable
              style={[styles.openBtn, opening && { opacity: 0.7 }]}
              onPress={handleOpenPayment}
              disabled={opening}
            >
              {opening ? (
                <ActivityIndicator size="small" color="#0C0F16" />
              ) : (
                <>
                  <FontAwesome name="external-link" size={15} color="#0C0F16" style={{ marginRight: 8 }} />
                  <Text style={styles.openBtnText}>Mở trang thanh toán</Text>
                </>
              )}
            </Pressable>
          ) : (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-triangle" size={20} color={T.color.error} />
              <Text style={styles.errorText}>Không có đường dẫn thanh toán</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>Sau khi thanh toán</Text>
          <View style={styles.divider} />
        </View>

        {/* Confirmation buttons */}
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Giao dịch của bạn đã hoàn tất?</Text>
          <Pressable style={styles.successBtn} onPress={handleSuccess}>
            <FontAwesome name="check-circle" size={15} color="#0C0F16" style={{ marginRight: 8 }} />
            <Text style={styles.successBtnText}>Thanh toán thành công</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Giao dịch thất bại / Đã hủy</Text>
          </Pressable>
        </View>

        {/* Security info */}
        <View style={styles.securityRow}>
          <FontAwesome name="shield" size={12} color={T.color.text3} />
          <Text style={styles.securityText}>
            Giao dịch được mã hóa 256-bit SSL. BookEat không lưu thông tin thẻ của bạn.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
    backgroundColor: T.color.card, borderBottomWidth: 1, borderBottomColor: T.color.border,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  secureLabel: { color: T.color.text2 },
  content: { flex: 1, padding: T.space.base, justifyContent: 'center', gap: T.space.lg },
  payosCard: {
    backgroundColor: T.color.card, borderRadius: T.radius.xl,
    padding: T.space.xl, alignItems: 'center', gap: T.space.md,
    borderWidth: 1, borderColor: T.color.border,
  },
  payosIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(212,150,83,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  payosTitle: {
    color: T.color.text1, fontSize: 18, fontWeight: '700',
    fontFamily: T.font.displayBlack,
  },
  payosSubtitle: {
    color: T.color.text3, fontSize: 13, textAlign: 'center', lineHeight: 20,
  },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.color.primary, borderRadius: T.radius.lg,
    paddingVertical: T.space.md, paddingHorizontal: T.space.xl,
    width: '100%', marginTop: T.space.sm,
  },
  openBtnText: { color: '#0C0F16', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'center',
    backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: T.radius.lg,
    padding: T.space.md, width: '100%',
  },
  errorText: { color: T.color.error, fontSize: 13 },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: T.space.md,
  },
  divider: { flex: 1, height: 1, backgroundColor: T.color.border },
  dividerLabel: { color: T.color.text3, fontSize: 12 },
  confirmCard: {
    backgroundColor: T.color.card, borderRadius: T.radius.xl,
    padding: T.space.lg, gap: T.space.sm,
    borderWidth: 1, borderColor: T.color.border,
  },
  confirmTitle: { color: T.color.text2, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.color.success, borderRadius: T.radius.lg,
    paddingVertical: T.space.md,
  },
  successBtnText: { color: '#0C0F16', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    alignItems: 'center', paddingVertical: T.space.sm,
  },
  cancelBtnText: { color: T.color.text3, fontSize: 13 },
  securityRow: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'flex-start',
  },
  securityText: { flex: 1, color: T.color.text3, fontSize: 11, lineHeight: 16 },
});
