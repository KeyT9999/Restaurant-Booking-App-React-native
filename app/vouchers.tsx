import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { voucherApi } from '@/src/api/voucher.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { formatDate, formatCurrency } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

type TabType = 'my' | 'explore';

interface VoucherItem {
  id: string;
  _id?: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  endDate: string;
  isSaved?: boolean;
  restaurantId?: any;
}

export default function VouchersWalletScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [platformVouchers, setPlatformVouchers] = useState<VoucherItem[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (activeTab === 'my') {
        const res = await voucherApi.getMyVouchers({ filter: 'active' });
        if (res.success && res.data) {
          setMyVouchers(res.data || []);
        }
      } else {
        const res = await voucherApi.getPlatformVouchers();
        if (res.success && res.data) {
          setPlatformVouchers(res.data || []);
        }
      }
    } catch (error) {
      console.warn('Lỗi tải danh sách voucher:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVouchers();
  };

  const handleClaimVoucher = async (voucherId: string) => {
    if (claimingId) return;
    setClaimingId(voucherId);
    try {
      const res = await voucherApi.saveVoucher(voucherId);
      if (res.success) {
        showToast('Lưu voucher vào ví thành công! 🎁', 'success');
        // Update local state isSaved flag
        setPlatformVouchers((prev) =>
          prev.map((v) => (v.id === voucherId || v._id === voucherId ? { ...v, isSaved: true } : v))
        );
      } else {
        showToast(res.message || 'Lưu thất bại', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu voucher';
      showToast(msg, 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setLoading(true);
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="ticket" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Ví voucher ưu đãi</Text>
        <Text style={styles.guestSubtitle}>Vui lòng đăng nhập tài khoản để nhận và áp dụng mã giảm giá ưu đãi khi đặt bàn.</Text>
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
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Ví ưu đãi</Text>
        </View>
      </View>

      {/* ─── Tab Switcher ─── */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => handleTabChange('my')}
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>Mã của tôi</Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('explore')}
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>Nhận ưu đãi</Text>
        </Pressable>
      </View>

      {/* ─── List Content ─── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={100} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      ) : activeTab === 'my' ? (
        myVouchers.length > 0 ? (
          <FlatList
            data={myVouchers}
            keyExtractor={(item) => item.id || item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
            }
            renderItem={({ item }) => {
              // item is customerVoucher record having populated voucherId object
              const v: VoucherItem = item.voucherId || {};
              const discountText =
                v.discountType === 'percentage'
                  ? `Giảm ${v.discountValue}%`
                  : `Giảm ${formatCurrency(v.discountValue)}`;

              const restInfo = v.restaurantId || {};
              return (
                <View style={styles.voucherCard}>
                  <View style={styles.cardLeft}>
                    <FontAwesome name="ticket" size={24} color={T.color.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.codeText}>{v.code}</Text>
                    <Text style={styles.titleText}>{v.title || discountText}</Text>
                    <Text style={styles.descText} numberOfLines={1}>{v.description || 'Áp dụng cho đặt cọc bàn'}</Text>
                    {restInfo.name && <Text style={styles.restText}>Chỉ tại: {restInfo.name}</Text>}
                    <Text style={styles.timeText}>HSD: {formatDate(v.endDate)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={styles.savedBadge}>
                      <Text style={styles.savedText}>Đã Lưu</Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <EmptyState
            icon="ticket"
            title="Ví ưu đãi đang trống"
            description="Hãy chuyển sang tab Nhận ưu đãi để thu thập các mã giảm giá hấp dẫn."
            style={{ flex: 0.8 }}
          />
        )
      ) : platformVouchers.length > 0 ? (
        <FlatList
          data={platformVouchers}
          keyExtractor={(item) => item.id || item._id || ''}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.color.primary} />
          }
          renderItem={({ item }) => {
            const discountText =
              item.discountType === 'percentage'
                ? `Giảm ${item.discountValue}%`
                : `Giảm ${formatCurrency(item.discountValue)}`;

            const isSaved = item.isSaved === true;
            const itemRealId = item.id || item._id || '';

            return (
              <View style={styles.voucherCard}>
                <View style={styles.cardLeft}>
                  <FontAwesome name="gift" size={24} color={T.color.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Text style={styles.titleText}>{item.title || discountText}</Text>
                  <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.timeText}>HSD: {formatDate(item.endDate)}</Text>
                </View>
                <View style={styles.cardRight}>
                  {isSaved ? (
                    <View style={styles.savedBadge}>
                      <Text style={styles.savedText}>Đã Lưu</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleClaimVoucher(itemRealId)}
                      disabled={claimingId === itemRealId}
                      style={styles.claimBtn}
                    >
                      {claimingId === itemRealId ? (
                        <ActivityIndicator size="small" color="#0C0F16" />
                      ) : (
                        <Text style={styles.claimBtnText}>Lưu mã</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : (
        <EmptyState
          icon="gift"
          title="Không có ưu đãi khả dụng"
          description="Hiện tại chưa có đợt ưu đãi giảm giá nào trên hệ thống."
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: T.space.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: T.space.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: T.color.primary,
  },
  tabText: {
    color: T.color.text3,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: T.color.primary,
  },
  listContent: {
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: 40,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    marginBottom: T.space.md,
  },
  cardLeft: {
    width: 48,
    height: 48,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(212, 150, 83, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
  },
  cardContent: {
    flex: 1,
    marginRight: T.space.sm,
  },
  codeText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  descText: {
    color: T.color.text2,
    fontSize: 11,
    marginTop: 2,
  },
  restText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  timeText: {
    color: T.color.text3,
    fontSize: 10,
    marginTop: 4,
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  savedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  savedText: {
    color: T.color.text3,
    fontSize: 10,
    fontWeight: '600',
  },
  claimBtn: {
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    color: '#0C0F16',
    fontSize: 11,
    fontWeight: '700',
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
