import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/auth/useAuth';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

export default function OwnerProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeRestaurant, restaurants, setActiveRestaurant } = useOwnerRestaurant();

  const handleSelectRestaurant = (restaurant: any) => {
    setActiveRestaurant(restaurant);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Cài đặt" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={32} color={T.color.text3} />
              </View>
            )}
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user?.fullName || 'Chủ nhà hàng'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'owner@bookeat.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Restaurant Owner</Text>
            </View>
          </View>
        </View>

        {/* Section: Restaurants list to choose from */}
        {restaurants.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Danh sách nhà hàng của bạn</Text>
            <View style={styles.listContainer}>
              {restaurants.map((item) => {
                const isSelected = item.id === activeRestaurant?.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemRow, isSelected && styles.itemRowActive]}
                    onPress={() => handleSelectRestaurant(item)}
                  >
                    <View style={styles.itemRowLeft}>
                      <FontAwesome
                        name="building-o"
                        size={16}
                        color={isSelected ? T.color.primary : T.color.text3}
                        style={{ marginRight: 12, width: 18 }}
                      />
                      <Text style={[styles.itemRowText, isSelected && styles.itemRowTextActive]}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome name="check-circle" size={16} color={T.color.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Section: Features */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tính năng & Tiện ích</Text>
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/owner/waitlist' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="hourglass-half" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Quản lý Hàng chờ (Waitlist)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/owner/blocked-slots' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="clock-o" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Khóa khung giờ (Blocked Slots)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/owner/vouchers' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="tags" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Chương trình Khuyến mãi (Voucher)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/owner/reviews' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="star-o" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Phản hồi Đánh giá (Reviews)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/conversations' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="comments-o" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Tin nhắn khách hàng (Chat)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/owner/wallet' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="credit-card" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Ví tiền & Tài chính (Wallet)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Hệ thống</Text>
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => router.push('/settings/ip' as any)}
            >
              <View style={styles.itemRowLeft}>
                <FontAwesome name="server" size={15} color={T.color.text2} style={{ marginRight: 12, width: 18 }} />
                <Text style={styles.itemRowText}>Cấu hình IP máy chủ (API URL)</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={16} color={T.color.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.lg,
    paddingBottom: T.space['3xl'],
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.xl,
  },
  avatarWrapper: {
    marginRight: T.space.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    color: T.color.text1,
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: T.color.text2,
    fontSize: 12.5,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: T.space.sm,
  },
  roleText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: T.space.xl,
  },
  sectionHeader: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: T.space.sm,
    paddingLeft: T.space.xs,
  },
  listContainer: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  itemRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemRowText: {
    color: T.color.text2,
    fontSize: 14,
  },
  itemRowTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.02)',
    marginTop: T.space.lg,
  },
  logoutBtnText: {
    color: T.color.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
