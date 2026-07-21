import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { bookingApi } from '@/src/api/booking.api';
import { CancellationPreview } from '@/src/types/booking.types';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency } from '@/src/utils/format';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

const REASONS = [
  'Thay đổi kế hoạch',
  'Tìm thấy nhà hàng khác phù hợp hơn',
  'Có việc đột xuất',
  'Thời tiết không thuận lợi',
  'Lý do khác',
];

export default function CancelBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Nhà hàng BookEat');
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [bookingRes, previewRes] = await Promise.all([
        bookingApi.getById(id),
        bookingApi.getCancellationPreview(id),
      ]);
      if (bookingRes.success && bookingRes.data) {
        setRestaurantName(bookingRes.data.restaurant?.name || 'Nhà hàng BookEat');
      }
      setPreview(previewRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải chính sách hủy lúc này.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!id || !preview?.canCancel || submitting || !acknowledged) return;
    const finalReason = reason === 'Lý do khác' ? customReason.trim() : reason;
    if (!finalReason) {
      showToast('Vui lòng nhập lý do hủy đặt bàn', 'info');
      return;
    }
    setSubmitting(true);
    try {
      const response = await bookingApi.cancelBooking(id, finalReason);
      const result = response.data;
      showToast(
        result.refundAmount > 0
          ? `Đã hoàn ${formatCurrency(result.refundAmount)} vào Ví BookEat`
          : 'Đã hủy đặt bàn thành công',
        'success',
      );
      router.replace(`/booking/${id}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể hủy đặt bàn', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={T.color.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backButton} />
        <Text style={[typography.titleSM, styles.title]}>Hủy đặt bàn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error || !preview ? (
          <View style={styles.stateCard}>
            <FontAwesome name="exclamation-circle" size={28} color={T.color.error} />
            <Text style={styles.stateTitle}>Chưa thể kiểm tra phí hủy</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Button label="Thử lại" variant="outline" size="md" onPress={load} />
          </View>
        ) : (
          <>
            <View style={[styles.notice, !preview.canCancel && styles.closedNotice]}>
              <FontAwesome name={preview.canCancel ? 'info-circle' : 'ban'} size={20} color={preview.canCancel ? T.color.primary : T.color.error} />
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>{restaurantName}</Text>
                <Text style={styles.noticeText}>{preview.message}</Text>
              </View>
            </View>

            <View style={styles.moneyCard}>
              <Text style={styles.eyebrow}>QUYẾT TOÁN KHI HỦY</Text>
              <MoneyRow label="Tiền cọc đã thanh toán" value={preview.depositPaid} />
              <MoneyRow label={`Phí hủy (${preview.cancellationFeeRateBasisPoints / 100}%)`} value={preview.cancellationFeeAmount} negative />
              <View style={styles.divider} />
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Hoàn vào Ví BookEat</Text>
                <Text style={styles.refundValue}>{formatCurrency(preview.refundAmount)}</Text>
              </View>
              <Text style={styles.serverNote}>Số tiền do hệ thống BookEat tính tại thời điểm hiện tại.</Text>
            </View>

            {preview.canCancel && (
              <>
                <Text style={styles.sectionTitle}>Lý do hủy</Text>
                <View style={styles.reasonList}>
                  {REASONS.map((item) => (
                    <Pressable key={item} onPress={() => setReason(item)} style={[styles.reason, reason === item && styles.reasonActive]}>
                      <FontAwesome name={reason === item ? 'dot-circle-o' : 'circle-o'} size={18} color={reason === item ? T.color.primary : T.color.text3} />
                      <Text style={[styles.reasonText, reason === item && styles.reasonTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                {reason === 'Lý do khác' && (
                  <TextInput
                    style={styles.input}
                    value={customReason}
                    onChangeText={setCustomReason}
                    placeholder="Nhập lý do cụ thể"
                    placeholderTextColor={T.color.placeholder}
                    multiline
                  />
                )}
                <Pressable onPress={() => setAcknowledged((value) => !value)} style={styles.acknowledgement}>
                  <FontAwesome name={acknowledged ? 'check-square' : 'square-o'} size={21} color={acknowledged ? T.color.primary : T.color.text3} />
                  <Text style={styles.acknowledgementText}>Tôi đã xem và đồng ý với phí hủy, số tiền hoàn vào Ví BookEat nêu trên.</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>

      {preview?.canCancel && !error && (
        <View style={styles.bottomBar}>
          <Button
            label={submitting ? 'Đang hủy...' : 'Xác nhận hủy đặt bàn'}
            variant={submitting ? 'loading' : acknowledged ? 'destructive' : 'disabled'}
            onPress={submit}
          />
        </View>
      )}
    </View>
  );
}

function MoneyRow({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  return <View style={styles.moneyRow}><Text style={styles.moneyLabel}>{label}</Text><Text style={negative && value > 0 ? styles.feeValue : styles.moneyValue}>{negative && value > 0 ? '-' : ''}{formatCurrency(value)}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  center: { flex: 1, backgroundColor: T.color.bg, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 60, paddingHorizontal: T.space.lg, paddingBottom: T.space.md, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.color.border },
  backButton: { marginRight: T.space.md },
  title: { color: T.color.text1, fontWeight: '700' },
  content: { padding: T.space.lg, paddingBottom: 130, gap: T.space.lg },
  notice: { flexDirection: 'row', gap: T.space.md, padding: T.space.lg, borderRadius: T.radius.lg, borderWidth: 1, borderColor: 'rgba(212,150,83,0.28)', backgroundColor: 'rgba(212,150,83,0.08)' },
  closedNotice: { borderColor: 'rgba(244,63,94,0.28)', backgroundColor: 'rgba(244,63,94,0.07)' },
  noticeCopy: { flex: 1 }, noticeTitle: { color: T.color.text1, fontSize: 15, fontWeight: '700', marginBottom: 5 }, noticeText: { color: T.color.text2, fontSize: 13, lineHeight: 19 },
  moneyCard: { borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.color.border, backgroundColor: T.color.card, padding: T.space.lg, gap: T.space.md },
  eyebrow: { color: T.color.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: T.space.md }, moneyLabel: { flex: 1, color: T.color.text2, fontSize: 13 }, moneyValue: { color: T.color.text1, fontSize: 13, fontWeight: '700' }, feeValue: { color: T.color.error, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: T.color.border }, refundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: T.space.md }, refundLabel: { color: T.color.text1, fontWeight: '700' }, refundValue: { color: T.color.success, fontSize: 21, fontWeight: '800' }, serverNote: { color: T.color.text3, fontSize: 11, lineHeight: 16 },
  sectionTitle: { color: T.color.text1, fontSize: 16, fontWeight: '700' }, reasonList: { gap: T.space.sm }, reason: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: T.space.md, paddingHorizontal: T.space.md, borderRadius: T.radius.md, borderWidth: 1, borderColor: T.color.border, backgroundColor: T.color.card }, reasonActive: { borderColor: 'rgba(212,150,83,0.5)', backgroundColor: 'rgba(212,150,83,0.08)' }, reasonText: { flex: 1, color: T.color.text2, fontSize: 13 }, reasonTextActive: { color: T.color.text1, fontWeight: '600' },
  input: { minHeight: 90, color: T.color.text1, backgroundColor: T.color.card, borderWidth: 1, borderColor: T.color.border, borderRadius: T.radius.md, padding: T.space.md, textAlignVertical: 'top' },
  acknowledgement: { flexDirection: 'row', gap: T.space.md, alignItems: 'flex-start', paddingVertical: T.space.sm }, acknowledgementText: { flex: 1, color: T.color.text2, fontSize: 13, lineHeight: 19 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: T.space.lg, paddingTop: T.space.md, paddingBottom: T.space.lg, backgroundColor: T.color.bg, borderTopWidth: 1, borderTopColor: T.color.border },
  stateCard: { alignItems: 'center', gap: T.space.md, padding: T.space.xl, borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.color.border, backgroundColor: T.color.card }, stateTitle: { color: T.color.text1, fontWeight: '700', fontSize: 16 }, stateText: { color: T.color.text2, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
