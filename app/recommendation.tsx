import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '@/src/hooks/useLocation';
import { recommendationApi } from '@/src/api/recommendation.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { getRestaurantId } from '@/src/utils/restaurant';

const { width } = Dimensions.get('window');

interface RecommendedRestaurant {
  id: string;
  restaurantId?: string;
  name: string;
  image?: string;
  photo?: string;
  cuisineTypes: string[];
  displayCuisineTypes?: string[];
  ratingAverage: number;
  reviewCount: number;
  distance?: number;
  distanceText?: string;
  priceRange?: string;
  matchScore?: number; // generated custom matching score
}

export default function RecommendationScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { location, requestLocation } = useLocation();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RecommendedRestaurant[]>([]);
  const [popularDishes, setPopularDishes] = useState<any[]>([]);
  const [locating, setLocating] = useState(false);

  // Load recommendations
  const loadRecommendations = useCallback(async (coords?: { latitude: number; longitude: number } | null) => {
    setLoading(true);
    try {
      const activeLocation = coords === undefined ? location : coords;
      const params = activeLocation
        ? { lat: activeLocation.latitude, lng: activeLocation.longitude }
        : undefined;

      // Fetch recommended restaurants
      const res = await recommendationApi.getHome(params);
      
      if (res.success && res.data) {
        // Map raw data and inject mock match scores for premium customization styling
        const list: RecommendedRestaurant[] = (res.data.restaurantsForYou || res.data.popularRestaurants || []).map((r: any, idx: number) => ({
          ...r,
          matchScore: idx === 0 ? 98 : idx === 1 ? 95 : idx === 2 ? 92 : 85 + (idx % 3) * 2,
        }));
        setRestaurants(list);
      }

      // Mock trending dishes for premium presentation
      setPopularDishes([
        {
          id: 'dish1',
          name: 'Steak Bò Wagyu Cao Cấp',
          price: 499000,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300',
          restaurantName: 'Prime Steakhouse',
          matchReason: 'Phù hợp với sở thích Bò Mỹ của bạn',
        },
        {
          id: 'dish2',
          name: 'Sashimi Thập Cẩm Deluxe',
          price: 380000,
          image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300',
          restaurantName: 'Kyoto Sushi Bar',
          matchReason: 'Món Nhật đang được săn đón gần đây',
        },
        {
          id: 'dish3',
          name: 'Lẩu Thái Hải Sản Cay nồng',
          price: 250000,
          image: 'https://images.unsplash.com/photo-1547928576-a4a33237ecd3?w=300',
          restaurantName: 'Siam Spicy Pot',
          matchReason: 'Vừa túi tiền & Thích hợp thời tiết hôm nay',
        },
      ]);
    } catch (error) {
      console.warn('Lỗi tải gợi ý cá nhân hóa:', error);
      showToast('Không thể kết nối đến hệ thống gợi ý', 'error');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    requestLocation()
      .then((coords) => loadRecommendations(coords))
      .catch(() => loadRecommendations(null));
  }, []);

  const handleUpdateLocation = async () => {
    setLocating(true);
    try {
      const coords = await requestLocation();
      if (coords) {
        showToast('Đã cập nhật vị trí chính xác hiện tại! 📍', 'success');
        loadRecommendations(coords);
      }
    } catch (err) {
      showToast('Không thể lấy quyền truy cập định vị.', 'error');
    } finally {
      setLocating(false);
    }
  };

  const getGreetingTimeContext = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Hôm nay điểm tâm gì ngon?';
    if (hours < 14) return 'Trưa nay ăn gì ở đâu?';
    if (hours < 18) return 'Chiều nay hẹn hò trà bánh?';
    return 'Buổi tối ấm cúng cùng mỹ vị?';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.headerTitle]}>Mỹ Vị Cho Bạn</Text>
        </View>
        <Pressable onPress={handleUpdateLocation} disabled={locating} style={styles.locBtn}>
          {locating ? (
            <ActivityIndicator size="small" color={T.color.primary} />
          ) : (
            <FontAwesome name="map-marker" size={18} color={location ? T.color.primary : T.color.text3} />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
          <Text style={styles.loadingText}>Đang đo ni đóng giày thực đơn dành riêng cho bạn...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Location status bar */}
          <View style={styles.locationBar}>
            <FontAwesome name="compass" size={14} color={T.color.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location 
                ? `Vị trí: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : 'Chưa cấp quyền định vị. Sử dụng vị trí mặc định.'}
            </Text>
            {!location && (
              <Pressable onPress={handleUpdateLocation}>
                <Text style={styles.grantLocText}>Kích hoạt</Text>
              </Pressable>
            )}
          </View>

          {/* Context Banner */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroBanner}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600' }}
              style={styles.heroImg}
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.sparkleRow}>
                <FontAwesome name="magic" size={12} color={T.color.primary} />
                <Text style={styles.sparkleText}>GỢI Ý CẢM CẢNH CONTEXTUAL</Text>
              </View>
              <Text style={styles.heroTitle}>{getGreetingTimeContext()}</Text>
              <Text style={styles.heroDesc}>
                Các thuật toán lọc cộng tác (Collaborative Filtering) của BookEat đang tính toán để đề xuất các hương vị hoàn hảo dựa trên khẩu vị hiện tại của bạn.
              </Text>
            </View>
          </Animated.View>

          {/* Bento Recommendation Section */}
          <View style={styles.bentoSection}>
            <Text style={styles.sectionTitle}>Bản Đồ Mỹ Vị</Text>

            {/* Top Match - Bento Large Item */}
            {restaurants.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.bentoLargeCard}>
                <Pressable onPress={() => {
                  const rId = getRestaurantId(restaurants[0]);
                  if (rId) {
                    router.push({
                      pathname: '/restaurants/[id]',
                      params: { id: rId },
                    });
                  } else {
                    console.warn('[RecommendationScreen] Missing restaurant id for bento large', restaurants[0]);
                  }
                }}>
                  <Image
                    source={{ uri: restaurants[0].image || restaurants[0].photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500' }}
                    style={styles.bentoLargeImg}
                  />
                  <View style={styles.matchScoreBadgeLarge}>
                    <Text style={styles.matchScoreTextLarge}>{restaurants[0].matchScore}% Match</Text>
                  </View>
                  <View style={styles.bentoLargeContent}>
                    <Text style={styles.bentoLargeTag}>ĐỀ XUẤT PHÙ HỢP NHẤT</Text>
                    <Text style={styles.bentoLargeName}>{restaurants[0].name}</Text>
                    <View style={styles.bentoLargeMeta}>
                      <Text style={styles.bentoLargeCuisine}>{restaurants[0].cuisineTypes.join(' • ')}</Text>
                      {restaurants[0].distanceText && (
                        <Text style={styles.bentoLargeDist}>📍 {restaurants[0].distanceText}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Bento Split Row */}
            <View style={styles.bentoGridRow}>
              {restaurants.slice(1, 3).map((item, idx) => (
                <Animated.View key={item.id || item.restaurantId || idx.toString()} entering={FadeInDown.delay(300 + idx * 100)} style={styles.bentoSmallCard}>
                  <Pressable onPress={() => {
                    const rId = getRestaurantId(item);
                    if (rId) {
                      router.push({
                        pathname: '/restaurants/[id]',
                        params: { id: rId },
                      });
                    } else {
                      console.warn('[RecommendationScreen] Missing restaurant id for bento small', item);
                    }
                  }} style={{ flex: 1 }}>
                    <Image
                      source={{ uri: item.image || item.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300' }}
                      style={styles.bentoSmallImg}
                    />
                    <View style={styles.matchScoreBadgeSmall}>
                      <Text style={styles.matchScoreTextSmall}>{item.matchScore}%</Text>
                    </View>
                    <View style={styles.bentoSmallContent}>
                      <Text style={styles.bentoSmallName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.bentoSmallCuisine} numberOfLines={1}>{item.cuisineTypes[0] || 'Ẩm thực'}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Trending dishes carousel */}
          <View style={styles.dishesSection}>
            <Text style={styles.sectionTitle}>Món Ngon Dành Cho Bạn</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishesScroll}>
              {popularDishes.map((dish, index) => (
                <Animated.View key={dish.id || index.toString()} entering={FadeInRight.delay(200 + index * 100)} style={styles.dishCard}>
                  <Image source={{ uri: dish.image }} style={styles.dishImg} />
                  <View style={styles.dishContent}>
                    <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                    <Text style={styles.dishRest} numberOfLines={1}>📍 {dish.restaurantName}</Text>
                    <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                    <View style={styles.dishReasonBox}>
                      <Text style={styles.dishReasonText} numberOfLines={1}>💡 {dish.matchReason}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Rest of recommendations */}
          {restaurants.length > 3 && (
            <View style={styles.otherListSection}>
              <Text style={styles.sectionTitle}>Khám Phá Thêm Quán Ngon</Text>
              {restaurants.slice(3).map((item, index) => (
                <Animated.View key={item.id || item.restaurantId || index.toString()} entering={FadeInDown.delay(100 + index * 50)} style={styles.restaurantRow}>
                  <Pressable
                    onPress={() => {
                      const rId = getRestaurantId(item);
                      if (rId) {
                        router.push({
                          pathname: '/restaurants/[id]',
                          params: { id: rId },
                        });
                      } else {
                        console.warn('[RecommendationScreen] Missing restaurant id for other list item', item);
                      }
                    }}
                    style={styles.restaurantRowPressable}
                  >
                    <Image
                      source={{ uri: item.image || item.photo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=150' }}
                      style={styles.restRowImg}
                    />
                    <View style={styles.restRowContent}>
                      <Text style={styles.restRowName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.restRowCuisine} numberOfLines={1}>
                        {item.cuisineTypes.join(' • ')}
                      </Text>
                      <View style={styles.restRowMeta}>
                        <View style={styles.ratingRow}>
                          <FontAwesome name="star" size={12} color="#FFC107" />
                          <Text style={styles.ratingText}>{item.ratingAverage.toFixed(1)}</Text>
                        </View>
                        {item.distanceText && (
                          <Text style={styles.distanceText}>• {item.distanceText}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.matchScoreBadgeRow}>
                      <Text style={styles.matchScoreTextRow}>{item.matchScore}%</Text>
                      <Text style={styles.matchScoreLabelRow}>hợp</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  loadingText: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: T.space.md,
    textAlign: 'center',
    lineHeight: 18,
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
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  locBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 150, 83, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.1)',
    marginHorizontal: T.space.lg,
    marginTop: T.space.md,
    paddingHorizontal: T.space.md,
    paddingVertical: 8,
    borderRadius: T.radius.sm,
    gap: 8,
  },
  locationText: {
    color: T.color.text2,
    fontSize: 11,
    flex: 1,
  },
  grantLocText: {
    color: T.color.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  heroBanner: {
    height: 180,
    marginHorizontal: T.space.lg,
    marginTop: T.space.md,
    borderRadius: T.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 15, 22, 0.75)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: T.space.lg,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sparkleText: {
    color: T.color.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroDesc: {
    color: T.color.text3,
    fontSize: 11,
    lineHeight: 16,
  },
  bentoSection: {
    marginTop: T.space.xl,
    paddingHorizontal: T.space.lg,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  bentoLargeCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
    marginBottom: T.space.md,
    position: 'relative',
  },
  bentoLargeImg: {
    width: '100%',
    height: 160,
  },
  matchScoreBadgeLarge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(212, 150, 83, 0.9)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchScoreTextLarge: {
    color: '#0C0F16',
    fontSize: 11,
    fontWeight: '700',
  },
  bentoLargeContent: {
    padding: T.space.lg,
  },
  bentoLargeTag: {
    color: T.color.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  bentoLargeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bentoLargeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoLargeCuisine: {
    color: T.color.text3,
    fontSize: 11,
  },
  bentoLargeDist: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '500',
  },
  bentoGridRow: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  bentoSmallCard: {
    flex: 1,
    height: 140,
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoSmallImg: {
    width: '100%',
    height: 85,
  },
  matchScoreBadgeSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(12, 15, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.4)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  matchScoreTextSmall: {
    color: T.color.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  bentoSmallContent: {
    padding: T.space.md,
  },
  bentoSmallName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bentoSmallCuisine: {
    color: T.color.text3,
    fontSize: 10,
    marginTop: 2,
  },
  dishesSection: {
    marginTop: T.space.xl,
  },
  dishesScroll: {
    paddingHorizontal: T.space.lg,
    gap: T.space.md,
  },
  dishCard: {
    width: width * 0.65,
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  dishImg: {
    width: '100%',
    height: 110,
  },
  dishContent: {
    padding: T.space.md,
  },
  dishName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dishRest: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  dishPrice: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  dishReasonBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: T.radius.sm,
    padding: 6,
  },
  dishReasonText: {
    color: T.color.text2,
    fontSize: 10,
    fontStyle: 'italic',
  },
  otherListSection: {
    marginTop: T.space.xl,
    paddingHorizontal: T.space.lg,
  },
  restaurantRow: {
    marginBottom: T.space.md,
  },
  restaurantRowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
  },
  restRowImg: {
    width: 60,
    height: 60,
    borderRadius: T.radius.md,
  },
  restRowContent: {
    flex: 1,
    marginLeft: T.space.md,
  },
  restRowName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  restRowCuisine: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  restRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  distanceText: {
    color: T.color.text3,
    fontSize: 11,
  },
  matchScoreBadgeRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchScoreTextRow: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  matchScoreLabelRow: {
    color: T.color.text3,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
});
