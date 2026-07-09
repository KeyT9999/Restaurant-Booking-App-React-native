import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminRefunds } from '../../../../src/hooks/useAdminRefunds';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const FILTER_TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'requested', label: 'Chờ duyệt' },
  { key: 'approved',  label: 'Đã duyệt' },
  { key: 'rejected',  label: 'Từ chối' },
  { key: 'refunded',  label: 'Đã hoàn' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  requested:  { label: 'Chờ duyệt', color: '#e8955d', icon: 'clock' },
  approved:   { label: 'Đã duyệt',  color: '#10B981', icon: 'check-circle' },
  rejected:   { label: 'Từ chối',   color: '#EF4444', icon: 'x-circle' },
  refunded:   { label: 'Đã hoàn',   color: '#60A5FA', icon: 'check-square' },
  processing: { label: 'Đang xử lý', color: '#FBBF24', icon: 'loader' },
  cancelled:  { label: 'Đã hủy',    color: '#5C5C66', icon: 'x-circle' },
};

export default function AdminRefundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const { data, loading, error, refresh, loadMore, processRefund } = useAdminRefunds();

  const filteredData = activeFilter === 'all'
    ? data
    : data.filter((item: any) => item.status === activeFilter);

  const handleProcess = async (item: any, action: 'approve' | 'reject') => {
    const label = action === 'approve' ? 'Chấp thuận' : 'Từ chối';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn ${label} yêu cầu hoàn tiền ${formatCurrency(item.amount || item.refundAmount)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: label,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            const ok = await processRefund(item._id || item.id, action);
            if (!ok) Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const st = statusConfig[item.status] || { label: item.status, color: '#8A8A93', icon: 'help-circle' };
    const isPending = item.status === 'requested';
    const refundId = (item._id || item.id || '').slice(-8).toUpperCase();
    // requestedBy is populated with fullName/email
    const userName = item.requestedBy?.fullName || item.requestedBy?.email || item.userId?.fullName || 'Không rõ';
    // restaurantId comes from paymentId.restaurantId (populated)
    const restaurantName = item.paymentId?.restaurantId?.name || item.restaurantId?.name || 'Không rõ';
    const walletNote = (item.status === 'approved' || item.status === 'refunded') && item.adminNote ? item.adminNote : null;

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.refundId}>#{refundId}</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
            <Feather name={st.icon} size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.amount}>{formatCurrency(item.amount || item.refundAmount)}</Text>

        {/* Info Rows */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Feather name="user" size={13} color="#5C5C66" />
            <Text style={styles.infoText}>{userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="home" size={13} color="#5C5C66" />
            <Text style={styles.infoText}>{restaurantName}</Text>
          </View>
          {(item.reason || item.refundReason) ? (
            <View style={styles.infoRow}>
              <Feather name="file-text" size={13} color="#5C5C66" />
              <Text style={styles.infoText} numberOfLines={2}>{item.reason || item.refundReason}</Text>
            </View>
          ) : null}
          {walletNote ? (
            <View style={[styles.infoRow, { marginTop: 4 }]}>
              <Feather name="pocket" size={13} color="#10B981" />
              <Text style={[styles.infoText, { color: '#10B981' }]} numberOfLines={2}>{walletNote}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleProcess(item, 'approve')}
            >
              <Feather name="check" size={15} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>Chấp thuận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleProcess(item, 'reject')}
            >
              <Feather name="x" size={15} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
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
          <Text style={styles.headerTitle}>Yêu cầu hoàn tiền</Text>
          <Text style={styles.headerSub}>{filteredData.length} yêu cầu</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && data.length === 0 ? (
        <ActivityIndicator size="large" color="#e8955d" style={{ marginTop: 60 }} />
      ) : error && data.length === 0 ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => item._id || item.id || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e8955d" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Không có yêu cầu hoàn tiền nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16,
    backgroundColor: '#0F111A',
    borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#5C5C66', textAlign: 'center', marginTop: 2 },

  // Filter
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#16171D', alignItems: 'center',
  },
  filterTabActive: { backgroundColor: '#e8955d' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#5C5C66' },
  filterTextActive: { color: '#FFF' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#16171D', borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1E1F28',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: {},
  refundId: { fontSize: 13, fontWeight: '700', color: '#8A8A93', letterSpacing: 1 },
  cardDate: { fontSize: 11, color: '#3A3D4D', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },

  amount: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 12 },

  infoBlock: { gap: 6, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { fontSize: 13, color: '#8A8A93', flex: 1 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1,
  },
  approveBtn: { backgroundColor: '#10B98115', borderColor: '#10B98140' },
  rejectBtn: { backgroundColor: '#EF444415', borderColor: '#EF444440' },
  actionText: { fontWeight: '700', fontSize: 14 },

  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#3A3D4D', fontSize: 16, textAlign: 'center' },
});
