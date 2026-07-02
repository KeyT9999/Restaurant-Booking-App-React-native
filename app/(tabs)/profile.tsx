import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import { formatDate } from '@/src/utils/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất tài khoản BookEat?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="user-circle-o" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Tài khoản cá nhân</Text>
        <Text style={styles.guestSubtitle}>Đăng nhập để xem lịch hẹn, ví voucher ưu đãi và cấu hình thông tin cá nhân.</Text>
        <Button label="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </View>
    );
  }

  const joinDate = user?.createdAt ? formatDate(user.createdAt) : 'Đang cập nhật';

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={[typography.titleLG, styles.headerTitle]}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Profile Overview Card ─── */}
        <View style={styles.profileCard}>
          <Avatar
            name={user?.fullName || 'Thực khách'}
            size={70}
            imageUri={user?.avatarUrl}
            style={styles.avatar}
          />
          <Text style={[typography.titleMD, styles.name]}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Thành viên</Text>
          </View>
        </View>

        {/* ─── Account Settings Section ─── */}
        <View style={styles.menuBox}>
          <Text style={styles.menuGroupTitle}>Tài khoản của tôi</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <FontAwesome name="phone" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Số điện thoại</Text>
            </View>
            <Text style={styles.menuRightText}>{user?.phoneNumber || 'Chưa cập nhật VN'}</Text>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <FontAwesome name="calendar" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Thành viên từ</Text>
            </View>
            <Text style={styles.menuRightText}>{joinDate}</Text>
          </View>
        </View>

        {/* ─── Actions List ─── */}
        <View style={styles.menuBox}>
          <Text style={styles.menuGroupTitle}>Tiện ích</Text>

          <Pressable onPress={() => router.push('/vouchers')} style={styles.menuItemButton}>
            <View style={styles.menuLeft}>
              <FontAwesome name="ticket" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Ví voucher ưu đãi</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={T.color.text3} />
          </Pressable>

          <Pressable onPress={() => router.push('/(tabs)/bookings')} style={styles.menuItemButton}>
            <View style={styles.menuLeft}>
              <FontAwesome name="list-alt" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Lịch sử đặt bàn</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={T.color.text3} />
          </Pressable>

          <Pressable onPress={() => router.push('/settings/ip')} style={styles.menuItemButton}>
            <View style={styles.menuLeft}>
              <FontAwesome name="cogs" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Cấu hình IP máy chủ</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={T.color.text3} />
          </Pressable>
        </View>

        {/* ─── Logout Button ─── */}
        <View style={styles.actionContainer}>
          <Button
            label="Đăng xuất tài khoản"
            variant="secondary"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
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
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    margin: T.space.lg,
    padding: T.space.xl,
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: T.color.primary,
    marginBottom: T.space.md,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    color: T.color.text3,
    fontSize: 13,
    marginBottom: T.space.md,
  },
  badge: {
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: T.color.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  menuBox: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.lg,
    padding: T.space.md,
  },
  menuGroupTitle: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: T.space.md,
    paddingLeft: T.space.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  menuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: T.space.md,
    width: 20,
    textAlign: 'center',
  },
  menuText: {
    color: T.color.text2,
    fontSize: 13,
  },
  menuRightText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.lg,
  },
  logoutBtn: {
    width: '100%',
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
