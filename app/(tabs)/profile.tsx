import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/useAuth';
import { profileApi } from '@/src/api/profile.api';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { useToast } from '@/src/components/ui/Toast';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/format';

const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

type ProfileForm = {
  fullName: string;
  phoneNumber: string;
  address: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;
type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

const getProfileFormFromUser = (user?: {
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
} | null): ProfileForm => ({
  fullName: user?.fullName || '',
  phoneNumber: user?.phoneNumber || '',
  address: user?.address || '',
});

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const getErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { showToast } = useToast();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(() => getProfileFormFromUser(user));
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    setProfileForm(getProfileFormFromUser(user));
  }, [user]);

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

  const validateProfileForm = () => {
    const nextErrors: ProfileErrors = {};

    if (!profileForm.fullName.trim()) {
      nextErrors.fullName = 'Họ và tên không được để trống';
    }

    if (profileForm.phoneNumber.trim() && !PHONE_REGEX.test(profileForm.phoneNumber.trim())) {
      nextErrors.phoneNumber = 'Số điện thoại phải gồm 10 số và bắt đầu bằng 03, 05, 07, 08, 09';
    }

    return nextErrors;
  };

  const validatePasswordForm = () => {
    const nextErrors: PasswordErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      nextErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    return nextErrors;
  };

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setProfileErrors({});
    setProfileForm(getProfileFormFromUser(user));
  };

  const handleOpenEditForm = () => {
    setShowEditForm(true);
    setShowPasswordForm(false);
    setProfileErrors({});
    setProfileForm(getProfileFormFromUser(user));
  };

  const handleTogglePasswordForm = () => {
    setShowPasswordForm((prev) => !prev);
    setShowEditForm(false);
    setPasswordErrors({});
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };

  const handleSubmitProfile = async () => {
    const nextErrors = validateProfileForm();
    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await profileApi.updateMyProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || null,
        address: profileForm.address.trim() || null,
      });

      updateUser(response.user);
      setProfileForm(getProfileFormFromUser(response.user));
      setShowEditForm(false);
      showToast(response.message || 'Cập nhật thành công!');
    } catch (error) {
      showToast(getErrorMessage(error, 'Không thể cập nhật thông tin'), 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitPassword = async () => {
    const nextErrors = validatePasswordForm();
    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await profileApi.changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setShowPasswordForm(false);
      setPasswordErrors({});
      showToast(response.message || 'Đổi mật khẩu thành công!');
    } catch (error) {
      showToast(getErrorMessage(error, 'Không thể đổi mật khẩu'), 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof PasswordForm) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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
  const isGoogleAccount = Boolean(user?.isGoogleAccount);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.titleLG, styles.headerTitle]}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.badgeText}>{isGoogleAccount ? 'Google Account' : 'Thành viên'}</Text>
          </View>
        </View>

        <View style={styles.menuBox}>
          <Text style={styles.menuGroupTitle}>Thông tin tài khoản</Text>

          <InfoRow icon="user" label="Họ và tên" value={user?.fullName || 'Chưa cập nhật'} />
          <InfoRow icon="envelope" label="Email" value={user?.email || 'Chưa cập nhật'} />
          <InfoRow icon="phone" label="Số điện thoại" value={user?.phoneNumber || 'Chưa cập nhật'} />
          <InfoRow icon="map-marker" label="Địa chỉ" value={user?.address || 'Chưa cập nhật'} />
          <InfoRow icon="calendar" label="Thành viên từ" value={joinDate} isLast />

          <View style={styles.sectionActions}>
            <Button
              label="Chỉnh sửa thông tin"
              size="md"
              onPress={handleOpenEditForm}
              style={styles.sectionActionButton}
            />
            <Button
              label={isGoogleAccount ? 'Quản lý mật khẩu' : 'Đổi mật khẩu'}
              variant="secondary"
              size="md"
              onPress={handleTogglePasswordForm}
              style={styles.sectionActionButton}
            />
          </View>
        </View>

        {showEditForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Chỉnh sửa thông tin</Text>
            <Text style={styles.formSubtitle}>Email được giữ nguyên. Bạn có thể cập nhật họ tên, số điện thoại và địa chỉ.</Text>

            <TextField
              label="Họ và tên *"
              placeholder="Nhập họ và tên"
              value={profileForm.fullName}
              onChangeText={(text) => handleProfileChange('fullName', text)}
              autoCapitalize="words"
              error={profileErrors.fullName}
            />

            <TextField
              label="Số điện thoại"
              placeholder="VD: 0912345678"
              value={profileForm.phoneNumber}
              onChangeText={(text) => handleProfileChange('phoneNumber', text)}
              keyboardType="phone-pad"
              error={profileErrors.phoneNumber}
            />

            <Text style={styles.helperText}>Số điện thoại hợp lệ phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.</Text>

            <TextField
              label="Địa chỉ"
              placeholder="Nhập địa chỉ của bạn"
              value={profileForm.address}
              onChangeText={(text) => handleProfileChange('address', text)}
              autoCapitalize="words"
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <Button
                label="Hủy"
                variant="secondary"
                size="md"
                onPress={handleCancelEdit}
                style={styles.formActionHalf}
              />
              <Button
                label={profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                variant={profileLoading ? 'loading' : 'primary'}
                size="md"
                onPress={handleSubmitProfile}
                style={styles.formActionHalf}
              />
            </View>
          </View>
        )}

        {showPasswordForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Bảo mật tài khoản</Text>
            {isGoogleAccount ? (
              <View style={styles.googleNotice}>
                <FontAwesome name="google" size={18} color={T.color.primary} />
                <Text style={styles.googleNoticeText}>Tài khoản Google, quản lý mật khẩu trên Google.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.formSubtitle}>Mật khẩu mới phải có ít nhất 8 ký tự và không được trùng mật khẩu hiện tại.</Text>

                <TextField
                  label="Mật khẩu hiện tại *"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                  secureTextEntry={!showPasswords.currentPassword}
                  error={passwordErrors.currentPassword}
                  suffix={
                    <Pressable onPress={() => togglePasswordVisibility('currentPassword')} hitSlop={8}>
                      <FontAwesome
                        name={showPasswords.currentPassword ? 'eye-slash' : 'eye'}
                        size={16}
                        color={T.color.text3}
                      />
                    </Pressable>
                  }
                />

                <TextField
                  label="Mật khẩu mới *"
                  placeholder="Tối thiểu 8 ký tự"
                  value={passwordForm.newPassword}
                  onChangeText={(text) => handlePasswordChange('newPassword', text)}
                  secureTextEntry={!showPasswords.newPassword}
                  error={passwordErrors.newPassword}
                  suffix={
                    <Pressable onPress={() => togglePasswordVisibility('newPassword')} hitSlop={8}>
                      <FontAwesome
                        name={showPasswords.newPassword ? 'eye-slash' : 'eye'}
                        size={16}
                        color={T.color.text3}
                      />
                    </Pressable>
                  }
                />

                <TextField
                  label="Xác nhận mật khẩu mới *"
                  placeholder="Nhập lại mật khẩu mới"
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                  secureTextEntry={!showPasswords.confirmPassword}
                  error={passwordErrors.confirmPassword}
                  suffix={
                    <Pressable onPress={() => togglePasswordVisibility('confirmPassword')} hitSlop={8}>
                      <FontAwesome
                        name={showPasswords.confirmPassword ? 'eye-slash' : 'eye'}
                        size={16}
                        color={T.color.text3}
                      />
                    </Pressable>
                  }
                />

                <View style={styles.formActions}>
                  <Button
                    label="Đóng"
                    variant="secondary"
                    size="md"
                    onPress={handleTogglePasswordForm}
                    style={styles.formActionHalf}
                  />
                  <Button
                    label={passwordLoading ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
                    variant={passwordLoading ? 'loading' : 'primary'}
                    size="md"
                    onPress={handleSubmitPassword}
                    style={styles.formActionHalf}
                  />
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.menuBox}>
          <Text style={styles.menuGroupTitle}>Tiện ích</Text>

          <Pressable onPress={() => router.push('/wallet' as any)} style={styles.menuItemButton}>
            <View style={styles.menuLeft}>
              <FontAwesome name="credit-card" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Ví BookEat</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={T.color.text3} />
          </Pressable>

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

          <Pressable onPress={() => router.push('/settings/ip')} style={[styles.menuItemButton, styles.menuItemButtonLast]}>
            <View style={styles.menuLeft}>
              <FontAwesome name="cogs" size={16} color={T.color.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Cấu hình IP máy chủ</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={T.color.text3} />
          </Pressable>
        </View>

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

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.menuItem, isLast && styles.menuItemLast]}>
      <View style={styles.menuLeft}>
        <FontAwesome name={icon} size={16} color={T.color.primary} style={styles.menuIcon} />
        <Text style={styles.menuText}>{label}</Text>
      </View>
      <Text style={styles.menuRightText}>{value}</Text>
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
    gap: T.space.base,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
  menuItemButtonLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
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
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: T.space.sm,
    marginTop: T.space.md,
    paddingHorizontal: T.space.sm,
  },
  sectionActionButton: {
    flex: 1,
  },
  formCard: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.lg,
    padding: T.space.lg,
    gap: T.space.md,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  formSubtitle: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  helperText: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: -4,
  },
  formActions: {
    flexDirection: 'row',
    gap: T.space.sm,
    marginTop: T.space.xs,
  },
  formActionHalf: {
    flex: 1,
  },
  googleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.sm,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
    borderRadius: T.radius.md,
    padding: T.space.md,
  },
  googleNoticeText: {
    flex: 1,
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 19,
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
