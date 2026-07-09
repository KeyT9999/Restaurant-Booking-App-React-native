import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminUsers } from '../../../src/hooks/useAdminUsers';

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:              { label: 'Admin',     color: '#EF4444' },
  restaurant_owner:   { label: 'Owner',     color: '#e8955d' },
  customer:           { label: 'Khách',     color: '#10B981' },
};

const FILTER_TABS = [
  { key: undefined as any, label: 'Tất cả' },
  { key: 'customer',          label: 'Khách' },
  { key: 'restaurant_owner',  label: 'Owner' },
  { key: 'admin',             label: 'Admin' },
];

export default function AdminUsersListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role: initRole } = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<string | undefined>(
    initRole ? String(initRole) : undefined
  );
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

  const { data, loading, error, refresh, loadMore, toggleStatus, updateParams } = useAdminUsers(
    activeFilter ? { role: activeFilter } : {}
  );

  const handleFilterChange = (key: string | undefined) => {
    setActiveFilter(key);
    updateParams(key ? { role: key } : { role: undefined });
  };

  let finalData = search
    ? data.filter((u: any) =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : [...data];

  if (sortOrder === 'asc') {
    finalData.sort((a: any, b: any) => (a.fullName || a.username || '').localeCompare(b.fullName || b.username || ''));
  } else if (sortOrder === 'desc') {
    finalData.sort((a: any, b: any) => (b.fullName || b.username || '').localeCompare(a.fullName || a.username || ''));
  }

  const toggleSort = () => {
    if (sortOrder === 'default') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('default');
  };

  const handleToggle = async (user: any) => {
    const nextActive = !user.active;
    const action = nextActive ? 'Mở khóa' : 'Khóa';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn ${action} tài khoản "${user.fullName || user.username}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: action,
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            const ok = await toggleStatus(user._id || user.id, nextActive);
            if (!ok) Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const roleCfg = ROLE_CONFIG[item.role] || { label: item.role, color: '#5C5C66' };
    const initials = (item.fullName || item.username || '?').charAt(0).toUpperCase();
    return (
      <View style={styles.card}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: roleCfg.color + '20' }]}>
          <Text style={[styles.avatarText, { color: roleCfg.color }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: roleCfg.color + '20' }]}>
              <Text style={[styles.badgeText, { color: roleCfg.color }]}>{roleCfg.label}</Text>
            </View>
            {!item.active && (
              <View style={[styles.badge, { backgroundColor: '#EF444420' }]}>
                <Text style={[styles.badgeText, { color: '#EF4444' }]}>Bị khóa</Text>
              </View>
            )}
          </View>
        </View>

        {/* Lock Toggle */}
        <TouchableOpacity style={styles.lockBtn} onPress={() => handleToggle(item)}>
          <Feather
            name={item.active ? 'lock' : 'unlock'}
            size={17}
            color={item.active ? '#3A3D4D' : '#10B981'}
          />
        </TouchableOpacity>
      </View>
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
          <Text style={styles.headerTitle}>Người dùng</Text>
          <Text style={styles.headerSub}>{finalData.length} tài khoản</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#5C5C66" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên, email..."
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
              <Feather name="users" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Không có người dùng nào</Text>
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
    backgroundColor: '#16171D', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
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
  avatar: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 19, fontWeight: '800' },
  cardInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#5C5C66', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  lockBtn: { padding: 8, borderRadius: 10, backgroundColor: '#1E1F28' },

  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#3A3D4D', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
});
