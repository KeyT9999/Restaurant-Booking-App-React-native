import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { favoriteApi } from '@/src/api/favorite.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { RestaurantCard } from '@/src/components/cards/RestaurantCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { Restaurant } from '@/src/types/restaurant.types';
import { FontAwesome } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Restaurant[]>([]);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await favoriteApi.getMyFavorites();
      if (res.success && res.data) {
        // Map populated restaurantId documents to Restaurant array
        const list: Restaurant[] = res.data
          .filter((fav: any) => fav.restaurantId)
          .map((fav: any) => {
            const r = fav.restaurantId;
            // Normalize address structure
            const fullAddr = r.address && typeof r.address === 'object'
              ? r.address.fullAddress || `${r.address.street || ''}, ${r.address.district || ''}`
              : String(r.address || '');

            return {
              id: r._id || r.id,
              name: r.name || 'Nhà hàng',
              description: r.description || '',
              phoneNumber: r.phoneNumber || '',
              email: r.email || '',
              address: fullAddr,
              logo: r.logo || '',
              coverImage: r.coverImage || '',
              galleryImages: r.galleryImages || [],
              primaryImage: r.images?.find((img: any) => img.isPrimary)?.url || r.coverImage || '',
              averagePrice: r.averagePrice || 0,
              priceRangeMin: r.priceRangeMin || 0,
              priceRangeMax: r.priceRangeMax || 0,
              priceRange: r.priceRange || 'moderate',
              cuisineType: r.cuisineTypes?.[0] || 'Ẩm thực',
              cuisineTypes: r.cuisineTypes || [],
              averageRating: r.averageRating || r.stats?.averageRating || 0,
              reviewCount: r.reviewCount || r.stats?.totalReviews || 0,
              stats: r.stats || { averageRating: 0, totalReviews: 0, totalBookings: 0 },
            };
          });

        setFavorites(list);
      }
    } catch (error) {
      console.warn('Lỗi tải nhà hàng yêu thích:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="heart-o" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Nhà hàng yêu thích của bạn</Text>
        <Text style={styles.guestSubtitle}>Vui lòng đăng nhập tài khoản để lưu lại các địa điểm ăn uống yêu thích của bạn.</Text>
        <Button label="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={[typography.titleLG, styles.headerTitle]}>Địa điểm yêu thích</Text>
      </View>

      {/* ─── List Content ─── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={100} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      ) : favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
          }
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              variant="horizontal"
              onPress={() => router.push(`/restaurants/${item.id}`)}
            />
          )}
        />
      ) : (
        <EmptyState
          icon="heart-o"
          title="Ví yêu thích trống"
          description="Hãy khám phá và nhấn thả tim lưu lại những nhà hàng bạn yêu thích."
          style={{ flex: 0.8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: 100,
  },
  guestContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: T.space.xs,
    textAlign: 'center',
  },
  guestSubtitle: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: T.space.xl,
  },
  loginBtn: {
    width: '100%',
  },
});
