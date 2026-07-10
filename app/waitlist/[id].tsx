import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, Pressable, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { waitlistApi } from '@/src/api/waitlist.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { formatDate } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

interface WaitlistDetail {
  id: string;
  restaurantId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  preferredDate: string;
  preferredTime: string;
  numberOfGuests: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  queuePositionSnapshot: number;
  estimatedWaitMinutes: number;
  maxWaitMinutes: number;
  restaurant?: {
    id: string;
    name: string;
    address?: any;
    phoneNumber?: string;
    logo?: string;
  };
}

export default function WaitlistStatusScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState<WaitlistDetail | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchWaitlistStatus = useCallback(async (showIndicator = false) => {
    if (!id) return;
    if (showIndicator) setLoading(true);

    try {
      const res = await waitlistApi.getWaitlistById(id);
      if (res.success && res.data?.waitlist) {
        setWaitlist(res.data.waitlist);
      }
    } catch (error) {
      console.warn('Lỗi tải thẻ chờ:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWaitlistStatus(true);
  }, [fetchWaitlistStatus]);

  // Poll waitlist status every 5 seconds
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      fetchWaitlistStatus(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchWaitlistStatus]);

  const handleLeaveWaitlist = () => {
    if (!id) return;

    Alert.alert(
      'Hủy xếp hàng',
      'Bạn có chắc chắn muốn hủy lượt xếp hàng này không?',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Hủy xếp hàng',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await waitlistApi.cancelWaitlist(id, 'Khách hàng chủ động hủy hàng chờ');
              if (res.success) {
                showToast('Đã hủy xếp hàng thành công', 'success');
                fetchWaitlistStatus(false);
              }
            } catch (err) {
              showToast('Hủy xếp hàng thất bại', 'error');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!waitlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin xếp hàng</Text>
        <Button label="Quay lại" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const restName = waitlist.restaurant?.name || 'Nhà hàng';
  const restAddr = waitlist.restaurant?.address
    ? `${waitlist.restaurant.address.street}, ${waitlist.restaurant.address.district}`
    : 'Địa chỉ đang cập nhật';

  const isPending = waitlist.status === 'pending';
  const isConfirmed = waitlist.status === 'confirmed';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleMD, styles.title]} numberOfLines={1}>Thẻ hàng chờ</Text>
        </View>
        {/* Chat with restaurant icon */}
        <TouchableOpacity
          style={styles.chatIconBtn}
          onPress={() => router.push(`/chat/${waitlist.restaurantId}`)}
        >
          <FontAwesome name="comments-o" size={20} color={T.color.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Giant Position Indicator */}
        <View style={styles.positionWrapper}>
          {isPending ? (
            <>
              <View style={styles.queueCircle}>
                <Text style={styles.queueLabel}>SỐ THỨ TỰ</Text>
                <Text style={styles.queueNumber}>#{waitlist.queuePositionSnapshot}</Text>
              </View>
              <Text style={styles.queueStatus}>Đang xếp hàng...</Text>
              <Text style={styles.queueSub}>
                Thời gian chờ dự kiến: <Text style={{ color: T.color.primary, fontWeight: '700' }}>~{waitlist.estimatedWaitMinutes} phút</Text>
              </Text>
            </>
          ) : isConfirmed ? (
            <>
              <View style={[styles.queueCircle, styles.queueCircleConfirmed]}>
                <FontAwesome name="check" size={36} color="#0C0F16" />
              </View>
              <Text style={[styles.queueStatus, { color: T.color.success }]}>BÀN CỦA BẠN ĐÃ SẴN SÀNG! 🎉</Text>
              <Text style={styles.queueSub}>Quý khách vui lòng liên hệ nhân viên nhà hàng để nhận bàn.</Text>
            </>
          ) : (
            <>
              <View style={[styles.queueCircle, styles.queueCircleCancelled]}>
                <FontAwesome name="times" size={36} color="#FFFFFF" />
              </View>
              <Text style={[styles.queueStatus, { color: T.color.text3 }]}>
                {waitlist.status === 'cancelled' ? 'ĐÃ HỦY LƯỢT CHỜ ✗' : 'LƯỢT CHỜ ĐÃ HẾT HẠN ⌛'}
              </Text>
            </>
          )}
        </View>

        {/* Timeline Indicator */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: T.color.success }]} />
            <Text style={styles.stepTextActive}>1. Đã đăng ký</Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: isConfirmed || !isPending ? T.color.success : T.color.border }]} />
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: isConfirmed ? T.color.success : isPending ? T.color.primary : T.color.border }]} />
            <Text style={isPending ? styles.stepTextActive : styles.stepText}>2. Đang đợi bàn</Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: isConfirmed ? T.color.success : T.color.border }]} />
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: isConfirmed ? T.color.success : T.color.border }]} />
            <Text style={isConfirmed ? styles.stepTextActive : styles.stepText}>3. Vào bàn</Text>
          </View>
        </View>

        {/* Ticket Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thông tin lượt chờ</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nhà hàng</Text>
            <Text style={styles.detailVal}>{restName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa chỉ</Text>
            <Text style={styles.detailVal} numberOfLines={1}>{restAddr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày đặt</Text>
            <Text style={styles.detailVal}>{formatDate(waitlist.preferredDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giờ mong muốn</Text>
            <Text style={styles.detailVal}>{waitlist.preferredTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số khách</Text>
            <Text style={styles.detailVal}>{waitlist.numberOfGuests} người</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Chờ tối đa</Text>
            <Text style={styles.detailVal}>{waitlist.maxWaitMinutes} phút</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tên khách</Text>
            <Text style={styles.detailVal}>{waitlist.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số điện thoại</Text>
            <Text style={styles.detailVal}>{waitlist.customerPhone}</Text>
          </View>
          {!!waitlist.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Ghi chú:</Text>
              <Text style={styles.noteText}>{waitlist.note}</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {isPending && (
          <View style={styles.btnWrapper}>
            <Button
              label="Hủy xếp hàng"
              variant={cancelling ? 'loading' : 'destructive'}
              onPress={handleLeaveWaitlist}
              style={styles.cancelBtn}
            />
          </View>
        )}
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
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
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
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  positionWrapper: {
    alignItems: 'center',
    marginVertical: 24,
  },
  queueCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: T.color.primary,
    backgroundColor: 'rgba(212, 150, 83, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  queueCircleConfirmed: {
    borderColor: T.color.success,
    backgroundColor: T.color.success,
  },
  queueCircleCancelled: {
    borderColor: '#3A4255',
    backgroundColor: '#3A4255',
  },
  queueLabel: {
    color: T.color.text3,
    fontSize: 9.5,
    fontWeight: '600',
  },
  queueNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  queueStatus: {
    color: T.color.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
  },
  queueSub: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 4,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.lg,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    color: T.color.text3,
    fontSize: 10.5,
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  stepLine: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.lg,
  },
  cardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: T.color.text3,
    fontSize: 12,
  },
  detailVal: {
    color: '#FFFFFF',
    fontSize: 12,
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
  },
  btnWrapper: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.md,
  },
  cancelBtn: {
    width: '100%',
  },
});
