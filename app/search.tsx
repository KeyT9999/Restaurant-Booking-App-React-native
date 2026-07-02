import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { restaurantApi as restApi } from '@/src/api/restaurant.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { RestaurantCard } from '@/src/components/cards/RestaurantCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Chip } from '@/src/components/ui/Chip';
import { BackButton } from '@/src/components/ui/BackButton';
import { useDebounce } from '@/src/hooks/useDebounce';
import { FontAwesome } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/restaurant.types';

export default function SearchScreen() {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);

  // Filters state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<string>(''); // '', 'low', 'medium', 'high'

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        search: debouncedSearch,
        sortBy,
        sortDir,
      };
      if (priceRange) {
        params.priceRange = priceRange;
      }

      const res = await restApi.getRestaurants(params);
      if (res.success && res.data) {
        setRestaurants(res.data.restaurants || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.warn('Lỗi tìm kiếm nhà hàng:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, sortDir, priceRange]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleClear = () => {
    setSearchText('');
  };

  const handleSortSelect = (type: string) => {
    if (type === 'all') {
      setSortBy('name');
      setSortDir('asc');
    } else if (type === 'popular') {
      setSortBy('totalBookings');
      setSortDir('desc');
    } else if (type === 'rating') {
      setSortBy('averageRating');
      setSortDir('desc');
    } else if (type === 'price_asc') {
      setSortBy('averagePrice');
      setSortDir('asc');
    }
  };

  const activeSortLabel = () => {
    if (sortBy === 'totalBookings') return 'popular';
    if (sortBy === 'averageRating') return 'rating';
    if (sortBy === 'averagePrice' && sortDir === 'asc') return 'price_asc';
    return 'all';
  };

  return (
    <View style={styles.container}>
      {/* ─── Search Input Bar ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.searchWrapper}>
          <FontAwesome name="search" size={14} color={T.color.text3} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhà hàng, món ăn, ẩm thực..."
            placeholderTextColor={T.color.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearBtn}>
              <FontAwesome name="times-circle" size={16} color={T.color.text3} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ─── Filter Row ─── */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Sort options */}
          <Chip
            label="Tất cả"
            active={activeSortLabel() === 'all'}
            onPress={() => handleSortSelect('all')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="Phổ biến 🔥"
            active={activeSortLabel() === 'popular'}
            onPress={() => handleSortSelect('popular')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="Đánh giá cao ⭐"
            active={activeSortLabel() === 'rating'}
            onPress={() => handleSortSelect('rating')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="Giá thấp 💸"
            active={activeSortLabel() === 'price_asc'}
            onPress={() => handleSortSelect('price_asc')}
            sm
            style={styles.filterChip}
          />

          <View style={styles.divider} />

          {/* Price Range options */}
          <Chip
            label="Mọi giá"
            active={priceRange === ''}
            onPress={() => setPriceRange('')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="Dưới 200K"
            active={priceRange === 'low'}
            onPress={() => setPriceRange('low')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="200K - 500K"
            active={priceRange === 'medium'}
            onPress={() => setPriceRange('medium')}
            sm
            style={styles.filterChip}
          />
          <Chip
            label="Trên 500K"
            active={priceRange === 'high'}
            onPress={() => setPriceRange('high')}
            sm
            style={styles.filterChip}
          />
        </ScrollView>
      </View>

      {/* ─── Results Counter ─── */}
      {!loading && (
        <Text style={styles.resultCount}>
          Tìm thấy <Text style={{ color: T.color.primary, fontWeight: '700' }}>{total}</Text> nhà hàng
        </Text>
      )}

      {/* ─── Results List ─── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.resultsList} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      ) : restaurants.length > 0 ? (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              variant="horizontal"
              onPress={() => router.push(`/restaurants/${item.id}`)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome name="search" size={48} color={T.color.text3} style={{ marginBottom: T.space.base }} />
          <Text style={[typography.titleSM, styles.emptyTitle]}>Không tìm thấy nhà hàng</Text>
          <Text style={styles.emptySubtitle}>Hãy thử tìm kiếm với các từ khóa hoặc bộ lọc khác.</Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
  },
  backBtn: {
    marginRight: T.space.md,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    height: 40,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    position: 'relative',
  },
  searchIcon: {
    marginRight: T.space.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: T.color.text1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: T.space.xs,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    paddingBottom: T.space.md,
  },
  filterScroll: {
    paddingHorizontal: T.space.lg,
  },
  filterChip: {
    marginRight: T.space.sm,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: T.space.xs,
    alignSelf: 'center',
  },
  resultCount: {
    color: T.color.text3,
    fontSize: 13,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.md,
  },
  resultsList: {
    paddingHorizontal: T.space.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: T.color.text1,
    marginBottom: T.space.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
