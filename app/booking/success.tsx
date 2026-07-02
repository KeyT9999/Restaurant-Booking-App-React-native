import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentApi } from '@/src/api/payment.api';
import { bookingApi } from '@/src/api/booking.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Button } from '@/src/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import { useToast } from '@/src/components/ui/Toast';
import * as WebBrowser from 'expo-web-browser';

export default function BookingSuccess() {
  const router = useRouter();
  const { showToast } = useToast();
  const { bookingId, orderCode, restaurantName } = useLocalSearchParams<{
    bookingId: string;
    orderCode?: string;
    restaurantName: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'failed' | 'no_deposit'>('pending');
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const verifyStatus = async (showNotification = false) => {
    if (!orderCode) {
      setPaymentStatus('no_deposit');
      setLoading(false);
      return;
    }

    setChecking(true);
    try {
      const res = await paymentApi.checkStatus(orderCode);
      if (res.success && res.data) {
        const payment = res.data;
        if (payment.status === 'paid') {
          setPaymentStatus('paid');
          if (showNotification) {
            showToast('Thanh toán tiền cọc thành công!', 'success');
          }
        } else if (['failed', 'cancelled', 'expired'].includes(payment.status)) {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }
      }
    } catch (error) {
      console.warn('Lỗi kiểm tra trạng thái thanh toán:', error);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyStatus();
  }, [orderCode]);

  const handleRetryPayment = async () => {
    if (!bookingId) return;
    setChecking(true);
    try {
      const payRes = await paymentApi.createPayment({
        targetType: 'booking',
        targetId: bookingId,
      });

      if (payRes.success && payRes.data) {
        const payment = payRes.data;
        if (payment.checkoutUrl) {
          await WebBrowser.openBrowserAsync(payment.checkoutUrl);
          verifyStatus(true);
        }
      }
    } catch (error) {
      showToast('Không thể tạo lại liên kết thanh toán', 'error');
    } finally {
      setChecking(false);
    }
  };

  if (loading || checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={T.color.primary} />
        <Text style={styles.loadingText}>Đang cập nhật trạng thái đặt bàn...</Text>
      </View>
    );
  }

  const isSuccess = paymentStatus === 'paid' || paymentStatus === 'no_deposit';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isSuccess ? (
          <>
            <View style={styles.iconContainer}>
              <FontAwesome name="check-circle" size={80} color={T.color.success} />
            </View>
            <Text style={[typography.displaySM, styles.title]}>Đặt bàn thành công! 🎉</Text>
            <Text style={styles.subtitle}>
              Yêu cầu đặt bàn của bạn tại <Text style={styles.highlight}>{restaurantName}</Text> đã được ghi nhận.
            </Text>
            <View style={styles.detailBox}>
              <Text style={styles.detailText}>
                Mã đặt bàn: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>#{bookingId?.slice(-6).toUpperCase()}</Text>
              </Text>
              <Text style={styles.detailText}>
                Trạng thái cọc: <Text style={{ color: T.color.success, fontWeight: '700' }}>ĐÃ HOÀN TẤT</Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.iconContainer, styles.warningIconContainer]}>
              <FontAwesome name="exclamation-circle" size={80} color={T.color.primary} />
            </View>
            <Text style={[typography.displaySM, styles.title]}>Chưa hoàn tất đặt cọc ⚠️</Text>
            <Text style={styles.subtitle}>
              Giao dịch thanh toán tiền cọc cho bàn của bạn chưa được ghi nhận thành công.
            </Text>
            <View style={styles.detailBox}>
              <Text style={styles.detailText}>
                Trạng thái: <Text style={{ color: T.color.primary, fontWeight: '700' }}>ĐANG CHỜ THANH TOÁN</Text>
              </Text>
              <Text style={styles.detailSub}>
                Nhà hàng chỉ có thể duyệt và giữ chỗ sau khi bạn hoàn tất đặt cọc.
              </Text>
            </View>
          </>
        )}

        <View style={styles.btnGroup}>
          {!isSuccess && (
            <Button
              label="Thử thanh toán lại"
              onPress={handleRetryPayment}
              style={styles.btn}
            />
          )}
          {orderCode && !isSuccess && (
            <Button
              label="Kiểm tra lại giao dịch"
              variant="secondary"
              onPress={() => verifyStatus(true)}
              style={styles.btn}
            />
          )}
          <Button
            label={isSuccess ? "Quay lại trang chủ" : "Về trang chủ"}
            variant={isSuccess ? "primary" : "secondary"}
            onPress={() => router.replace('/(tabs)')}
            style={styles.btn}
          />
        </View>
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
  content: {
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    color: T.color.text3,
    fontSize: 14,
    marginTop: T.space.md,
  },
  iconContainer: {
    marginBottom: T.space.xl,
  },
  warningIconContainer: {
    transform: [{ scale: 0.95 }],
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: T.space.md,
  },
  subtitle: {
    color: T.color.text2,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: T.space.md,
    marginBottom: T.space.xl,
  },
  highlight: {
    color: T.color.primary,
    fontWeight: '600',
  },
  detailBox: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    width: '100%',
    marginBottom: T.space['2xl'],
    gap: 8,
  },
  detailText: {
    color: T.color.text2,
    fontSize: 14,
    textAlign: 'center',
  },
  detailSub: {
    color: T.color.text3,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  btnGroup: {
    width: '100%',
    gap: 12,
  },
  btn: {
    width: '100%',
  },
});
