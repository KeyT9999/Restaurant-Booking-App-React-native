import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function BillingScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // 1. Get current subscription
      const subRes = await ownerApi.getCurrentSubscription();
      if (subRes.success) {
        setSub(subRes.data);
      }

      // 2. Get billing plans
      const plansRes = await ownerApi.getBillingPlans();
      if (plansRes.success) {
        setPlans(plansRes.data || []);
      }
    } catch (error) {
      console.warn('Error fetching billing info, showing mock plans:', error);
      // Fallback mocks
      setSub({
        planCode: 'free',
        planName: 'Gói Miễn Phí (Free)',
        status: 'active',
        endDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
      });
      setPlans([
        { code: 'free', name: 'Free Plan', price: 0, limit: 1, desc: 'Dành cho nhà hàng nhỏ trải nghiệm.' },
        { code: 'plus', name: 'Plus Plan', price: 299000, limit: 3, desc: 'Tối đa 3 nhà hàng, hỗ trợ đặt lịch nhanh.' },
        { code: 'pro', name: 'Pro Plan', price: 599000, limit: 10, desc: 'Tối đa 10 nhà hàng, tích hợp AI tư vấn.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (planCode: string) => {
    if (planCode === sub?.planCode) {
      showToast('Bạn đang sử dụng gói này rồi!', 'info');
      return;
    }

    try {
      showToast('Đang khởi tạo thanh toán...', 'info');
      const res = await ownerApi.checkoutSubscriptionPlan(planCode);
      if (res.success && res.data?.checkoutUrl) {
        Linking.openURL(res.data.checkoutUrl);
      } else {
        showToast('Không thể tạo liên kết thanh toán', 'error');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Lỗi nâng cấp gói dịch vụ';
      showToast(errMsg, 'error');
    }
  };

  const getPlanColor = (code: string) => {
    switch (code) {
      case 'pro': return { border: '#D49653', bg: '#271911', badge: 'PRO' };
      case 'plus': return { border: '#10B981', bg: 'rgba(16, 185, 129, 0.05)', badge: 'PLUS' };
      default: return { border: T.color.border, bg: T.color.card, badge: 'FREE' };
    }
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Gói dịch vụ & Thanh toán" showBack={true} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Current Subscription Card */}
          <View style={styles.currentSubCard}>
            <View style={styles.subHeader}>
              <View>
                <Text style={styles.subLabel}>GÓI DỊCH VỤ HIỆN TẠI</Text>
                <Text style={styles.subTitle}>{sub?.planName || 'Free Plan'}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
              </View>
            </View>

            <View style={styles.subDivider} />

            <View style={styles.subFooter}>
              <View>
                <Text style={styles.expiryLabel}>Ngày hết hạn / Gia hạn</Text>
                <Text style={styles.expiryValue}>
                  {sub?.endDate ? new Date(sub.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.walletLink}
                onPress={() => router.push('/owner/wallet/index' as any)}
              >
                <Text style={styles.walletLinkText}>Xem ví doanh thu</Text>
                <FontAwesome name="angle-right" size={14} color={T.color.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing Plans Section */}
          <Text style={styles.sectionTitle}>Nâng cấp & Đổi gói dịch vụ</Text>
          <View style={styles.plansGrid}>
            {plans.map((p) => {
              const theme = getPlanColor(p.code);
              const isCurrent = p.code === sub?.planCode;
              
              return (
                <View
                  key={p.code}
                  style={[
                    styles.planCard,
                    { borderColor: theme.border, backgroundColor: theme.bg }
                  ]}
                >
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>{p.name}</Text>
                      <Text style={styles.planDesc}>{p.desc}</Text>
                    </View>
                    <View style={[styles.planBadge, { borderColor: theme.border }]}>
                      <Text style={[styles.planBadgeText, { color: theme.border }]}>{theme.badge}</Text>
                    </View>
                  </View>

                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>
                      {p.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                    </Text>
                    {p.price > 0 && <Text style={styles.planPeriod}>/ tháng</Text>}
                  </View>

                  <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                      <FontAwesome name="check-circle" size={12} color={T.color.primary} />
                      <Text style={styles.featureText}>Quản lý tối đa {p.limit} nhà hàng</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <FontAwesome name="check-circle" size={12} color={T.color.primary} />
                      <Text style={styles.featureText}>Tích hợp đặt bàn & xếp hàng chờ</Text>
                    </View>
                    {p.code !== 'free' && (
                      <View style={styles.featureItem}>
                        <FontAwesome name="check-circle" size={12} color={T.color.primary} />
                        <Text style={styles.featureText}>Báo cáo thống kê & VIP support</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isCurrent && styles.actionBtnCurrent,
                      { backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.05)' : T.color.primary }
                    ]}
                    disabled={isCurrent}
                    onPress={() => handleUpgrade(p.code)}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: isCurrent ? T.color.text3 : '#0C0F16' }
                      ]}
                    >
                      {isCurrent ? 'Gói hiện tại' : 'Đăng ký ngay'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    paddingBottom: T.space['4xl'],
  },
  currentSubCard: {
    backgroundColor: '#271911',
    borderColor: 'rgba(212, 150, 83, 0.25)',
    borderWidth: 1,
    borderRadius: T.radius.xl,
    padding: T.space.xl,
    marginBottom: T.space.xl,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subLabel: {
    color: 'rgba(212, 150, 83, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: T.color.success,
    fontSize: 10,
    fontWeight: '700',
  },
  subDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: T.space.lg,
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryLabel: {
    color: T.color.text3,
    fontSize: 10.5,
    marginBottom: 2,
  },
  expiryValue: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  walletLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletLinkText: {
    color: T.color.primary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  plansGrid: {
    gap: T.space.lg,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  planDesc: {
    color: T.color.text3,
    fontSize: 11.5,
    lineHeight: 16,
  },
  planBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: T.space.md,
  },
  planPrice: {
    color: T.color.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  planPeriod: {
    color: T.color.text3,
    fontSize: 13,
    marginLeft: 4,
  },
  featuresRow: {
    gap: T.space.xs,
    marginBottom: T.space.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: T.color.text2,
    fontSize: 12.5,
  },
  actionBtn: {
    height: 40,
    borderRadius: T.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnCurrent: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
