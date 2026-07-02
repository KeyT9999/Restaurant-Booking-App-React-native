import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, FlatList,
  Image, Pressable, ActivityIndicator, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { formatCurrency } from '@/src/utils/format';
import { restaurantApi } from '@/src/api/restaurant.api';
import { MenuItem } from '@/src/types/restaurant.types';

type Category = { _id?: string; id?: string; name: string };

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadMenu = useCallback(async () => {
    if (!id) return;
    try {
      const res = await restaurantApi.getMenu(id);
      if (res.success && res.data) {
        const cats: Category[] = res.data.categories || [];
        const items: MenuItem[] = res.data.menuItems || [];
        setCategories(cats);
        setAllItems(items);
      }
    } catch (e) {
      console.warn('Lỗi tải thực đơn:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const filteredItems = allItems.filter((item) => {
    const matchCat = selectedCat === 'all'
      || (item as any).categoryId === selectedCat
      || item.category === selectedCat;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.menuImage} />
      ) : (
        <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
          <FontAwesome name="cutlery" size={24} color={T.color.text3} />
        </View>
      )}
      <View style={styles.menuContent}>
        <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.menuFooter}>
          <Text style={styles.menuPrice}>{formatCurrency(item.price)}</Text>
          {(item as any).isAvailable === false ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Hết</Text>
            </View>
          ) : (
            <View style={styles.availBadge}>
              <Text style={styles.availText}>Còn</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.headerTitle]}>Thực đơn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={15} color={T.color.text3} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm món ăn..."
          placeholderTextColor={T.color.text3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Chips */}
      {!loading && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          <Pressable
            key="all"
            style={[styles.catChip, selectedCat === 'all' && styles.catChipActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.catLabel, selectedCat === 'all' && styles.catLabelActive]}>
              Tất cả
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const catId = cat._id || cat.id || cat.name;
            return (
              <Pressable
                key={catId}
                style={[styles.catChip, selectedCat === catId && styles.catChipActive]}
                onPress={() => setSelectedCat(catId)}
              >
                <Text style={[styles.catLabel, selectedCat === catId && styles.catLabelActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Menu Items */}
      {loading ? (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={100} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="cutlery"
          title="Không có món nào"
          description="Thực đơn chưa có món ăn phù hợp"
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: T.space.sm,
    backgroundColor: T.color.card, borderRadius: T.radius.lg,
    marginHorizontal: T.space.base, marginBottom: T.space.md,
    paddingHorizontal: T.space.md, paddingVertical: T.space.sm,
    borderWidth: 1, borderColor: T.color.border,
  },
  searchInput: { flex: 1, color: T.color.text1, fontSize: 14 },
  catList: { paddingHorizontal: T.space.base, paddingBottom: T.space.md, gap: T.space.sm },
  catChip: {
    paddingHorizontal: T.space.md, paddingVertical: 6,
    backgroundColor: T.color.card, borderRadius: T.radius.full,
    borderWidth: 1, borderColor: T.color.border,
  },
  catChipActive: { backgroundColor: T.color.primary, borderColor: T.color.primary },
  catLabel: { fontSize: 13, color: T.color.text2, fontWeight: '500' },
  catLabelActive: { color: '#0C0F16', fontWeight: '700' },
  skeletonWrapper: { paddingHorizontal: T.space.base, paddingTop: T.space.md },
  list: { padding: T.space.base, paddingTop: 0 },
  menuCard: {
    flexDirection: 'row', backgroundColor: T.color.card,
    borderRadius: T.radius.lg, marginBottom: T.space.md,
    overflow: 'hidden', borderWidth: 1, borderColor: T.color.border,
  },
  menuImage: { width: 100, height: 100 },
  menuImagePlaceholder: {
    backgroundColor: T.color.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  menuContent: { flex: 1, padding: T.space.md, justifyContent: 'space-between' },
  menuName: { color: T.color.text1, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  menuDesc: { color: T.color.text3, fontSize: 12, marginBottom: 8 },
  menuFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuPrice: { color: T.color.primary, fontSize: 15, fontWeight: '700' },
  soldOutBadge: {
    backgroundColor: 'rgba(244,63,94,0.15)', borderRadius: T.radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soldOutText: { color: T.color.error, fontSize: 11, fontWeight: '600' },
  availBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: T.radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  availText: { color: T.color.success, fontSize: 11, fontWeight: '600' },
});
