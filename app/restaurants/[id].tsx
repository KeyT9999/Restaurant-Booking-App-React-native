import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, FlatList, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { restaurantApi } from '@/src/api/restaurant.api';
import { reviewApi } from '@/src/api/review.api';
import { favoriteApi } from '@/src/api/favorite.api';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Restaurant, MenuItem } from '@/src/types/restaurant.types';
import { ReviewCard, Review } from '@/src/components/cards/ReviewCard';
import { BackButton } from '@/src/components/ui/BackButton';
import { FavButton } from '@/src/components/navigation/FavButton';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency, formatPriceRange } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestaurantDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [liked, setLiked] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [restRes, menuRes, reviewsRes, ratingRes] = await Promise.all([
        restaurantApi.getById(id).catch((e) => {
          console.warn('Lỗi tải thông tin cơ bản:', e.message);
          return null;
        }),
        restaurantApi.getMenu(id).catch((e) => {
          console.warn('Lỗi tải thực đơn:', e.message);
          return null;
        }),
        reviewApi.getRestaurantReviews(id).catch((e) => {
          console.warn('Lỗi tải đánh giá:', e.message);
          return null;
        }),
        reviewApi.getRatingSummary(id).catch((e) => {
          console.warn('Lỗi tải thống kê đánh giá:', e.message);
          return null;
        }),
      ]);

      if (restRes && restRes.success && restRes.data) {
        setRestaurant(restRes.data);
      }
      if (menuRes && menuRes.success && menuRes.data) {
        // Menu endpoint returns categories/menuItems
        setMenuItems(menuRes.data.menuItems || []);
      }
      if (reviewsRes && reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.reviews || []);
      }
      if (ratingRes && ratingRes.success && ratingRes.data) {
        setRatingSummary(ratingRes.data.summary || null);
      }

      // Check if liked if logged in
      if (isAuthenticated) {
        const favsRes = await favoriteApi.getFavoriteIds();
        if (favsRes.success && favsRes.data) {
          const ids: string[] = favsRes.data.ids || [];
          setLiked(ids.includes(id));
        }
      }
    } catch (error) {
      console.warn('Lỗi tải thông tin chi tiết nhà hàng:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để lưu yêu thích', 'info');
      router.push('/(auth)/login');
      return;
    }

    if (!id) return;

    try {
      if (liked) {
        const res = await favoriteApi.removeFavorite(id);
        if (res.success) {
          setLiked(false);
          showToast('Đã xóa khỏi danh sách yêu thích', 'info');
        }
      } else {
        const res = await favoriteApi.addFavorite(id);
        if (res.success) {
          setLiked(true);
          showToast('Đã thêm vào danh sách yêu thích ❤️', 'success');
        }
      }
    } catch (error) {
      showToast('Thao tác thất bại', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin nhà hàng</Text>
        <Button label="Quay lại" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Gallery slider images list
  const gallery = [restaurant.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'];
  if (restaurant.galleryImages) {
    gallery.push(...restaurant.galleryImages.filter((img) => img));
  }

  return (
    <View style={styles.container}>
      {/* ─── Header bar overlay ─── */}
      <View style={styles.headerBar}>
        <BackButton onPress={() => router.back()} />
        <FavButton liked={liked} onToggle={handleToggleFavorite} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Image Slider ─── */}
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={gallery}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.coverImage} resizeMode="cover" />
          )}
        />

        {/* ─── Info section ─── */}
        <View style={styles.infoWrapper}>
          <Text style={[typography.displayMD, styles.name]}>{restaurant.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <FontAwesome name="star" size={13} color={T.color.primary} />
              <Text style={styles.ratingValue}>{restaurant.stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({restaurant.stats.totalReviews} đánh giá)</Text>
            </View>
            <Text style={styles.priceText}>
              {formatPriceRange(restaurant.priceRangeMin, restaurant.priceRangeMax)}
            </Text>
          </View>

          <View style={styles.tagsContainer}>
            {restaurant.cuisineTypes.map((c) => (
              <View key={c} style={styles.tag}>
                <Text style={styles.tagText}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailItem}>
              <FontAwesome name="map-marker" size={15} color={T.color.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {restaurant.address.street}, {restaurant.address.ward}, {restaurant.address.district}, {restaurant.address.city}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <FontAwesome name="clock-o" size={15} color={T.color.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Mở cửa: {restaurant.operatingHours?.monday?.open || '09:00'} - {restaurant.operatingHours?.monday?.close || '22:00'}
              </Text>
            </View>

            {restaurant.phoneNumber && (
              <View style={styles.detailItem}>
                <FontAwesome name="phone" size={15} color={T.color.primary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{restaurant.phoneNumber}</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{restaurant.description}</Text>
        </View>

        {/* ─── Tab Switcher ─── */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('menu')}
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Thực đơn</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('reviews')}
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Đánh giá</Text>
          </Pressable>
        </View>

        {/* ─── Tab Content Render ─── */}
        <View style={styles.tabContent}>
          {activeTab === 'menu' ? (
            menuItems.length > 0 ? (
              menuItems.map((item) => (
                <View key={item.id} style={styles.menuItemCard}>
                  <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                    style={styles.menuItemImage}
                  />
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.menuItemPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState title="Chưa có thực đơn" description="Nhà hàng này chưa cập nhật món ăn." />
            )
          ) : (
            reviews.length > 0 ? (
              reviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
            ) : (
              <EmptyState icon="comment-o" title="Chưa có đánh giá" description="Hãy là người đầu tiên đặt bàn và gửi đánh giá!" />
            )
          )}
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom CTA Bar ─── */}
      <View style={styles.bottomBar}>
        {(restaurant.approvalStatus ?? 'approved') === 'approved' && (restaurant.active ?? true) ? (
          <View style={styles.ctaWrapper}>
            <Pressable
              onPress={() => router.push(`/chat/${id}`)}
              style={styles.chatIconBtn}
            >
              <FontAwesome name="comments-o" size={20} color={T.color.primary} />
            </Pressable>
            <Button
              label="Hàng chờ"
              variant="secondary"
              onPress={() => router.push({
                pathname: '/waitlist/join',
                params: { restaurantId: id, restaurantName: restaurant.name }
              })}
              style={styles.waitlistBtn}
            />
            <Button
              label="Đặt bàn"
              onPress={() => router.push({
                pathname: '/booking/create',
                params: { restaurantId: id }
              })}
              style={styles.bookingBtn}
            />
          </View>
        ) : (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableText}>Nhà hàng tạm ngưng phục vụ</Text>
          </View>
        )}
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
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    pointerEvents: 'box-none',
  },
  scrollContent: {
    paddingBottom: 120, // space for bottom sticky bar
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  infoWrapper: {
    padding: T.space.lg,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: T.font.display,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: T.space.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    color: T.color.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  reviewCount: {
    color: T.color.text3,
    fontSize: 12,
    marginLeft: 4,
  },
  priceText: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: T.space.lg,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '500',
  },
  detailList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: T.space.md,
    marginBottom: T.space.md,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: T.space.md,
    marginTop: 2,
    width: 16,
    textAlign: 'center',
  },
  detailText: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  description: {
    color: T.color.text2,
    fontSize: 14,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: T.space.lg,
  },
  tab: {
    paddingVertical: T.space.md,
    marginRight: T.space.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: T.color.primary,
  },
  tabText: {
    color: T.color.text3,
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: T.color.primary,
  },
  tabContent: {
    padding: T.space.lg,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginBottom: T.space.sm,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  menuItemImage: {
    width: 70,
    height: 70,
    borderRadius: T.radius.sm,
    marginRight: T.space.md,
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemName: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemDesc: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 2,
  },
  menuItemPrice: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : T.space.md, // handle iOS bottom home indicator safe area
  },
  ctaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatIconBtn: {
    width: 48,
    height: 48,
    borderRadius: T.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitlistBtn: {
    flex: 0.35,
  },
  bookingBtn: {
    flex: 0.65,
  },
  unavailableBox: {
    height: 52,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: T.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: T.color.error,
    fontWeight: '600',
    fontSize: 14,
  },
});
