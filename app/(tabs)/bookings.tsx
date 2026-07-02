import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { bookingApi } from '@/src/api/booking.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { formatDate, formatCurrency } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking.types';

type FilterType = 'upcoming' | 'past' | 'cancelled';

export default function BookingsListScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<FilterType>('upcoming');

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await bookingApi.getMyBookings({ filter: activeTab });
      if (res.success && res.data) {
        setBookings(res.data.bookings || []);
      }
    } catch (error) {
      console.warn('Lỗi tải danh sách đặt bàn:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleTabChange = (tab: FilterType) => {
    setLoading(true);
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="calendar-check-o" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Quản lý lịch hẹn đặt bàn</Text>
        <Text style={styles.guestSubtitle}>Vui lòng đăng nhập tài khoản Diner để xem lịch sử đặt bàn của bạn.</Text>
        <Button label="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={[typography.titleLG, styles.headerTitle]}>Lịch hẹn của tôi</Text>
      </View>

      {/* ─── Tab Switcher ─── */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => handleTabChange('upcoming')}
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Sắp tới</Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('past')}
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Lịch sử</Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('cancelled')}
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>Đã hủy</Text>
        </Pressable>
      </View>

      {/* ─── List Content ─── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={140} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      ) : bookings.length > 0 ? (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
          }
          renderItem={({ item }) => {
            const restInfo = (item as any).restaurant || {};
            return (
              <Pressable
                onPress={() => router.push(`/booking/${item.id}`)}
                style={styles.bookingCard}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: T.space.md }}>
                    <Text style={styles.restName} numberOfLines={1}>{restInfo.name || 'Nhà hàng BookEat'}</Text>
                    <Text style={styles.restAddress} numberOfLines={1}>
                      {restInfo.address ? `${restInfo.address.street}, ${restInfo.address.district}` : 'Địa chỉ đang cập nhật'}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <FontAwesome name="calendar" size={12} color={T.color.text3} style={styles.detailIcon} />
                    <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome name="clock-o" size={12} color={T.color.text3} style={styles.detailIcon} />
                    <Text style={styles.detailText}>{item.bookingTime}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome name="users" size={12} color={T.color.text3} style={styles.detailIcon} />
                    <Text style={styles.detailText}>{item.numberOfGuests} người</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.depositLabel}>
                    Đặt cọc: <Text style={{ color: item.depositPaid ? T.color.success : T.color.primary, fontWeight: '700' }}>
                      {item.depositPaid ? 'Đã cọc' : 'Chưa cọc'}
                    </Text>
                  </Text>
                  <Text style={styles.price}>{formatCurrency(item.finalAmount)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <EmptyState
          icon="calendar-times-o"
          title="Chưa có lịch hẹn đặt bàn"
          description={
            activeTab === 'upcoming'
              ? 'Bạn không có cuộc hẹn đặt bàn nào sắp tới.'
              : activeTab === 'past'
              ? 'Lịch sử đặt bàn của bạn đang trống.'
              : 'Bạn chưa có đặt bàn nào bị hủy.'
          }
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: T.space.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: T.space.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: T.color.primary,
  },
  tabText: {
    color: T.color.text3,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: T.color.primary,
  },
  listContent: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    marginBottom: T.space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  restAddress: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: T.space.md,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: T.space.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    color: T.color.text2,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
    borderRadius: T.radius.md,
  },
  depositLabel: {
    color: T.color.text3,
    fontSize: 11,
  },
  price: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
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
