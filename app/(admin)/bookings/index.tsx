import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminBookings } from '../../../src/hooks/useAdminBookings';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Chờ', color: '#F59E0B', bgColor: '#45260A' }, // dark orange
  confirmed: { label: 'Xác nhận', color: '#10B981', bgColor: '#064E3B' }, // dark green
  completed: { label: 'Xong', color: '#A0A0AB', bgColor: '#27272A' }, // dark gray
  cancelled: { label: 'Đã hủy', color: '#EF4444', bgColor: '#450A0A' }, // dark red
  no_show: { label: 'Vắng', color: '#EF4444', bgColor: '#450A0A' },
};

export default function AdminBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, error, refresh, loadMore } = useAdminBookings();

  const renderItem = ({ item }: { item: any }) => {
    const statusCfg = STATUS_CONFIG[item.status] || { label: item.status, color: '#A0A0AB', bgColor: '#27272A' };

    let dateStr = '';
    if (item.bookingDate) {
      const d = new Date(item.bookingDate);
      dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    const code = item.bookingCode || 'BE-???';
    const amount = item.finalAmount || item.totalAmount || 0;

    // Safely get customer and restaurant details
    const restaurantName = item.restaurantId?.name || 'Nhà hàng không xác định';
    const customerName = item.customerId?.fullName || item.customerName || 'Khách không tên';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName} numberOfLines={1}>{restaurantName}</Text>
          <View style={[styles.badge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoCol}>
            <Text style={styles.metaText}>{code} • {dateStr}</Text>
            <Text style={styles.customerText} numberOfLines={1}>Khách: {customerName}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.priceText}>{amount.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả đặt bàn</Text>
        <View style={{ width: 40 }} />
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
          data={data}
          keyExtractor={(item, i) => item._id || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e8955d" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="calendar" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Chưa có lịch đặt bàn nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: '#090A0F', borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#16171D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1, marginRight: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  infoCol: { flex: 1, gap: 6 },
  metaText: { fontSize: 12, color: '#5C5C66', fontWeight: '500' },
  customerText: { fontSize: 13, color: '#A0A0AB' },

  priceCol: { alignItems: 'flex-end', justifyContent: 'flex-end' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#e8955d' },

  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#5C5C66', fontSize: 14 },
});
