import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { bookingApi } from '@/src/api/booking.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function CancelBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  
  // Selection states
  const [selectedReason, setSelectedReason] = useState('Thay đổi kế hoạch');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const predefinedReasons = [
    'Thay đổi kế hoạch',
    'Tìm thấy quán khác thích hợp hơn',
    'Bận việc đột xuất',
    'Thời tiết không thuận lợi',
    'Lý do cá nhân khác',
  ];

  const loadBookingInfo = useCallback(async () => {
    if (!id) return;
    try {
      const res = await bookingApi.getById(id);
      if (res.success && res.data) {
        setRestaurantName(res.data.restaurant?.name || 'Nhà hàng BookEat');
      }
    } catch (error) {
      console.warn('Lỗi tải thông tin đặt bàn để hủy:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookingInfo();
  }, [loadBookingInfo]);

  const handleCancelBooking = async () => {
    if (!id) return;
    
    const finalReason = selectedReason === 'Lý do cá nhân khác' 
      ? (customReason.trim() || 'Lý do cá nhân khác')
      : selectedReason;

    setSubmitting(true);
    try {
      const res = await bookingApi.cancelBooking(id, finalReason);
      if (res.success) {
        showToast('Hủy cuộc hẹn đặt bàn thành công', 'success');
        
        // Navigate back to Bookings tab
        router.replace('/(tabs)/bookings');
      } else {
        showToast(res.message || 'Hủy cuộc hẹn thất bại', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi hủy đặt bàn';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Hủy đặt bàn</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.warningBox}>
          <FontAwesome name="exclamation-triangle" size={24} color={T.color.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
          <Text style={styles.warningText}>
            Yêu cầu hủy bàn tại <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{restaurantName}</Text> sẽ được thực hiện ngay lập tức. Tiền đặt cọc (nếu có) sẽ được hoàn lại tự động theo chính sách hoàn tiền của nhà hàng.
          </Text>
        </View>

        <Text style={[typography.titleSM, styles.sectionTitle]}>Vui lòng chọn lý do hủy đặt bàn</Text>
        
        <View style={styles.reasonsGrid}>
          {predefinedReasons.map((reason) => (
            <Chip
              key={reason}
              label={reason}
              active={selectedReason === reason}
              onPress={() => setSelectedReason(reason)}
              style={styles.reasonChip}
            />
          ))}
        </View>

        {selectedReason === 'Lý do cá nhân khác' && (
          <View style={styles.customReasonBox}>
            <Text style={styles.fieldLabel}>Chi tiết lý do khác</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lý do chi tiết của bạn tại đây..."
              placeholderTextColor={T.color.placeholder}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <Button
          label="Xác nhận hủy đặt bàn"
          variant={submitting ? 'loading' : 'destructive'}
          onPress={handleCancelBooking}
          style={styles.confirmBtn}
        />
        <Button
          label="Quay lại"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.cancelBtn}
        />
      </View>
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
    paddingBottom: 150,
  },
  warningBox: {
    backgroundColor: 'rgba(212, 150, 83, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    margin: T.space.lg,
    alignItems: 'center',
  },
  warningTitle: {
    color: T.color.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    paddingHorizontal: T.space.lg,
    marginTop: T.space.md,
    marginBottom: T.space.md,
  },
  reasonsGrid: {
    paddingHorizontal: T.space.lg,
    gap: 10,
  },
  reasonChip: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  customReasonBox: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.lg,
  },
  fieldLabel: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: T.space.xs,
  },
  input: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C0F16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: T.space.lg,
    gap: 10,
  },
  confirmBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
