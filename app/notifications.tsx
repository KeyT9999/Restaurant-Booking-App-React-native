import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { notificationApi } from '@/src/api/notification.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { formatDate } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'read' | 'unread';
  createdAt: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
    metadata?: any;
  };
  restaurantId?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await notificationApi.getList({ page: 1, limit: 50 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.warn('Lỗi tải thông báo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (markingAll || notifications.length === 0) return;
    setMarkingAll(true);
    try {
      const res = await notificationApi.markAllAsRead();
      if (res.success) {
        showToast('Đã đánh dấu đọc tất cả thông báo', 'success');
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      }
    } catch (e) {
      showToast('Có lỗi xảy ra', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // 1. Mark as read in local state & api
    if (item.status === 'unread') {
      try {
        await notificationApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, status: 'read' as const } : n))
        );
      } catch (err) {
        // Silent catch
      }
    }

    // 2. Redirect based on relatedEntity
    const entityType = item.relatedEntity?.entityType;
    const entityId = item.relatedEntity?.entityId;

    if (entityType === 'booking' && entityId) {
      router.push(`/booking/${entityId}`);
    } else if (entityType === 'payment' && item.relatedEntity?.metadata?.bookingId) {
      router.push(`/booking/${item.relatedEntity.metadata.bookingId}`);
    } else if (entityType === 'chat' && entityId) {
      router.push(`/chat/${item.restaurantId}`);
    } else if (item.restaurantId) {
      router.push(`/restaurants/${item.restaurantId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return { name: 'calendar-plus-o', color: T.color.primary };
      case 'booking_confirmed':
        return { name: 'check-circle', color: T.color.success };
      case 'booking_cancelled':
        return { name: 'times-circle', color: T.color.error };
      case 'payment_success':
        return { name: 'credit-card', color: T.color.success };
      case 'payment_failed':
        return { name: 'exclamation-circle', color: T.color.error };
      case 'chat_new_message':
        return { name: 'comment-o', color: T.color.primary };
      case 'voucher_new':
        return { name: 'ticket', color: '#F59E0B' };
      default:
        return { name: 'bell-o', color: T.color.text3 };
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="bell-o" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Thông báo của bạn</Text>
        <Text style={styles.guestSubtitle}>Vui lòng đăng nhập tài khoản Diner để xem các thông báo cập nhật về cuộc hẹn.</Text>
        <Button label="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Thông báo</Text>
        </View>
        {notifications.some((n) => n.status === 'unread') && (
          <Pressable onPress={handleMarkAllRead} disabled={markingAll} style={styles.readAllBtn}>
            {markingAll ? (
              <ActivityIndicator size="small" color={T.color.primary} />
            ) : (
              <Text style={styles.readAllText}>Đọc tất cả</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* ─── List Content ─── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} borderRadius={12} style={{ marginBottom: 10 }} />
          ))}
        </ScrollView>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
          }
          renderItem={({ item }) => {
            const iconConfig = getNotificationIcon(item.type);
            const isUnread = item.status === 'unread';
            return (
              <Pressable
                onPress={() => handleNotificationPress(item)}
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${iconConfig.color}15` }]}>
                  <FontAwesome name={iconConfig.name as any} size={16} color={iconConfig.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, isUnread && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.cardTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
        />
      ) : (
        <EmptyState
          icon="bell-slash-o"
          title="Hộp thư thông báo trống"
          description="Bạn chưa nhận được thông báo cập nhật nào từ hệ thống đặt bàn."
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
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  readAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  readAllText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    marginBottom: 10,
    position: 'relative',
  },
  unreadCard: {
    borderColor: 'rgba(212, 150, 83, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
  },
  cardContent: {
    flex: 1,
    marginRight: T.space.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: T.space.sm,
  },
  unreadTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardTime: {
    color: T.color.text3,
    fontSize: 10,
  },
  cardMsg: {
    color: T.color.text3,
    fontSize: 11,
    lineHeight: 15,
  },
  unreadDot: {
    position: 'absolute',
    top: T.space.md,
    right: T.space.md,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.color.primary,
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
