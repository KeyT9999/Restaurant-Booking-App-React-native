import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { bookingApi } from '@/src/api/booking.api';
import { reviewApi } from '@/src/api/review.api';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Booking } from '@/src/types/booking.types';

const getRestaurantIdFromBooking = (booking: Booking) => {
  if (typeof booking.restaurantId === 'string') {
    return booking.restaurantId;
  }

  return booking.restaurantId?.id || null;
};

export default function WriteReviewScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { bookingId, restaurantId, restaurantName } = useLocalSearchParams<{
    bookingId?: string;
    restaurantId?: string;
    restaurantName?: string;
  }>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvedBookingId, setResolvedBookingId] = useState<string | null>(bookingId || null);
  const [resolvingBooking, setResolvingBooking] = useState(false);

  const effectiveBookingId = useMemo(() => bookingId || resolvedBookingId, [bookingId, resolvedBookingId]);

  useEffect(() => {
    const resolveBookingId = async () => {
      if (bookingId || !restaurantId) return;

      setResolvingBooking(true);
      try {
        const res = await bookingApi.getMyBookings({ filter: 'past', limit: 100 });
        const bookings: Booking[] = res?.data?.bookings || [];
        const matchedBooking = bookings.find((item) => {
          return item.status === 'completed' && !item.reviewed && getRestaurantIdFromBooking(item) === restaurantId;
        });

        if (matchedBooking) {
          setResolvedBookingId(matchedBooking.id);
          return;
        }

        showToast('Bạn cần hoàn thành một booking tại nhà hàng này trước khi viết đánh giá', 'info');
      } catch (error: any) {
        const msg = error?.response?.data?.message || 'Không thể kiểm tra booking phù hợp để đánh giá';
        showToast(msg, 'error');
      } finally {
        setResolvingBooking(false);
      }
    };

    resolveBookingId();
  }, [bookingId, restaurantId, showToast]);

  const handleSubmit = async () => {
    if (!effectiveBookingId || !restaurantId) {
      showToast('Bạn chưa có booking phù hợp để đánh giá nhà hàng này', 'info');
      return;
    }

    if (!comment.trim()) {
      showToast('Vui lòng nhập nội dung đánh giá', 'info');
      return;
    }

    if (comment.trim().length < 10) {
      showToast('Nội dung đánh giá phải có ít nhất 10 ký tự', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewApi.createReview({
        bookingId: effectiveBookingId,
        restaurantId,
        rating,
        comment: comment.trim(),
      });

      if (res.success) {
        showToast('Cảm ơn bạn đã gửi đánh giá! ⭐', 'success');
        router.back();
      } else {
        showToast(res.message || 'Gửi đánh giá thất bại', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Viết đánh giá</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {resolvingBooking ? (
          <View style={styles.resolvingBox}>
            <ActivityIndicator size="small" color={T.color.primary} />
            <Text style={styles.resolvingText}>Đang kiểm tra booking phù hợp để viết đánh giá...</Text>
          </View>
        ) : null}

        {!effectiveBookingId && !resolvingBooking ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Chưa thể viết đánh giá</Text>
            <Text style={styles.noticeText}>Bạn cần có một booking đã hoàn thành tại nhà hàng này và chưa đánh giá trước đó.</Text>
          </View>
        ) : null}

        <Text style={styles.subtext}>
          Chia sẻ trải nghiệm của bạn tại <Text style={styles.restaurantName}>{restaurantName || 'Nhà hàng'}</Text>
        </Text>

        <View style={styles.ratingBox}>
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            const active = starValue <= rating;
            return (
              <Pressable key={index} onPress={() => setRating(starValue)} style={styles.starBtn}>
                <FontAwesome name="star" size={32} color={active ? T.color.primary : '#3A4255'} />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt!' : rating === 3 ? 'Bình thường!' : rating === 2 ? 'Tệ!' : 'Quá tệ!'}
        </Text>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Nội dung đánh giá</Text>
          <TextInput
            style={styles.input}
            placeholder="Món ăn ngon không? Phục vụ thế nào? Không gian quán ra sao?..."
            placeholderTextColor={T.color.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label="Gửi đánh giá"
          variant={submitting ? 'loading' : !effectiveBookingId || resolvingBooking ? 'disabled' : 'primary'}
          onPress={handleSubmit}
          style={styles.submitBtn}
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
    paddingHorizontal: T.space.lg,
  },
  resolvingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.space.sm,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginTop: T.space.lg,
  },
  resolvingText: {
    color: T.color.text2,
    fontSize: 12,
  },
  noticeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginTop: T.space.lg,
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeText: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  subtext: {
    color: T.color.text2,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: T.space.xl,
  },
  restaurantName: {
    color: T.color.primary,
    fontWeight: '700',
  },
  ratingBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: T.space.sm,
  },
  starBtn: {
    padding: T.space.xs,
  },
  ratingLabel: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: T.space['2xl'],
  },
  inputBox: {
    width: '100%',
  },
  label: {
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
    minHeight: 120,
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
  },
  submitBtn: {
    width: '100%',
  },
});
