import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator, Alert,
  Pressable, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { bookingApi } from '@/src/api/booking.api';
import { formatDate } from '@/src/utils/format';

// QR code via SVG generation (inline approach without native lib)
function QRPlaceholder({ value }: { value: string }) {
  return (
    <View style={styles.qrBox}>
      <View style={styles.qrMockGrid}>
        {/* Mock QR visual using nested views */}
        {Array.from({ length: 7 }).map((_, r) => (
          <View key={r} style={styles.qrRow}>
            {Array.from({ length: 7 }).map((__, c) => {
              const isCorner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
              const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
              return (
                <View
                  key={c}
                  style={[
                    styles.qrCell,
                    (isCorner || (isBorder && !isCorner)) && styles.qrCellDark,
                    isCorner && styles.qrCellCorner,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.qrValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function QRCheckinScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await bookingApi.getById(bookingId);
      if (res.success && res.data) setBooking(res.data.booking || res.data);
    } catch (e) {
      console.warn('Lỗi tải QR check-in:', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({ message: `Mã đặt bàn BookEat: ${booking.id || bookingId}` });
    } catch (_) {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const qrValue = booking?.qrCode || booking?.id || bookingId || 'BOOKING_QR';
  const restName = booking?.restaurant?.name || 'Nhà hàng';
  const date = booking?.bookingDate ? formatDate(booking.bookingDate) : '—';
  const time = booking?.bookingTime || '—';
  const tables = Array.isArray(booking?.tableNumbers)
    ? booking.tableNumbers.join(', ')
    : (booking?.tableNumbers || '—');
  const guests = booking?.numberOfGuests || '—';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.headerTitle]}>QR Check-in</Text>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <FontAwesome name="share-alt" size={18} color={T.color.text2} />
        </Pressable>
      </View>

      <Animated.ScrollView
        entering={FadeIn}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* QR Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrHeaderTitle}>🍽️ BookEat</Text>
            <Text style={styles.qrHeaderSub}>Xuất trình mã QR này cho nhân viên nhà hàng</Text>
          </View>

          <QRPlaceholder value={qrValue} />

          <View style={styles.qrDivider} />

          {/* Booking Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <FontAwesome name="home" size={14} color={T.color.primary} />
              <Text style={styles.infoLabel}>Nhà hàng</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{restName}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="calendar" size={14} color={T.color.primary} />
              <Text style={styles.infoLabel}>Ngày</Text>
              <Text style={styles.infoVal}>{date}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="clock-o" size={14} color={T.color.primary} />
              <Text style={styles.infoLabel}>Giờ</Text>
              <Text style={styles.infoVal}>{time}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="cutlery" size={14} color={T.color.primary} />
              <Text style={styles.infoLabel}>Bàn</Text>
              <Text style={styles.infoVal}>#{tables}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="users" size={14} color={T.color.primary} />
              <Text style={styles.infoLabel}>Khách</Text>
              <Text style={styles.infoVal}>{guests} người</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <FontAwesome name="info-circle" size={16} color={T.color.primary} />
          <Text style={styles.noteText}>
            Mã QR có hiệu lực trong ngày đặt bàn. Nhân viên sẽ quét mã để xác nhận check-in của bạn.
          </Text>
        </View>

        {/* Status Badge */}
        {booking?.status && (
          <View style={[
            styles.statusRow,
            booking.status === 'confirmed' && styles.statusConfirmed,
            booking.status === 'checked_in' && styles.statusCheckedIn,
          ]}>
            <FontAwesome
              name={booking.status === 'checked_in' ? 'check-circle' : 'circle-o'}
              size={16}
              color={booking.status === 'checked_in' ? T.color.success : T.color.primary}
            />
            <Text style={styles.statusText}>
              {booking.status === 'checked_in'
                ? 'Đã check-in thành công'
                : booking.status === 'confirmed'
                ? 'Đặt bàn đã được xác nhận — Chưa check-in'
                : booking.status}
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  loadingContainer: { flex: 1, backgroundColor: T.color.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
  },
  headerTitle: { color: T.color.text1 },
  shareBtn: { width: 40, alignItems: 'flex-end' },
  scroll: { padding: T.space.base, paddingBottom: 40 },

  // QR Card
  qrCard: {
    backgroundColor: '#FFFFFF', borderRadius: T.radius.xl,
    padding: T.space.xl, marginBottom: T.space.lg,
    alignItems: 'center',
  },
  qrHeader: { alignItems: 'center', marginBottom: T.space.lg },
  qrHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#0C0F16', letterSpacing: 1 },
  qrHeaderSub: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // QR Mock
  qrBox: { alignItems: 'center', marginBottom: T.space.lg },
  qrMockGrid: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8 },
  qrRow: { flexDirection: 'row' },
  qrCell: { width: 18, height: 18, margin: 1, backgroundColor: '#E5E7EB', borderRadius: 2 },
  qrCellDark: { backgroundColor: '#1F2937' },
  qrCellCorner: { backgroundColor: '#0C0F16' },
  qrValue: { fontSize: 10, color: '#9CA3AF', marginTop: 8, letterSpacing: 2 },

  qrDivider: {
    width: '100%', height: 1, backgroundColor: '#E5E7EB',
    marginVertical: T.space.md,
    borderStyle: 'dashed',
  },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: T.space.md,
    justifyContent: 'space-between', width: '100%',
  },
  infoItem: { alignItems: 'center', minWidth: '28%', gap: 4 },
  infoLabel: { fontSize: 11, color: '#9CA3AF' },
  infoVal: { fontSize: 13, fontWeight: '700', color: '#0C0F16', textAlign: 'center' },

  noteCard: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'flex-start',
    backgroundColor: 'rgba(212,150,83,0.1)', borderRadius: T.radius.lg,
    padding: T.space.md, marginBottom: T.space.md,
    borderWidth: 1, borderColor: 'rgba(212,150,83,0.2)',
  },
  noteText: { flex: 1, color: T.color.text2, fontSize: 13, lineHeight: 20 },

  statusRow: {
    flexDirection: 'row', gap: T.space.sm, alignItems: 'center',
    backgroundColor: T.color.card, borderRadius: T.radius.lg,
    padding: T.space.md, borderWidth: 1, borderColor: T.color.border,
  },
  statusConfirmed: { borderColor: `${T.color.primary}44` },
  statusCheckedIn: { borderColor: `${T.color.success}44`, backgroundColor: 'rgba(16,185,129,0.08)' },
  statusText: { color: T.color.text1, fontSize: 13, fontWeight: '600' },
});
