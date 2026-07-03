import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Pressable, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { recommendationApi } from '@/src/api/recommendation.api';
import { restaurantApi } from '@/src/api/restaurant.api';
import { notificationApi } from '@/src/api/notification.api';
import { useLocation } from '@/src/hooks/useLocation';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { RestaurantCard } from '@/src/components/cards/RestaurantCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Chip } from '@/src/components/ui/Chip';
import { Avatar } from '@/src/components/ui/Avatar';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { getGreeting } from '@/src/utils/greeting';
import { FontAwesome } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/restaurant.types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { location, requestLocation } = useLocation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<any>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('Tất cả');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async (coords?: { latitude: number; longitude: number } | null) => {
    try {
      const activeLocation = coords === undefined ? location : coords;
      const homeParams = activeLocation
        ? {
            lat: activeLocation.latitude,
            lng: activeLocation.longitude,
          }
        : undefined;

      const [recRes, cuisineRes] = await Promise.all([
        recommendationApi.getHome(homeParams),
        restaurantApi.getCuisineTypes(),
      ]);

      if (recRes.success && recRes.data) {
        setHomeData(recRes.data);
      }
      if (cuisineRes.success && cuisineRes.data) {
        // Lọc bớt các cuisine trống hoặc trùng lặp
        const list = ['Tất cả', ...cuisineRes.data.filter((c: string) => c)];
        setCuisines(list);
      }

      // Lấy số lượng thông báo chưa đọc nếu đã đăng nhập
      if (isAuthenticated) {
        const notifyRes = await notificationApi.getUnreadCount();
        if (notifyRes.success && notifyRes.data) {
          setUnreadCount(notifyRes.data.count || 0);
        }
      }
    } catch (error) {
      console.warn('Lỗi tải dữ liệu trang chủ:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, location]);

  useEffect(() => {
    requestLocation().catch(() => null);
  }, [requestLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    requestLocation()
      .then((coords) => {
        fetchData(coords);
      })
      .catch(() => {
        fetchData(null);
      });
  };

  // Lọc danh sách gợi ý theo Cuisine được chọn
  const getFilteredSuggestions = (): Restaurant[] => {
    if (!homeData) return [];
    // suggestions = popularRestaurants
    const list: Restaurant[] = homeData.popularRestaurants || [];
    if (selectedCuisine === 'Tất cả') return list;
    return list.filter((r) => r.cuisineTypes.includes(selectedCuisine));
  };

  const featuredRestaurants =
    homeData?.restaurantsForYou?.length > 0
      ? homeData.restaurantsForYou
      : homeData?.popularRestaurants || [];
  const suggestionRestaurants = getFilteredSuggestions();

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={[typography.titleLG, styles.username]}>
            {isAuthenticated && user ? user.fullName : 'Thực khách'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bellButton}>
            <FontAwesome name="bell-o" size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Avatar
            name={isAuthenticated && user ? user.fullName : 'Guest'}
            size={36}
            imageUri={user?.avatarUrl}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Fake Search Bar ─── */}
        <Pressable onPress={() => router.push('/search')} style={styles.searchBar}>
          <FontAwesome name="search" size={16} color={T.color.text3} style={styles.searchIcon} />
          <Text style={styles.searchText}>Tìm nhà hàng, món ăn, vị trí...</Text>
        </Pressable>

        {/* ─── Category Cuisine Chips ─── */}
        <View style={styles.cuisinesWrapper}>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cuisinesList}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} width={70} height={32} borderRadius={16} style={{ marginRight: 8 }} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cuisinesList}
            >
              {cuisines.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={selectedCuisine === item}
                  onPress={() => setSelectedCuisine(item)}
                  sm
                  style={styles.cuisineChip}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─── Featured Section (Restaurants For You) ─── */}
        <SectionHeader
          title="Dành riêng cho bạn"
          action="Xem thêm"
          onAction={() => router.push('/search')}
          style={styles.sectionHeader}
        />
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} width={260} height={160} borderRadius={16} style={{ marginRight: 16 }} />
            ))}
          </ScrollView>
        ) : featuredRestaurants.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featuredRestaurants.map((item: any, index: number) => {
              const rId = item.restaurantId || item.id || item._id || '';
              return (
                <RestaurantCard
                  key={rId || `featured-${index}`}
                  restaurant={item}
                  variant="featured"
                  onPress={() => router.push(`/restaurants/${rId}`)}
                  style={styles.featuredCard}
                />
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyFeatured}>
            <Text style={styles.emptyText}>Đăng nhập để nhận gợi ý cá nhân hóa</Text>
          </View>
        )}

        {/* ─── Voucher Banner ─── */}
        <Pressable onPress={() => router.push('/vouchers')} style={styles.voucherBanner}>
          <View style={styles.voucherContent}>
            <Text style={styles.voucherTitle}>Ưu đãi đặt bàn tối nay 🏷️</Text>
            <Text style={styles.voucherSubtitle}>Giảm đến 20% đặt cọc tại các nhà hàng nổi tiếng.</Text>
          </View>
          <FontAwesome name="angle-right" size={20} color={T.color.primary} />
        </Pressable>

        {/* ─── Suggestions Section ─── */}
        <SectionHeader title="Nhà hàng nổi bật" style={styles.sectionHeader} />
        <View style={styles.suggestionsList}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={100} borderRadius={16} style={{ marginBottom: 12 }} />
            ))
          ) : suggestionRestaurants.length > 0 ? (
            suggestionRestaurants.map((restaurant, index) => {
              const rId = (restaurant as any).restaurantId || restaurant.id || (restaurant as any)._id || '';
              return (
                <RestaurantCard
                  key={rId || index.toString()}
                  restaurant={restaurant}
                  variant="horizontal"
                  onPress={() => router.push(`/restaurants/${rId}`)}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy nhà hàng nào phù hợp</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── AI Chat FAB Button ─── */}
      <Pressable
        onPress={() => router.push('/ai-chat')}
        style={styles.aiFab}
      >
        <FontAwesome name="android" size={24} color="#0C0F16" />
      </Pressable>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: T.color.text3,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  username: {
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: T.color.error,
    borderRadius: 8,
    height: 16,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatar: {
    borderWidth: 1,
  },
  scrollContent: {
    paddingBottom: 100, // offset for tab bar height
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    height: 46,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginHorizontal: T.space.lg,
    marginTop: T.space.lg,
    paddingHorizontal: T.space.base,
  },
  searchIcon: {
    marginRight: T.space.sm,
  },
  searchText: {
    color: T.color.placeholder,
    fontSize: 14,
  },
  cuisinesWrapper: {
    marginVertical: T.space.lg,
  },
  cuisinesList: {
    paddingHorizontal: T.space.lg,
  },
  cuisineChip: {
    marginRight: T.space.sm,
  },
  sectionHeader: {
    paddingHorizontal: T.space.lg,
    marginBottom: T.space.sm,
  },
  featuredList: {
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
  },
  featuredCard: {
    marginRight: T.space.base,
  },
  emptyFeatured: {
    marginHorizontal: T.space.lg,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.lg,
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
  },
  voucherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    borderRadius: T.radius.lg,
    marginHorizontal: T.space.lg,
    marginVertical: T.space.xl,
    padding: T.space.base,
  },
  voucherContent: {
    flex: 1,
    marginRight: T.space.md,
  },
  voucherTitle: {
    color: T.color.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  voucherSubtitle: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  suggestionsList: {
    paddingHorizontal: T.space.lg,
  },
  emptyContainer: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
});
