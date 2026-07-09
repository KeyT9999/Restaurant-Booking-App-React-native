import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminApi } from '../../../src/api/admin.api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Chờ duyệt',  color: '#e8955d', icon: 'clock' },
  approved:  { label: 'Hoạt động',  color: '#10B981', icon: 'check-circle' },
  suspended: { label: 'Tạm khóa',  color: '#EF4444', icon: 'slash' },
  rejected:  { label: 'Từ chối',   color: '#5C5C66', icon: 'x-circle' },
};

interface InfoRowProps { label: string; value?: string; }
const InfoRow = ({ label, value }: InfoRowProps) => (
  <View style={rowStyles.container}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value || '—'}</Text>
  </View>
);
const rowStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E1F28' },
  label: { fontSize: 13, color: '#5C5C66', flex: 1 },
  value: { fontSize: 13, color: '#FFF', fontWeight: '500', flex: 2, textAlign: 'right' },
});

export default function AdminRestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await adminApi.getRestaurantById(id!);
      if (res.success) setData(res.data);
      else setError(res.message || 'Lỗi tải dữ liệu');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải chi tiết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (id) fetchDetail(); }, [id]);

  const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'restore') => {
    const labelMap = { approve: 'Phê duyệt', reject: 'Từ chối', suspend: 'Tạm khóa', unsuspend: 'Mở khóa', restore: 'Khôi phục' };
    const isDestructive = action === 'reject' || action === 'suspend';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn ${labelMap[action]} nhà hàng "${data?.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: labelMap[action],
          style: isDestructive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await adminApi.updateRestaurantStatus(id!, action);
              if (res.success) {
                setData((prev: any) => ({ ...prev, ...res.data }));
                Alert.alert('Thành công', `Đã ${labelMap[action]} nhà hàng`);
              } else {
                Alert.alert('Lỗi', res.message || 'Không thể thực hiện');
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể thực hiện tác vụ');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Chi tiết Nhà hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator size="large" color="#e8955d" style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Chi tiết Nhà hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy nhà hàng'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[data.approvalStatus] || { label: data.approvalStatus, color: '#8A8A93', icon: 'help-circle' };

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={[styles.navHeader, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Chi tiết Nhà hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDetail(true)} tintColor="#e8955d" />}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{(data.name || '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{data.name}</Text>
            <Text style={styles.heroAddress} numberOfLines={2}>
              {[data.address?.street, data.address?.ward, data.address?.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
            <Feather name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {actionLoading ? (
          <View style={styles.actionLoadingRow}>
            <ActivityIndicator size="small" color="#e8955d" />
            <Text style={{ color: '#8A8A93', marginLeft: 10 }}>Đang xử lý...</Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            {data.approvalStatus === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.btnApprove]} onPress={() => handleAction('approve')}>
                  <Feather name="check" size={16} color="#10B981" />
                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Phê duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.btnReject]} onPress={() => handleAction('reject')}>
                  <Feather name="x" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Từ chối</Text>
                </TouchableOpacity>
              </>
            )}
            {data.approvalStatus === 'approved' && (
              <TouchableOpacity style={[styles.actionBtn, styles.btnReject, { flex: 1 }]} onPress={() => handleAction('suspend')}>
                <Feather name="slash" size={16} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Tạm khóa nhà hàng</Text>
              </TouchableOpacity>
            )}
            {data.approvalStatus === 'suspended' && (
              <TouchableOpacity style={[styles.actionBtn, styles.btnApprove, { flex: 1 }]} onPress={() => handleAction('unsuspend')}>
                <Feather name="unlock" size={16} color="#10B981" />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Mở khóa nhà hàng</Text>
              </TouchableOpacity>
            )}
            {data.deletedAt && (
              <TouchableOpacity style={[styles.actionBtn, styles.btnApprove, { flex: 1 }]} onPress={() => handleAction('restore')}>
                <Feather name="rotate-ccw" size={16} color="#3B82F6" />
                <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Khôi phục</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN LIÊN HỆ</Text>
          <View style={styles.sectionCard}>
            <InfoRow label="Chủ sở hữu" value={data.ownerId?.fullName || data.ownerId?.username} />
            <InfoRow label="Điện thoại" value={data.phone} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Website" value={data.website} />
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN KINH DOANH</Text>
          <View style={styles.sectionCard}>
            <InfoRow label="Ẩm thực" value={data.cuisineTypes?.join(', ')} />
            <InfoRow label="Khoảng giá" value={data.priceRange?.min && data.priceRange?.max ? `${data.priceRange.min.toLocaleString()} - ${data.priceRange.max.toLocaleString()} VNĐ` : undefined} />
            <InfoRow label="Số chỗ ngồi" value={data.capacity ? `${data.capacity} chỗ` : undefined} />
            <InfoRow label="Giờ mở cửa" value={
              data.openingHours?.open && data.openingHours?.close
                ? `${data.openingHours.open} - ${data.openingHours.close}`
                : undefined
            } />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THỐNG KÊ</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Đặt bàn</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.averageRating ? Number(data.averageRating).toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.reviewCount || 0}</Text>
              <Text style={styles.statLabel}>Review</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {data.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MÔ TẢ</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.descText}>{data.description}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },

  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16,
    backgroundColor: '#0F111A', borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1, textAlign: 'center', marginHorizontal: 8 },

  content: { padding: 16, paddingBottom: 40 },

  // Hero
  heroCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#16171D', borderRadius: 20, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1E1F28',
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#e8955d30', justifyContent: 'center', alignItems: 'center',
  },
  heroAvatarText: { fontSize: 24, fontWeight: '800', color: '#e8955d' },
  heroName: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 4, flex: 1 },
  heroAddress: { fontSize: 12, color: '#5C5C66', lineHeight: 18 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginBottom: 16, backgroundColor: '#16171D', borderRadius: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  btnApprove: { backgroundColor: '#10B98115', borderColor: '#10B98140' },
  btnReject: { backgroundColor: '#EF444415', borderColor: '#EF444440' },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Section
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#3A3D4D', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  sectionCard: { backgroundColor: '#16171D', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1E1F28' },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#16171D', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E1F28' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#e8955d', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#5C5C66' },

  descText: { fontSize: 14, color: '#8A8A93', lineHeight: 22, paddingVertical: 12 },

  // Error
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn: { backgroundColor: '#1E1F28', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#e8955d', fontWeight: '700', fontSize: 14 },
});
