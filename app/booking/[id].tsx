import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Image, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { bookingApi } from '@/src/api/booking.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking.types';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);

  const loadBookingDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bookingApi.getById(id);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        showToast('Không tìm thấy thông tin cuộc hẹn', 'error');
      }
    } catch (error) {
      console.warn('Lỗi tải chi tiết cuộc hẹn:', error);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadBookingDetail();
  }, [loadBookingDetail]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin đặt bàn</Text>
        <Button label="Quay lại" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const restInfo = (booking as any).restaurant || {};

  // Check if booking is in the future and can be cancelled
  const canCancel = () => {
    if (!['pending', 'confirmed'].includes(booking.status)) return false;
    const now = new Date();
    const bDate = new Date(booking.bookingDate);
    // Combine date and time
    const [h, m] = booking.bookingTime.split(':').map(Number);
    bDate.setHours(h, m, 0, 0);
    return bDate > now;
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>
            Chi tiết đặt bàn #{booking.id.slice(-6).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Restaurant Header Section ─── */}
        <View style={styles.restaurantSection}>
          <Image
            source={{ uri: restInfo.primaryImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500' }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.restInfoBox}>
            <Text style={styles.restName}>{restInfo.name || 'Nhà hàng BookEat'}</Text>
            <Text style={styles.restPhone}>
              <FontAwesome name="phone" size={12} color={T.color.text3} /> {restInfo.phoneNumber || 'Không có số điện thoại'}
            </Text>
            <Text style={styles.restAddress}>
              <FontAwesome name="map-marker" size={12} color={T.color.text3} />{' '}
              {restInfo.address ? `${restInfo.address.street}, ${restInfo.address.ward}, ${restInfo.address.district}, ${restInfo.address.city}` : 'Địa chỉ đang cập nhật'}
            </Text>
          </View>
        </View>

        {/* ─── Timeline Status History ─── */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Trạng thái hiện tại:</Text>
            <StatusBadge status={booking.status} />
          </View>

          {/* Simple step display */}
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.stepDot, { backgroundColor: T.color.success }]} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Đã gửi yêu cầu</Text>
                <Text style={styles.stepTime}>{formatDate(booking.createdAt)}</Text>
              </View>
            </View>

            {booking.status !== 'cancelled' && (
              <>
                <View style={[styles.timelineLine, booking.status !== 'pending' && { backgroundColor: T.color.success }]} />
                <View style={styles.timelineStep}>
                  <View
                    style={[
                      styles.stepDot,
                      ['confirmed', 'completed'].includes(booking.status) && { backgroundColor: T.color.success },
                    ]}
                  />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Nhà hàng xác nhận</Text>
                    {booking.status !== 'pending' && <Text style={styles.stepSub}>Đã phê duyệt</Text>}
                  </View>
                </View>

                <View style={[styles.timelineLine, booking.status === 'completed' && { backgroundColor: T.color.success }]} />
                <View style={styles.timelineStep}>
                  <View style={[styles.stepDot, booking.status === 'completed' && { backgroundColor: T.color.success }]} />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Đã hoàn thành</Text>
                    {booking.status === 'completed' && <Text style={styles.stepSub}>Chúc mừng bữa ăn ngon miệng!</Text>}
                  </View>
                </View>
              </>
            )}

            {booking.status === 'cancelled' && (
              <>
                <View style={[styles.timelineLine, { backgroundColor: T.color.error }]} />
                <View style={styles.timelineStep}>
                  <View style={[styles.stepDot, { backgroundColor: T.color.error }]} />
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: T.color.error }]}>Đã hủy cuộc hẹn</Text>
                    <Text style={styles.stepSub}>Lý do: {booking.specialRequests || 'Khách hàng yêu cầu hủy'}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ─── Appointment Details ─── */}
        <View style={styles.detailsBox}>
          <Text style={styles.sectionTitle}>Chi tiết lịch hẹn</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Ngày đặt bàn</Text>
              <Text style={styles.detailVal}>{formatDate(booking.bookingDate)}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Giờ đến</Text>
              <Text style={styles.detailVal}>{booking.bookingTime}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Số khách</Text>
              <Text style={styles.detailVal}>{booking.numberOfGuests} người</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Bàn số</Text>
              <Text style={styles.detailVal}>{booking.tableNumbers.join(', ')}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Tên khách hàng</Text>
              <Text style={styles.detailVal}>{booking.customerName}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Số điện thoại</Text>
              <Text style={styles.detailVal}>{booking.customerPhone}</Text>
            </View>
          </View>

          {booking.specialRequests && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Ghi chú khách hàng:</Text>
              <Text style={styles.noteText}>{booking.specialRequests}</Text>
            </View>
          )}
        </View>

        {/* ─── Pre-orders list ─── */}
        {booking.preOrderItems && booking.preOrderItems.length > 0 && (
          <View style={styles.detailsBox}>
            <Text style={styles.sectionTitle}>Món ăn đặt trước</Text>
            {booking.preOrderItems.map((item: any, index: number) => (
              <View key={index} style={styles.foodRow}>
                <Text style={styles.foodName}>
                  {item.nameSnapshot} <Text style={styles.foodQty}>x{item.quantity}</Text>
                </Text>
                <Text style={styles.foodPrice}>{formatCurrency(item.priceSnapshot * item.quantity)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── Invoice details ─── */}
        <View style={styles.detailsBox}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán cọc</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tiền cọc bàn</Text>
            <Text style={styles.billVal}>{formatCurrency(booking.originalAmount)}</Text>
          </View>
          {booking.discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: T.color.primary }]}>Giảm giá Voucher</Text>
              <Text style={[styles.billVal, { color: T.color.primary }]}>-{formatCurrency(booking.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { fontWeight: '700', color: '#FFFFFF' }]}>Tổng tiền cọc</Text>
            <Text style={styles.billTotal}>{formatCurrency(booking.finalAmount)}</Text>
          </View>
          <View style={styles.paymentStatusBox}>
            <FontAwesome
              name={booking.depositPaid ? 'check-circle' : 'exclamation-circle'}
              size={14}
              color={booking.depositPaid ? T.color.success : T.color.primary}
            />
            <Text style={[styles.paymentStatusText, { color: booking.depositPaid ? T.color.success : T.color.primary }]}>
              {booking.depositPaid ? 'Đã hoàn tất đặt cọc' : 'Chưa đặt cọc / Chờ thanh toán'}
            </Text>
          </View>
        </View>

        {/* ─── Actions Button ─── */}
        <View style={styles.actionContainer}>
          {canCancel() && (
            <Button
              label="Hủy đặt bàn"
              variant="destructive"
              onPress={() => router.push(`/booking-cancel/${booking.id}`)}
              style={styles.cancelBtn}
            />
          )}

          {booking.status === 'completed' && !booking.reviewed && (
            <Button
              label="Đánh giá bữa ăn ⭐"
              onPress={() => router.push({
                pathname: '/review/write',
                params: {
                  bookingId: booking.id,
                  restaurantId: typeof booking.restaurantId === 'object' ? (booking.restaurantId as any).id || (booking.restaurantId as any)._id : booking.restaurantId,
                  restaurantName: restInfo.name || 'Nhà hàng',
                }
              })}
              style={styles.reviewBtn}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  errorText: {
    color: T.color.error,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  backBtn: {
    marginRight: T.space.md,
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  restaurantSection: {
    backgroundColor: T.color.card,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  restInfoBox: {
    padding: T.space.lg,
  },
  restName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: T.space.xs,
  },
  restPhone: {
    color: T.color.text2,
    fontSize: 13,
    marginTop: 4,
  },
  restAddress: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  statusSection: {
    backgroundColor: T.color.card,
    marginHorizontal: T.space.lg,
    marginTop: T.space.lg,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.lg,
  },
  statusLabel: {
    color: T.color.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 2,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3A4255',
    marginTop: 4,
    marginRight: T.space.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  stepTime: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  stepSub: {
    color: T.color.success,
    fontSize: 11,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#3A4255',
    marginLeft: 4,
    marginVertical: 2,
    position: 'relative',
    zIndex: 1,
  },
  detailsBox: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    marginHorizontal: T.space.lg,
    marginTop: T.space.lg,
    padding: T.space.lg,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: T.space.md,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: T.color.text3,
    fontSize: 11,
    marginBottom: 4,
  },
  detailVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noteBox: {
    marginTop: T.space.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: T.space.sm,
    borderRadius: T.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  noteLabel: {
    color: T.color.text3,
    fontSize: 11,
    marginBottom: 2,
  },
  noteText: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.sm,
  },
  foodName: {
    color: T.color.text2,
    fontSize: 13,
  },
  foodQty: {
    color: T.color.primary,
    fontWeight: '600',
  },
  foodPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    color: T.color.text3,
    fontSize: 13,
  },
  billVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: T.space.md,
  },
  billTotal: {
    color: T.color.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  paymentStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: T.radius.md,
    padding: T.space.sm,
    marginTop: T.space.md,
    justifyContent: 'center',
    gap: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.xl,
  },
  cancelBtn: {
    width: '100%',
  },
  reviewBtn: {
    width: '100%',
  },
});
