import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminRestaurants } from '../../../src/hooks/useAdminRestaurants';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Chờ duyệt', color: '#e8955d' },
  approved:  { label: 'Hoạt động', color: '#10B981' },
  suspended: { label: 'Tạm khóa', color: '#EF4444' },
  rejected:  { label: 'Từ chối',  color: '#5C5C66' },
};

const FILTER_TABS = [
  { key: undefined as any, label: 'Tất cả' },
  { key: 'pending',   label: 'Chờ duyệt' },
  { key: 'approved',  label: 'Hoạt động' },
  { key: 'suspended', label: 'Tạm khóa' },
];

export default function AdminRestaurantsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status: initStatus } = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<string | undefined>(
    initStatus ? String(initStatus) : undefined
  );
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

  const { data, loading, error, refresh, loadMore, updateParams } = useAdminRestaurants({
    limit: 20,
    approvalStatus: activeFilter,
  });

  const handleFilterChange = (key: string | undefined) => {
    setActiveFilter(key);
    updateParams({ approvalStatus: key });
  };

  let finalData = search
    ? data.filter((r: any) => r.name?.toLowerCase().includes(search.toLowerCase()))
    : [...data];

  if (sortOrder === 'asc') {
    finalData.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortOrder === 'desc') {
    finalData.sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
  }

  const toggleSort = () => {
    if (sortOrder === 'default') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('default');
  };

  const renderItem = ({ item }: { item: any }) => {
    const st = STATUS_CONFIG[item.approvalStatus] || { label: item.approvalStatus, color: '#5C5C66' };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(admin)/restaurants/${item._id || item.id}` as any)}
        activeOpacity={0.7}
      >
        {/* Left Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>

        {/* Middle Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.restaurantMeta} numberOfLines={1}>
            {[item.address?.street, item.address?.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
          </Text>
          <View style={styles.bottomRow}>
            <View style={[styles.badge, { backgroundColor: st.color + '20' }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
            {item.phone && (
              <Text style={styles.phoneText}>{item.phone}</Text>
            )}
          </View>
        </View>

        {/* Right Chevron */}
        <Feather name="chevron-right" size={18} color="#3A3D4D" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Nhà hàng</Text>
          <Text style={styles.headerSub}>{finalData.length} kết quả</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#5C5C66" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên nhà hàng..."
            placeholderTextColor="#3A3D4D"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#5C5C66" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={toggleSort}>
          <Feather 
            name={sortOrder === 'default' ? 'list' : sortOrder === 'asc' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={sortOrder !== 'default' ? '#e8955d' : '#5C5C66'} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={String(tab.key)}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => handleFilterChange(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && data.length === 0 ? (
        <ActivityIndicator size="large" color="#e8955d" style={{ marginTop: 40 }} />
      ) : error && data.length === 0 ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={finalData}
          keyExtractor={(item, i) => item._id || item.id || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e8955d" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="home" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Không có nhà hàng nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16,
    backgroundColor: '#0F111A', borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#5C5C66', textAlign: 'center', marginTop: 2 },

  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#16171D', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#1E1F28',
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },
  sortBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#16171D',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E1F28',
  },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16171D', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#e8955d' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#5C5C66' },
  filterTextActive: { color: '#FFF' },

  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#16171D', borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#1E1F28',
  },
  avatar: { width: 48, height: 48, borderRadius: 13, backgroundColor: '#e8955d20', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#e8955d' },
  cardInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  restaurantMeta: { fontSize: 12, color: '#5C5C66', marginBottom: 6 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  phoneText: { fontSize: 11, color: '#3A3D4D' },

  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#3A3D4D', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
});
