import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

const { width } = Dimensions.get('window');

export default function OwnerDashboard() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [latestBookings, setLatestBookings] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      // 1. Fetch main dashboard stats
      const dashRes = await ownerApi.getRestaurantDashboard(activeRestaurant.id);
      if (dashRes.success) {
        setStats(dashRes.data.stats);
      }

      // 2. Fetch latest bookings (limit to 3)
      const bookingRes = await ownerApi.getBookings(activeRestaurant.id, { limit: 3 });
      if (bookingRes.success) {
        setLatestBookings(bookingRes.data.bookings || []);
      }

      // 3. Fetch weekly revenue breakdown for chart
      const revRes = await ownerApi.getRevenueStats(activeRestaurant.id, 'week');
      if (revRes.success) {
        setChartData(revRes.data.dailyBreakdown || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setStats(null);
    setLatestBookings([]);
    setChartData([]);
    fetchDashboardData();
  }, [activeRestaurant]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  // Format money helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const totalRevenue = stats?.totalRevenue || 0;
  const totalBookings = stats?.totalBookings || 0;
  const completedBookings = stats?.completedBookings || 0;
  const pendingBookings = stats?.pendingBookings || 0;

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Chưa có dữ liệu doanh thu tuần này</Text>
        </View>
      );
    }

    const maxVal = Math.max(...chartData.map((d: any) => d.deposits), 100000);

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartBars}>
          {chartData.map((d: any, index: number) => {
            const heightPct = (d.deposits / maxVal) * 100;
            const dateStr = d.date.split('-').slice(2, 3).concat(d.date.split('-').slice(1, 2)).join('/');
            return (
              <View key={index} style={styles.chartBarCol}>
                <Text style={styles.barValueText}>{d.deposits > 0 ? `${(d.deposits / 1000).toFixed(0)}k` : '0'}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { height: `${Math.max(heightPct, 8)}%` }]} />
                </View>
                <Text style={styles.barLabelText}>{dateStr}</Text>
              </View>
            );
          })}
        </View>
      </View>
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

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Tổng quan" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
        }
      >
        {/* Active Restaurant Info Card */}
        {activeRestaurant && (
          <View style={styles.activeRestCard}>
            <View style={styles.activeRestLeft}>
              <FontAwesome name="cutlery" size={16} color={T.color.primary} />
              <Text style={styles.activeRestName} numberOfLines={1}>{activeRestaurant.name}</Text>
            </View>
            <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/(owner-tabs)/restaurants')}>
              <Text style={styles.switchBtnText}>Đổi</Text>
              <FontAwesome name="exchange" size={10} color={T.color.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>DOANH THU</Text>
              <View style={[styles.iconCirc, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                <FontAwesome name="money" size={12} color={T.color.success} />
              </View>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.statFooterText}>Từ tiền cọc đặt bàn</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>ĐẶT BÀN</Text>
              <View style={[styles.iconCirc, { backgroundColor: 'rgba(212, 150, 83, 0.08)' }]}>
                <FontAwesome name="calendar" size={12} color={T.color.primary} />
              </View>
            </View>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statFooterText}>{completedBookings} xong • {pendingBookings} chờ</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitleHeader}>Lối tắt quản lý</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/owner/waitlist')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(212, 150, 83, 0.08)' }]}>
              <FontAwesome name="hourglass-half" size={16} color={T.color.primary} />
            </View>
            <Text style={styles.actionLabel}>Hàng chờ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/owner/blocked-slots')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}>
              <FontAwesome name="lock" size={16} color={T.color.error} />
            </View>
            <Text style={styles.actionLabel}>Chặn giờ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/owner/reviews')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <FontAwesome name="star" size={16} color={T.color.success} />
            </View>
            <Text style={styles.actionLabel}>Đánh giá</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/owner/billing')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <FontAwesome name="credit-card" size={16} color={T.color.text2} />
            </View>
            <Text style={styles.actionLabel}>Gói dịch vụ</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doanh thu đặt cọc tuần này</Text>
          {renderChart()}
        </View>

        {/* Bookings Preview Header */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.bodyLG, styles.sectionTitle]}>Yêu cầu đặt bàn mới</Text>
          <TouchableOpacity onPress={() => router.push('/(owner-tabs)/bookings' as any)}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Bookings List */}
        <View style={styles.bookingsList}>
          {latestBookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <FontAwesome name="calendar-check-o" size={24} color={T.color.text3} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyBookingsText}>Không có lịch đặt bàn mới nào</Text>
            </View>
          ) : (
            latestBookings.map((b) => {
              const statusStyle = getStatusStyle(b.status);
              const dateStr = new Date(b.bookingDate).toLocaleDateString('vi-VN');
              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookingRow}
                  onPress={() => router.push(`/owner/booking/${b.id}` as any)}
                >
                  <View style={styles.bookingRowLeft}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>{b.bookingTime}</Text>
                    </View>
                    <View style={styles.bookingMeta}>
                      <Text style={styles.customerName}>{b.customerName}</Text>
                      <Text style={styles.bookingSubText}>{dateStr} • {b.numberOfGuests} khách</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
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
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: T.space['3xl'],
  },
  activeRestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.color.card,
    marginHorizontal: T.space.xl,
    marginTop: T.space.md,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.sm,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  activeRestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.sm,
    flex: 1,
  },
  activeRestName: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '700',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  switchBtnText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    gap: T.space.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.sm,
  },
  iconCirc: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    color: T.color.text3,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  statValue: {
    color: T.color.text1,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: T.space.xs,
  },
  statFooterText: {
    color: T.color.text3,
    fontSize: 10,
  },
  sectionTitleHeader: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginHorizontal: T.space.xl,
    marginTop: T.space.xl,
    marginBottom: T.space.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    marginHorizontal: T.space.xl,
    gap: T.space.sm,
  },
  actionItem: {
    flex: 1,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    paddingVertical: T.space.md,
    alignItems: 'center',
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    marginHorizontal: T.space.xl,
    marginTop: T.space.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardTitle: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: T.space.lg,
  },
  chartWrapper: {
    height: 120,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    color: T.color.text3,
    fontSize: 8.5,
    marginBottom: 4,
  },
  barContainer: {
    height: 55,
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: T.color.primary,
    borderRadius: 6,
  },
  barLabelText: {
    color: T.color.text3,
    fontSize: 8.5,
    marginTop: 6,
  },
  emptyChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: T.color.text3,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: T.space.xl,
    marginTop: T.space.xl,
    marginBottom: T.space.md,
  },
  sectionTitle: {
    color: T.color.text1,
    fontWeight: '700',
  },
  viewAllText: {
    color: T.color.primary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  bookingsList: {
    paddingHorizontal: T.space.xl,
    gap: T.space.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  bookingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeBadge: {
    width: 44,
    height: 44,
    borderRadius: T.radius.md,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
  },
  timeText: {
    color: T.color.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  bookingMeta: {
    flex: 1,
  },
  customerName: {
    color: T.color.text1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  bookingSubText: {
    color: T.color.text2,
    fontSize: 11.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: T.radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyBookings: {
    paddingVertical: T.space.xl,
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  emptyBookingsText: {
    color: T.color.text3,
    fontSize: 12.5,
  },
});
