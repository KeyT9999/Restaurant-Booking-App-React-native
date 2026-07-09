import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/useAuth';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';

interface SettingRowProps {
  icon: any;
  title: string;
  subtitle?: string;
  iconColor?: string;
  onPress?: () => void;
  rightText?: string;
}

const SettingRow = ({ icon, title, subtitle, iconColor = '#8A8A93', onPress, rightText }: SettingRowProps) => (
  <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[rowStyles.iconWrap, { backgroundColor: iconColor + '20' }]}>
      <Feather name={icon} size={18} color={iconColor} />
    </View>
    <View style={rowStyles.textBlock}>
      <Text style={rowStyles.title}>{title}</Text>
      {subtitle ? <Text style={rowStyles.subtitle}>{subtitle}</Text> : null}
    </View>
    {rightText ? (
      <Text style={rowStyles.rightText}>{rightText}</Text>
    ) : (
      <Feather name="chevron-right" size={16} color="#3A3D4D" />
    )}
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1F28',
  },
  iconWrap: { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  subtitle: { fontSize: 12, color: '#5C5C66', marginTop: 2 },
  rightText: { fontSize: 13, color: '#5C5C66' },
});

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { data } = useAdminDashboard();
  const overview = data?.overview || {};

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi hệ thống?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {(user?.fullName || user?.username || 'A')[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.fullName || user?.username || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Super Admin</Text>
          </View>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{overview.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Người dùng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data?.restaurantStats?.totalRestaurants || 0}</Text>
          <Text style={styles.statLabel}>Nhà hàng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{overview.totalAdmins || 0}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </View>

      {/* Platform Settings */}
      <Text style={styles.sectionLabel}>CÀI ĐẶT NỀN TẢNG</Text>
      <View style={styles.sectionCard}>
        <SettingRow
          icon="percent"
          title="Hoa hồng"
          subtitle="Tỷ lệ theo loại đặt bàn"
          iconColor="#e8955d"
          onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng đang phát triển')}
        />
        <SettingRow
          icon="zap"
          title="Gói đăng ký"
          subtitle="Basic, Pro, Premium"
          iconColor="#3B82F6"
          onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng đang phát triển')}
        />
        <SettingRow
          icon="globe"
          title="Nội dung ứng dụng"
          subtitle="Banner, thông báo, FAQ"
          iconColor="#10B981"
          onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng đang phát triển')}
        />
        <SettingRow
          icon="gift"
          title="Voucher nền tảng"
          subtitle="Mã giảm giá hệ thống"
          iconColor="#8A8A93"
          onPress={() => router.push('/(admin)/vouchers' as any)}
        />
      </View>

      {/* Financial Tools */}
      <Text style={styles.sectionLabel}>CÔNG CỤ TÀI CHÍNH</Text>
      <View style={styles.sectionCard}>
        <SettingRow
          icon="credit-card"
          title="Yêu cầu rút tiền"
          subtitle="Duyệt / từ chối chuyển khoản"
          iconColor="#e8955d"
          onPress={() => router.push('/(admin)/revenue/withdrawals' as any)}
        />
        <SettingRow
          icon="refresh-cw"
          title="Yêu cầu hoàn tiền"
          subtitle="Phê duyệt hoàn tiền khách hàng"
          iconColor="#EF4444"
          onPress={() => router.push('/(admin)/revenue/refunds' as any)}
        />
        <SettingRow
          icon="bar-chart-2"
          title="Báo cáo doanh thu"
          subtitle="Chi tiết thu nhập nền tảng"
          iconColor="#3B82F6"
          onPress={() => router.push('/(admin)/revenue/list' as any)}
        />
      </View>

      {/* Account */}
      <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
      <View style={styles.sectionCard}>
        <SettingRow
          icon="user"
          title="Thông tin tài khoản"
          subtitle={user?.email || 'admin@bookeat.com'}
          iconColor="#8A8A93"
          onPress={() => Alert.alert(
            'Thông tin Admin',
            `Tên: ${user?.fullName || 'Super Admin'}\nUsername: ${user?.username || ''}\nEmail: ${user?.email || ''}`,
          )}
        />
        <SettingRow
          icon="shield"
          title="Bảo mật"
          subtitle="Đổi mật khẩu"
          iconColor="#8A8A93"
          onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng đang phát triển')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>BookEat Admin v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  content: { padding: 16, paddingBottom: 60, paddingTop: 70 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#16171D', borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#1E1F28',
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#e8955d30', justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarText: { fontSize: 26, fontWeight: '900', color: '#e8955d' },
  profileName: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  profileEmail: { fontSize: 13, color: '#5C5C66', marginBottom: 8 },
  roleBadge: { backgroundColor: '#e8955d20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#e8955d' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#16171D', borderRadius: 16,
    padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#1E1F28',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#1E1F28', marginHorizontal: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#e8955d', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#5C5C66' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#3A3D4D', letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  sectionCard: { backgroundColor: '#16171D', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: '#1E1F28' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#EF444440', borderRadius: 14,
    paddingVertical: 15, backgroundColor: '#EF444410', marginBottom: 24,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  versionText: { textAlign: 'center', color: '#2A2D3A', fontSize: 12 },
});
