import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { reviewApi } from '@/src/api/review.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function WriteReviewScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { bookingId, restaurantId, restaurantName } = useLocalSearchParams<{
    bookingId: string;
    restaurantId: string;
    restaurantName: string;
  }>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!bookingId || !restaurantId) return;
    if (!comment.trim()) {
      showToast('Vui lòng nhập nội dung đánh giá', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewApi.createReview({
        bookingId,
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
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Viết đánh giá</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtext}>
          Chia sẻ trải nghiệm của bạn tại <Text style={{ color: T.color.primary, fontWeight: '700' }}>{restaurantName || 'Nhà hàng'}</Text>
        </Text>

        {/* Star Rating Selector */}
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
          {rating === 5 ? 'Tuyệt vời! 😍' : rating === 4 ? 'Rất tốt! 😊' : rating === 3 ? 'Bình thường! 😐' : rating === 2 ? 'Tệ! 😞' : 'Quá tệ! 😡'}
        </Text>

        {/* Review Comments */}
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

      {/* ─── Action Footer ─── */}
      <View style={styles.bottomBar}>
        <Button
          label="Gửi đánh giá"
          variant={submitting ? 'loading' : 'primary'}
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
  subtext: {
    color: T.color.text2,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: T.space.xl,
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
