import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerRestaurantsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { restaurants, activeRestaurant, isLoadingRestaurants, refreshRestaurants, setActiveRestaurant } = useOwnerRestaurant();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRestaurants();
    setRefreshing(false);
  };

  const selectRestaurant = (item: any) => {
    if (item.id === activeRestaurant?.id) return;
    setActiveRestaurant(item);
    showToast(`Đã chuyển sang nhà hàng: ${item.name}`, 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Hoạt động', bg: 'rgba(16, 185, 129, 0.1)', text: T.color.success, icon: 'check-circle' };
      case 'pending':
        return { label: 'Chờ duyệt', bg: 'rgba(212, 150, 83, 0.1)', text: T.color.primary, icon: 'clock-o' };
      case 'rejected':
        return { label: 'Bị từ chối', bg: 'rgba(244, 63, 94, 0.1)', text: T.color.error, icon: 'times-circle' };
      case 'suspended':
        return { label: 'Tạm ngưng', bg: 'rgba(244, 63, 94, 0.15)', text: T.color.error, icon: 'ban' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text2, icon: 'info-circle' };
    }
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Nhà hàng của tôi" />

      {/* Quota Banner */}
      <View style={styles.quotaBanner}>
        <View style={styles.quotaLeft}>
          <FontAwesome name="database" size={16} color={T.color.primary} />
          <Text style={styles.quotaText}>Quản lý danh sách nhà hàng liên kết</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/owner/restaurant/create')}
        >
          <FontAwesome name="plus" size={12} color="#0C0F16" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnHeaderText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {isLoadingRestaurants && restaurants.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />
          }
        >
          {restaurants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <FontAwesome name="building-o" size={40} color={T.color.primary} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có nhà hàng</Text>
              <Text style={styles.emptySubtitle}>
                Tạo nhà hàng đầu tiên của bạn để bắt đầu nhận đặt bàn và quản lý thực đơn.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/owner/restaurant/create')}
              >
                <Text style={styles.createBtnText}>Tạo nhà hàng ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {restaurants.map((item) => {
                const isActive = item.id === activeRestaurant?.id;
                const status = getStatusBadge(item.approvalStatus);
                const addressStr = item.address
                  ? `${item.address.street}, ${item.address.ward}, ${item.address.district}, ${item.address.city}`
                  : 'Chưa cập nhật địa chỉ';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.card,
                      isActive && styles.cardActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cardMain}
                      activeOpacity={0.8}
                      onPress={() => selectRestaurant(item)}
                    >
                      {/* Cover or Logo Image */}
                      <View style={styles.imageWrapper}>
                        {item.coverImage || item.logo ? (
                          <Image source={{ uri: item.coverImage || item.logo || '' }} style={styles.image} />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <FontAwesome name="image" size={24} color={T.color.text3} />
                          </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <FontAwesome name={status.icon as any} size={10} color={status.text} style={{ marginRight: 4 }} />
                          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                        </View>
                        {isActive && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>Đang làm việc</Text>
                          </View>
                        )}
                      </View>

                      {/* Content */}
                      <View style={styles.cardInfo}>
                        <Text style={styles.name} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.address} numberOfLines={2}>
                          {addressStr}
                        </Text>

                        {/* Rating and Reviews */}
                        <View style={styles.statsRow}>
                          <View style={styles.statItem}>
                            <FontAwesome name="star" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                            <Text style={styles.statText}>
                              {item.stats?.averageRating?.toFixed(1) || '0.0'} ({item.stats?.totalReviews || 0} đánh giá)
                            </Text>
                          </View>
                          <Text style={styles.dot}>•</Text>
                          <View style={styles.statItem}>
                            <FontAwesome name="cutlery" size={12} color={T.color.text3} style={{ marginRight: 4 }} />
                            <Text style={styles.statText}>
                              {item.cuisineTypes?.slice(0, 2).join(', ') || 'Ẩm thực'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Footer Actions */}
                    <View style={styles.cardActions}>
                      {!isActive ? (
                        <TouchableOpacity
                          style={styles.selectBtn}
                          onPress={() => selectRestaurant(item)}
                        >
                          <FontAwesome name="check" size={12} color={T.color.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.selectBtnText}>Chọn làm việc</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.selectedWrapper}>
                          <FontAwesome name="check-circle" size={14} color={T.color.success} style={{ marginRight: 6 }} />
                          <Text style={styles.selectedText}>Đang được chọn</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => router.push(`/owner/restaurant/${item.id}/edit`)}
                      >
                        <FontAwesome name="pencil" size={12} color={T.color.text2} style={{ marginRight: 6 }} />
                        <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
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
  },
  quotaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.color.card,
    marginHorizontal: T.space.xl,
    marginTop: T.space.md,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.md,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  quotaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.sm,
    flex: 1,
  },
  quotaText: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '500',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.radius.sm,
  },
  addBtnHeaderText: {
    color: '#0C0F16',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: T.space['3xl'],
  },
  list: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    gap: T.space.md,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: T.color.primary,
  },
  cardMain: {
    flexDirection: 'row',
    padding: T.space.md,
    gap: T.space.md,
  },
  imageWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: T.radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: T.color.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  activeTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: T.color.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#0C0F16',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  address: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: T.color.text3,
    fontSize: 11,
  },
  dot: {
    color: T.color.text3,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: T.space.sm,
    paddingHorizontal: T.space.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectBtnText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedText: {
    color: T.color.success,
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  editBtnText: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: T.space['2xl'],
    paddingVertical: T.space['4xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.xl,
  },
  emptyTitle: {
    color: T.color.text1,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: T.space.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: T.color.text3,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: T.space['2xl'],
  },
  createBtn: {
    backgroundColor: T.color.primary,
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.xl,
    borderRadius: T.radius.md,
  },
  createBtnText: {
    color: '#0C0F16',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
