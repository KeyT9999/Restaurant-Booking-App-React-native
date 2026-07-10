import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerBookings() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  const filters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'confirmed', label: 'Đã nhận' },
    { key: 'completed', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã huỷ' },
  ];

  const fetchBookings = useCallback(async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const params: any = {
        page: 1,
        limit: 100,
      };

      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

      if (searchQuery.trim().length > 0) {
        params.search = searchQuery.trim();
      }

      const res = await ownerApi.getBookings(activeRestaurant.id, params);
      if (res.success && res.data?.bookings) {
        let fetchedBookings = res.data.bookings || [];

        // Client-side date filtering for finer control
        if (dateFilter === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          fetchedBookings = fetchedBookings.filter((b: any) => b.bookingDate.startsWith(todayStr));
        } else if (dateFilter === 'week') {
          const now = Date.now();
          const oneWeek = 7 * 24 * 3600 * 1000;
          fetchedBookings = fetchedBookings.filter((b: any) => {
            const bTime = new Date(b.bookingDate).getTime();
            return Math.abs(now - bTime) <= oneWeek;
          });
        }

        setBookings(fetchedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Không thể lấy danh sách đặt bàn', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRestaurant, activeFilter, searchQuery, dateFilter, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(false);
  };

  const handleConfirm = async (id: string, customerName: string) => {
    Alert.alert('Xác nhận đặt bàn', `Xác nhận đặt bàn cho khách hàng ${customerName}?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            const res = await ownerApi.confirmBooking(id);
            if (res.success) {
              showToast('Đã xác nhận đặt bàn!', 'success');
              fetchBookings(false);
            } else {
              showToast(res.message || 'Thao tác thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
          }
        },
      },
    ]);
  };

  const handleCancel = async (id: string, customerName: string) => {
    Alert.prompt(
      'Từ chối đặt bàn',
      `Vui lòng nhập lý do từ chối đặt bàn của ${customerName}:`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Từ chối đặt bàn',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim().length === 0) {
              showToast('Lý do huỷ là bắt buộc', 'error');
              return;
            }
            try {
              const res = await ownerApi.cancelBooking(id, reason);
              if (res.success) {
                showToast('Đã huỷ đặt bàn!', 'success');
                fetchBookings(false);
              } else {
                showToast(res.message || 'Thao tác thất bại', 'error');
              }
            } catch (e: any) {
              showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(212, 150, 83, 0.1)', text: T.color.primary, label: 'Chờ duyệt' };
      case 'confirmed': return { bg: 'rgba(16, 185, 129, 0.1)', text: T.color.success, label: 'Đã nhận' };
      case 'completed': return { bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text2, label: 'Đã xong' };
      case 'cancelled': return { bg: 'rgba(244, 63, 94, 0.1)', text: T.color.error, label: 'Đã huỷ' };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text2, label: status };
    }
  };

  // Quick stats summary
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const totalGuestsCount = bookings.reduce((sum, b) => sum + (b.numberOfGuests || 0), 0);

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Đặt bàn" />

      {/* Date Quick Filter Bar */}
      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          style={[styles.dateFilterBtn, dateFilter === 'all' && styles.dateFilterBtnActive]}
          onPress={() => setDateFilter('all')}
        >
          <Text style={[styles.dateFilterText, dateFilter === 'all' && styles.dateFilterTextActive]}>Tất cả ngày</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateFilterBtn, dateFilter === 'today' && styles.dateFilterBtnActive]}
          onPress={() => setDateFilter('today')}
        >
          <Text style={[styles.dateFilterText, dateFilter === 'today' && styles.dateFilterTextActive]}>Hôm nay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateFilterBtn, dateFilter === 'week' && styles.dateFilterBtnActive]}
          onPress={() => setDateFilter('week')}
        >
          <Text style={[styles.dateFilterText, dateFilter === 'week' && styles.dateFilterTextActive]}>Tuần này</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.headerControls}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={13} color={T.color.text3} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm theo tên hoặc số điện thoại..."
            placeholderTextColor={T.color.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={14} color={T.color.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Badges Row */}
        <View style={styles.filtersScroll}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filters}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              const isActive = activeFilter === item.key;
              return (
                <TouchableOpacity
                  style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                  onPress={() => setActiveFilter(item.key)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      </View>

      {/* Summary Mini Row */}
      <View style={styles.summaryMiniRow}>
        <Text style={styles.summaryMiniText}>
          Hiển thị <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{bookings.length}</Text> đặt bàn •{' '}
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{totalGuestsCount}</Text> khách
        </Text>
        {pendingCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{pendingCount} chờ duyệt</Text>
          </View>
        )}
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            const dateStr = new Date(item.bookingDate).toLocaleDateString('vi-VN');
            const hasDeposit = !!(item.depositAmount && item.depositAmount > 0);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/owner/booking/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    {/* User Initials Badge */}
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{item.customerName ? item.customerName[0].toUpperCase() : 'K'}</Text>
                    </View>
                    <View>
                      <Text style={styles.customerName}>{item.customerName}</Text>
                      <Text style={styles.bookingId}>Mã: #{item.id.slice(-8).toUpperCase()} • {dateStr}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                  </View>
                </View>

                {/* Substats */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>GIỜ</Text>
                    <Text style={styles.detailValue}>{item.bookingTime}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>KHÁCH</Text>
                    <Text style={styles.detailValue}>{item.numberOfGuests} người</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>BÀN GÁN</Text>
                    <Text style={styles.detailValue}>
                      {item.tableNumbers?.length > 0 ? item.tableNumbers.join(', ') : 'Chưa gán'}
                    </Text>
                  </View>
                </View>

                {/* Extra badges (Deposit status) */}
                {hasDeposit && (
                  <View style={styles.extraBadgeRow}>
                    <View style={styles.depositBadge}>
                      <FontAwesome name="check-circle" size={10} color={T.color.success} style={{ marginRight: 4 }} />
                      <Text style={styles.depositBadgeText}>
                        Đã đặt cọc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.depositAmount)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Inline Action Buttons for pending bookings */}
                {item.status === 'pending' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleCancel(item.id, item.customerName)}
                    >
                      <FontAwesome name="times" size={12} color={T.color.error} style={{ marginRight: 6 }} />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleConfirm(item.id, item.customerName)}
                    >
                      <FontAwesome name="check" size={12} color={T.color.success} style={{ marginRight: 6 }} />
                      <Text style={styles.confirmBtnText}>Duyệt đặt bàn</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="calendar-times-o" size={36} color={T.color.text3} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Không tìm thấy đơn đặt bàn nào</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.bg,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    gap: T.space.sm,
    backgroundColor: T.color.bg,
  },
  dateFilterBtn: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radius.sm,
    borderWidth: 1,
    borderColor: T.color.border,
    backgroundColor: T.color.card,
  },
  dateFilterBtnActive: {
    borderColor: T.color.primary,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
  },
  dateFilterText: {
    color: T.color.text2,
    fontSize: 11.5,
    fontWeight: '500',
  },
  dateFilterTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  headerControls: {
    backgroundColor: T.color.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    paddingVertical: T.space.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginHorizontal: T.space.xl,
    paddingHorizontal: T.space.md,
    height: 38,
    marginBottom: T.space.sm,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    padding: 0,
  },
  filtersScroll: {
    marginTop: T.space.xs,
  },
  filtersList: {
    paddingHorizontal: T.space.xl,
    gap: T.space.sm,
  },
  filterBadge: {
    paddingHorizontal: T.space.base,
    paddingVertical: 5,
    borderRadius: T.radius.full,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  filterBadgeActive: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  filterText: {
    color: T.color.text2,
    fontSize: 11.5,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#0C0F16',
    fontWeight: '700',
  },
  summaryMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    paddingBottom: T.space.xs,
  },
  summaryMiniText: {
    color: T.color.text3,
    fontSize: 11.5,
  },
  alertBadge: {
    backgroundColor: 'rgba(212, 150, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    paddingBottom: T.space['3xl'],
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    marginBottom: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
    flex: 1,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.color.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: T.color.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  bookingId: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: T.radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: T.space.md,
    marginBottom: T.space.sm,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: T.color.text3,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  extraBadgeRow: {
    flexDirection: 'row',
    marginBottom: T.space.sm,
  },
  depositBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  depositBadgeText: {
    color: T.color.success,
    fontSize: 10.5,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: T.space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: T.space.md,
    gap: T.space.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    borderRadius: T.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  rejectBtnText: {
    color: T.color.error,
    fontSize: 11.5,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  confirmBtnText: {
    color: T.color.success,
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: T.space['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 12.5,
  },
});
