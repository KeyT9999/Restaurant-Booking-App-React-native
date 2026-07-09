import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerVouchersScreen() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getVouchers(activeRestaurant.id);
      if (res.success) {
        setVouchers(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching owner vouchers:', error);
      showToast('Không thể lấy danh sách voucher', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [activeRestaurant]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      // Optimistic UI update
      setVouchers((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: newStatus } : v))
      );

      const res = await ownerApi.changeVoucherStatus(id, newStatus);
      if (res.success) {
        showToast(
          `Đã chuyển trạng thái sang ${newStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}`,
          'success'
        );
      } else {
        // Revert
        setVouchers((prev) =>
          prev.map((v) => (v._id === id ? { ...v, status: currentStatus } : v))
        );
        showToast('Thao tác thất bại', 'error');
      }
    } catch (e: any) {
      // Revert
      setVouchers((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: currentStatus } : v))
      );
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  const handleDelete = (id: string, code: string) => {
    Alert.alert('Xoá voucher', `Bạn có chắc chắn muốn xoá mã voucher "${code}" không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteVoucher(id);
            if (res.success) {
              showToast('Đã xoá voucher thành công', 'success');
              fetchVouchers(false);
            } else {
              showToast(res.message || 'Xoá voucher thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Không thể xoá voucher', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const formatDiscount = (v: any) => {
    if (v.discountType === 'percentage') {
      return `Giảm ${v.discountValue}%`;
    }
    return `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)}`;
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Voucher" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Add Voucher Action Button */}
        <TouchableOpacity
          style={styles.addVoucherBtn}
          onPress={() => router.push('/owner/voucher/form')}
        >
          <FontAwesome name="plus" size={13} color={T.color.text1} style={{ marginRight: 8 }} />
          <Text style={styles.addVoucherBtnText}>Tạo voucher mới</Text>
        </TouchableOpacity>

        {/* Voucher List */}
        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="tags" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Nhà hàng chưa có mã khuyến mãi nào</Text>
          </View>
        ) : (
          vouchers.map((item) => {
            const isActive = item.status === 'active';
            const expDate = new Date(item.endDate).toLocaleDateString('vi-VN');
            const hasExpired = new Date(item.endDate) < new Date();

            return (
              <View key={item._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.codeWrapper}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    {hasExpired && <Text style={styles.expiredLabel}>Hết hạn</Text>}
                  </View>

                  <View style={styles.switchCol}>
                    <Text style={[styles.statusLabelText, isActive ? styles.statusLabelTextOn : styles.statusLabelTextOff]}>
                      {isActive ? 'Bật' : 'Tắt'}
                    </Text>
                    <Switch
                      value={isActive}
                      disabled={hasExpired}
                      onValueChange={() => handleToggleStatus(item._id, item.status)}
                      trackColor={{ false: '#3A4255', true: 'rgba(16, 185, 129, 0.4)' }}
                      thumbColor={isActive ? T.color.success : T.color.text3}
                    />
                  </View>
                </View>

                {/* Info body */}
                <Text style={styles.discountValueText}>{formatDiscount(item)}</Text>
                <Text style={styles.nameText}>{item.name}</Text>
                {item.description ? <Text style={styles.descText}>{item.description}</Text> : null}

                <View style={styles.detailsDivider} />

                {/* Footer details */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerCol}>
                    <Text style={styles.footerLabel}>HẠN DÙNG</Text>
                    <Text style={styles.footerValue}>{expDate}</Text>
                  </View>
                  <View style={styles.footerCol}>
                    <Text style={styles.footerLabel}>ĐÃ DÙNG</Text>
                    <Text style={styles.footerValue}>{item.currentUsage || 0} lượt</Text>
                  </View>
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push(`/owner/voucher/form?id=${item._id}` as any)}
                    >
                      <FontAwesome name="pencil" size={13} color={T.color.text2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(item._id, item.code)}
                    >
                      <FontAwesome name="trash" size={13} color={T.color.error} />
                    </TouchableOpacity>
                  </View>
                </View>
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
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.lg,
    paddingBottom: T.space['3xl'],
  },
  addVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
    marginBottom: T.space.lg,
  },
  addVoucherBtnText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: T.space.sm,
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.sm,
  },
  codeText: {
    color: T.color.primary,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.sm,
  },
  expiredLabel: {
    color: T.color.error,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: T.radius.sm,
  },
  switchCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusLabelTextOn: {
    color: T.color.success,
  },
  statusLabelTextOff: {
    color: T.color.text3,
  },
  discountValueText: {
    color: T.color.text1,
    fontSize: 18,
    fontWeight: '700',
    marginTop: T.space.xs,
  },
  nameText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  descText: {
    color: T.color.text2,
    fontSize: 12,
    marginTop: 4,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: T.space.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCol: {
    flex: 1.2,
  },
  footerLabel: {
    color: T.color.text3,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerValue: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    gap: T.space.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
