import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  ActivityIndicator, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { ReviewCard, Review } from '@/src/components/cards/ReviewCard';
import { reviewApi } from '@/src/api/review.api';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cao nhất', value: 'highest' },
  { label: 'Thấp nhất', value: 'lowest' },
];

const STAR_FILTERS = [0, 5, 4, 3, 2, 1];

export default function RestaurantReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [sort, setSort] = useState('newest');
  const [starFilter, setStarFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadReviews = useCallback(async (pg = 1, reset = false) => {
    if (!id) return;
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const [revRes, sumRes] = await Promise.all([
        reviewApi.getRestaurantReviews(id, { page: pg, limit: 10, sort }),
        pg === 1 ? reviewApi.getRatingSummary(id) : Promise.resolve(null),
      ]);
      const newReviews: Review[] = revRes?.data?.reviews || [];
      setReviews((prev) => (reset || pg === 1) ? newReviews : [...prev, ...newReviews]);
      setHasMore(newReviews.length === 10);
      if (sumRes?.data?.summary) setSummary(sumRes.data.summary);
    } catch (e) {
      console.warn('Lỗi tải đánh giá:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, sort]);

  useEffect(() => {
    setPage(1);
    loadReviews(1, true);
  }, [sort]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    loadReviews(next);
  };

  const avgRating = summary?.averageRating ?? 0;
  const totalReviews = summary?.totalReviews ?? reviews.length;

  const ratingBar = (star: number) => {
    const count = summary?.distribution?.[star] ?? 0;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <View key={star} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarStar}>{star}★</Text>
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item, i) => (item as any)._id || item.id || String(i)}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <ReviewCard review={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <BackButton onPress={() => router.back()} />
              <Text style={[typography.titleMD, styles.headerTitle]}>Đánh giá</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Rating Summary */}
            {summary && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FontAwesome
                        key={s}
                        name={s <= Math.round(avgRating) ? 'star' : 'star-o'}
                        size={16}
                        color={T.color.primary}
                      />
                    ))}
                  </View>
                  <Text style={styles.totalLabel}>{totalReviews} đánh giá</Text>
                </View>
                <View style={styles.summaryRight}>
                  {[5, 4, 3, 2, 1].map(ratingBar)}
                </View>
              </View>
            )}

            {/* Sort Tabs */}
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.sortChip, sort === o.value && styles.sortChipActive]}
                  onPress={() => setSort(o.value)}
                >
                  <Text style={[styles.sortLabel, sort === o.value && styles.sortLabelActive]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {loading && (
              <View style={styles.skeletonWrapper}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height={120} borderRadius={12} style={{ marginBottom: 12 }} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="star-o" title="Chưa có đánh giá" description="Hãy là người đầu tiên đánh giá nhà hàng này" />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={T.color.primary} style={{ marginVertical: 16 }} /> : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
  },
  headerTitle: { color: T.color.text1 },
  summaryCard: {
    flexDirection: 'row', backgroundColor: T.color.card,
    borderRadius: T.radius.xl, marginHorizontal: T.space.base,
    padding: T.space.base, marginBottom: T.space.md,
    borderWidth: 1, borderColor: T.color.border, gap: T.space.base,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  bigRating: {
    color: T.color.primary, fontSize: 40, fontWeight: '800',
    fontFamily: T.font.displayBlack, lineHeight: 48,
  },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalLabel: { color: T.color.text3, fontSize: 12 },
  summaryRight: { flex: 1, gap: 4, justifyContent: 'center' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBarStar: { color: T.color.text2, fontSize: 11, width: 20 },
  ratingBarTrack: {
    flex: 1, height: 6, backgroundColor: T.color.elevated,
    borderRadius: 3, overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', backgroundColor: T.color.primary, borderRadius: 3 },
  ratingBarCount: { color: T.color.text3, fontSize: 11, width: 20, textAlign: 'right' },
  sortRow: {
    flexDirection: 'row', gap: T.space.sm, paddingHorizontal: T.space.base,
    marginBottom: T.space.md,
  },
  sortChip: {
    paddingHorizontal: T.space.md, paddingVertical: 6,
    backgroundColor: T.color.card, borderRadius: T.radius.full,
    borderWidth: 1, borderColor: T.color.border,
  },
  sortChipActive: { backgroundColor: T.color.primary, borderColor: T.color.primary },
  sortLabel: { fontSize: 13, color: T.color.text2, fontWeight: '500' },
  sortLabelActive: { color: '#0C0F16', fontWeight: '700' },
  skeletonWrapper: { paddingHorizontal: T.space.base },
  list: { paddingBottom: 32 },
  reviewCard: { marginHorizontal: T.space.base, marginBottom: T.space.md },
});
