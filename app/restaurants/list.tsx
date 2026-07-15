import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { restaurantApi } from '@/src/api/restaurant.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { RestaurantCard } from '@/src/components/cards/RestaurantCard';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { FontAwesome } from '@expo/vector-icons';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Restaurant } from '@/src/types/restaurant.types';

type SortOption = 'name' | 'averageRating' | 'averagePriceAsc' | 'averagePriceDesc' | 'totalBookings';
type PriceFilter = '' | 'low' | 'medium' | 'high';

export default function RestaurantsListScreen() {
  const router = useRouter();

  // Search state
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  // Pagination & Loading state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('');

  const fetchRestaurants = useCallback(async (targetPage: number, isRefresh = false, isLoadMore = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      // Mapping API sort parameters
      let sortKey: string = 'name';
      let sortDir: 'asc' | 'desc' = 'asc';

      if (sortBy === 'averageRating') {
        sortKey = 'averageRating';
        sortDir = 'desc';
      } else if (sortBy === 'totalBookings') {
        sortKey = 'totalBookings';
        sortDir = 'desc';
      } else if (sortBy === 'averagePriceAsc') {
        sortKey = 'averagePrice';
        sortDir = 'asc';
      } else if (sortBy === 'averagePriceDesc') {
        sortKey = 'averagePrice';
        sortDir = 'desc';
      }

      const params: any = {
        page: targetPage,
        limit: 15,
        search: debouncedSearch,
        sortBy: sortKey,
        sortDir,
      };

      if (priceFilter) {
        params.priceRange = priceFilter;
      }

      const res = await restaurantApi.getRestaurants(params);
      if (res.success && res.data) {
        const fetchedList = res.data.restaurants || [];
        if (targetPage === 1) {
          setRestaurants(fetchedList);
        } else {
          setRestaurants((prev) => [...prev, ...fetchedList]);
        }
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(targetPage);
      } else {
        setErrorMsg(res.message || 'Không thể tải danh sách nhà hàng');
      }
    } catch (err: any) {
      console.warn('Lỗi tải danh sách nhà hàng:', err.message);
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, sortBy, priceFilter]);

  // Load page 1 on filter/search change
  useEffect(() => {
    fetchRestaurants(1);
  }, [fetchRestaurants]);

  const handleRefresh = () => {
    fetchRestaurants(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      fetchRestaurants(page + 1, false, true);
    }
  };

  const togglePriceFilter = (range: PriceFilter) => {
    setPriceFilter((prev) => (prev === range ? '' : range));
  };

  const getSortLabel = () => {
    if (sortBy === 'averageRating') return 'Đánh giá cao';
    if (sortBy === 'totalBookings') return 'Nổi bật';
    if (sortBy === 'averagePriceAsc') return 'Giá: Thấp - Cao';
    if (sortBy === 'averagePriceDesc') return 'Giá: Cao - Thấp';
    return 'Tên (A-Z)';
  };

  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerText}>
          <Text style={[typography.titleSM, styles.headerTitle]}>Khám phá nhà hàng</Text>
          <Text style={styles.headerSubtitle}>Tìm kiếm địa điểm ẩm thực lý tưởng</Text>
        </View>
      </View>

      {/* ─── Search bar ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={14} color={T.color.text3} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, món ăn, vị trí..."
            placeholderTextColor={T.color.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} style={styles.clearBtn}>
              <FontAwesome name="times-circle" size={16} color={T.color.text3} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ─── Filter chips (Horizontal) ─── */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: '', label: 'Tất cả' },
            { id: 'low', label: 'Bình dân' },
            { id: 'medium', label: 'Trung cấp' },
            { id: 'high', label: 'Sang trọng' },
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = priceFilter === item.id;
            return (
              <Pressable
                onPress={() => togglePriceFilter(item.id as PriceFilter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* ─── Sorting Bar ─── */}
      <View style={styles.sortingBar}>
        <Text style={styles.resultsCount}>
          {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${total} nhà hàng`}
        </Text>
        <View style={styles.sortSelector}>
          <FontAwesome name="sliders" size={12} color={T.color.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sortLabel}>Sắp xếp: </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'name', label: 'Tên A-Z' },
              { id: 'totalBookings', label: 'Nổi bật' },
              { id: 'averageRating', label: 'Đánh giá' },
              { id: 'averagePriceAsc', label: 'Giá ↑' },
              { id: 'averagePriceDesc', label: 'Giá ↓' },
            ]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sortList}
            renderItem={({ item }) => {
              const active = sortBy === item.id;
              return (
                <Pressable
                  onPress={() => handleSortSelect(item.id as SortOption)}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                >
                  <Text style={[styles.sortChipLabel, active && styles.sortChipLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>

      {/* ─── Main Content ─── */}
      {loading && page === 1 ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={120} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={T.color.error} style={{ marginBottom: T.space.md }} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Pressable onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon="cutlery"
          title="Không tìm thấy nhà hàng"
          description="Hãy thử thay đổi từ khóa hoặc bộ lọc khoảng giá khác nhé."
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item, index) => item.id || `rest-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              variant="horizontal"
              style={{ marginBottom: 12 }}
            />
          )}
          ListFooterComponent={() => {
            if (!loadingMore) return null;
            return (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={T.color.primary} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// Keep it clean and matching standard premium dark styles
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: T.space.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    height: 44,
  },
  searchIcon: {
    marginRight: T.space.sm,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  filtersWrapper: {
    paddingVertical: T.space.xs,
  },
  filterList: {
    paddingHorizontal: T.space.lg,
    gap: T.space.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: T.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChipActive: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  filterLabel: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: '#0C0F16',
    fontWeight: '700',
  },
  sortingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  resultsCount: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  sortSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortLabel: {
    color: T.color.text3,
    fontSize: 11,
    marginRight: 4,
  },
  sortList: {
    gap: 6,
    paddingLeft: 4,
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  sortChipActive: {
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
  },
  sortChipLabel: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '500',
  },
  sortChipLabelActive: {
    color: T.color.primary,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  errorText: {
    color: T.color.text2,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: T.space.lg,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: T.radius.md,
    backgroundColor: T.color.primary,
  },
  retryText: {
    color: '#0C0F16',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    flex: 0.8,
  },
  footerLoader: {
    paddingVertical: T.space.md,
    alignItems: 'center',
  },
  // Dummy ScrollView helper style for Loading state
  scrollContainer: {
    flex: 1,
  },
});
