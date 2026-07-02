import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  Pressable, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { useAuth } from '@/src/auth/useAuth';

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, label, description, onPress, rightElement, danger }: SettingRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress && !rightElement}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <FontAwesome name={icon as any} size={15} color={danger ? T.color.error : T.color.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: T.color.error }]}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {rightElement ?? (
        onPress ? <FontAwesome name="angle-right" size={16} color={T.color.text3} /> : null
      )}
    </Pressable>
  );
}

function SectionDivider({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [notifBooking, setNotifBooking] = useState(true);
  const [notifWaitlist, setNotifWaitlist] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi BookEat?',
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

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Xóa tài khoản',
      'Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa tài khoản', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.title]}>Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Account Section */}
        <SectionDivider title="Tài khoản" />
        <View style={styles.card}>
          <SettingRow
            icon="user-o"
            label="Thông tin cá nhân"
            description="Tên, số điện thoại, avatar"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock"
            label="Đổi mật khẩu"
            onPress={() => router.push('/(auth)/forgot-password')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star-o"
            label="Điểm thưởng & Hạng thành viên"
            onPress={() => router.push('/rewards')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="map-marker"
            label="Địa chỉ đã lưu"
            onPress={() => {}}
          />
        </View>

        {/* Notifications Section */}
        <SectionDivider title="Thông báo" />
        <View style={styles.card}>
          <SettingRow
            icon="bell-o"
            label="Xác nhận đặt bàn"
            description="Nhận thông báo khi đặt bàn được xác nhận"
            rightElement={
              <Switch
                value={notifBooking}
                onValueChange={setNotifBooking}
                trackColor={{ false: T.color.elevated, true: `${T.color.primary}88` }}
                thumbColor={notifBooking ? T.color.primary : T.color.text3}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="clock-o"
            label="Cập nhật hàng chờ"
            description="Thông báo khi bàn của bạn sẵn sàng"
            rightElement={
              <Switch
                value={notifWaitlist}
                onValueChange={setNotifWaitlist}
                trackColor={{ false: T.color.elevated, true: `${T.color.primary}88` }}
                thumbColor={notifWaitlist ? T.color.primary : T.color.text3}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="tag"
            label="Khuyến mãi & Ưu đãi"
            description="Voucher và ưu đãi mới"
            rightElement={
              <Switch
                value={notifPromo}
                onValueChange={setNotifPromo}
                trackColor={{ false: T.color.elevated, true: `${T.color.primary}88` }}
                thumbColor={notifPromo ? T.color.primary : T.color.text3}
              />
            }
          />
        </View>

        {/* Security */}
        <SectionDivider title="Bảo mật" />
        <View style={styles.card}>
          <SettingRow
            icon="fingerprint"
            label="Xác thực sinh trắc học"
            description="Touch ID / Face ID"
            rightElement={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: T.color.elevated, true: `${T.color.primary}88` }}
                thumbColor={biometric ? T.color.primary : T.color.text3}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="history"
            label="Lịch sử đăng nhập"
            onPress={() => {}}
          />
        </View>

        {/* App */}
        <SectionDivider title="Ứng dụng" />
        <View style={styles.card}>
          <SettingRow
            icon="wifi"
            label="Cấu hình máy chủ (IP)"
            description="Cài đặt địa chỉ backend"
            onPress={() => router.push('/settings/ip')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="language"
            label="Ngôn ngữ"
            description="Tiếng Việt"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info-circle"
            label="Về BookEat"
            description="Phiên bản 1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <SectionDivider title="Tài khoản" />
        <View style={styles.card}>
          <SettingRow
            icon="sign-out"
            label="Đăng xuất"
            onPress={handleLogout}
            danger
          />
          <View style={styles.divider} />
          <SettingRow
            icon="trash-o"
            label="Xóa tài khoản"
            description="Hành động này không thể hoàn tác"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <Text style={styles.version}>BookEat v1.0.0 • Made with ❤️ in Vietnam</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
  },
  title: { color: T.color.text1 },
  scroll: { paddingBottom: 48 },
  sectionHeader: {
    color: T.color.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: T.space.base, paddingTop: T.space.lg,
    paddingBottom: T.space.sm,
  },
  card: {
    backgroundColor: T.color.card, marginHorizontal: T.space.base,
    borderRadius: T.radius.xl, borderWidth: 1, borderColor: T.color.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: T.space.md, paddingVertical: T.space.md, gap: T.space.md,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(212,150,83,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: 'rgba(244,63,94,0.1)' },
  rowContent: { flex: 1 },
  rowLabel: { color: T.color.text1, fontSize: 14, fontWeight: '500' },
  rowDesc: { color: T.color.text3, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: T.color.border, marginLeft: 56 },
  version: {
    color: T.color.text3, fontSize: 12, textAlign: 'center',
    paddingTop: T.space.xl, paddingBottom: T.space.md,
  },
});
