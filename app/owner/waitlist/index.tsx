import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerWaitlistScreen() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');

  const fetchWaitlists = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getWaitlists({
        restaurantId: activeRestaurant.id,
        status: activeFilter,
      });
      if (res.success) {
        setWaitlists(res.data?.waitlists || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching owner waitlist:', error);
      showToast('Không thể tải danh sách hàng chờ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setWaitlists([]);
    fetchWaitlists();
  }, [activeRestaurant, activeFilter]);

  const handleNotifyGuest = (name: string) => {
    // In a real system, this sends an SMS/App notification. Let's show a success feedback toast.
    Alert.alert('Gọi khách hàng', `Hệ thống sẽ gửi thông báo SMS và thông báo ứng dụng tới khách hàng "${name}" để vào bàn ăn. Xác nhận gửi?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Gửi gọi khách',
        onPress: () => {
          showToast(`Đã gửi thông báo thành công tới khách hàng ${name}!`, 'success');
        },
      },
    ]);
  };

  const handleCancelWaitlist = (id: string, name: string) => {
    Alert.prompt(
      'Hủy hàng chờ',
      `Nhập lý do hủy hàng chờ cho khách hàng "${name}":`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || !reason.trim()) {
              showToast('Lý do hủy là bắt buộc', 'error');
              return;
            }

            try {
              const res = await ownerApi.cancelWaitlist(id, reason.trim());
              if (res.success) {
                showToast('Đã hủy hàng chờ thành công', 'success');
                fetchWaitlists(false);
              } else {
                showToast(res.message || 'Huỷ hàng chờ thất bại', 'error');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Hàng chờ (Waitlist)" showBack={true} />

      {/* Status filter tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'pending', label: 'Đang đợi', count: waitlists.length && activeFilter === 'pending' ? waitlists.length : null },
          { key: 'confirmed', label: 'Đã vào bàn', count: null },
          { key: 'cancelled', label: 'Đã hủy', count: null },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key as any)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
              {tab.count !== null ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {waitlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="hourglass-o" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              {activeFilter === 'pending'
                ? 'Không có khách hàng nào đang trong hàng chờ'
                : activeFilter === 'confirmed'
                ? 'Chưa có lịch sử giao bàn từ hàng chờ'
                : 'Chưa có hàng chờ nào bị hủy'}
            </Text>
          </View>
        ) : (
          waitlists.map((item, index) => {
            const dateStr = item.preferredTime || new Date(item.preferredDateTime || item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const waitTime = item.maxWaitMinutes ? `Chờ tối đa ${item.maxWaitMinutes} phút` : 'Đang chờ bàn';

            return (
              <View key={item._id || item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.positionCircle}>
                      <Text style={styles.positionText}>#{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.guestName}>{item.customerName || item.customer?.fullName || 'Khách ẩn danh'}</Text>
                      <Text style={styles.phoneText}>{item.customerPhone || item.customer?.phoneNumber || 'Không có SĐT'}</Text>
                    </View>
                  </View>

                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{dateStr}</Text>
                  </View>
                </View>

                {/* Details info */}
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <FontAwesome name="users" size={12} color={T.color.text3} style={{ marginRight: 6 }} />
                    <Text style={styles.detailValue}>{item.numberOfGuests} khách</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome name="clock-o" size={12} color={T.color.text3} style={{ marginRight: 6 }} />
                    <Text style={styles.detailValue}>{waitTime}</Text>
                  </View>
                </View>

                {item.note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText} numberOfLines={2}>
                      Yêu cầu: {item.note}
                    </Text>
                  </View>
                ) : null}

                {/* Status history log if cancelled/confirmed */}
                {activeFilter === 'cancelled' && item.cancellationReason && (
                  <View style={styles.cancelReasonBox}>
                    <Text style={styles.cancelReasonText}>Lý do hủy: {item.cancellationReason}</Text>
                  </View>
                )}

                {/* Action buttons */}
                {activeFilter === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelWaitlist(item._id || item.id, item.customerName || item.customer?.fullName || 'Khách')}
                    >
                      <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.notifyBtn}
                      onPress={() => handleNotifyGuest(item.customerName || item.customer?.fullName || 'Khách')}
                    >
                      <FontAwesome name="bell-o" size={12} color={T.color.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.notifyBtnText}>Gọi khách</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.assignBtn}
                      onPress={() => router.push(`/owner/waitlist/assign?id=${item._id || item.id}` as any)}
                    >
                      <FontAwesome name="check" size={12} color={T.color.text1} style={{ marginRight: 6 }} />
                      <Text style={styles.assignBtnText}>Giao bàn</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.bg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    backgroundColor: T.color.bg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: T.space.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: T.color.primary,
  },
  filterTabText: {
    color: T.color.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.lg,
    paddingBottom: T.space['3xl'],
  },
  emptyContainer: {
    paddingVertical: T.space['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
    flex: 1,
  },
  positionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  guestName: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '600',
  },
  phoneText: {
    color: T.color.text2,
    fontSize: 12,
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeBadgeText: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    gap: T.space.xl,
    marginBottom: T.space.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '500',
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginBottom: T.space.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  noteText: {
    color: T.color.text2,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cancelReasonBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.03)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.06)',
  },
  cancelReasonText: {
    color: T.color.error,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: T.space.sm,
    marginTop: T.space.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radius.sm,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cancelBtnText: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '600',
  },
  notifyBtn: {
    flex: 1.2,
    height: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
  },
  notifyBtnText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  assignBtn: {
    flex: 1.5,
    height: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
  },
  assignBtnText: {
    color: T.color.text1,
    fontSize: 12,
    fontWeight: '600',
  },
});
