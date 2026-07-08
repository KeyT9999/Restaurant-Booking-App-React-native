import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { voucherApi } from '@/src/api/voucher.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface VoucherDetailData {
  id: string;
  _id?: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isSaved?: boolean;
  restaurantId?: {
    id: string;
    _id?: string;
    name: string;
    logo?: string;
    images?: Array<{ url: string; isPrimary: boolean }>;
    address?: {
      street: string;
      ward: string;
      district: string;
      city: string;
    };
  };
}

export default function VoucherDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<VoucherDetailData | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadVoucherDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await voucherApi.getById(id);
      if (res.success && res.data) {
        setVoucher(res.data);
      } else {
        showToast('Không tìm thấy thông tin ưu đãi', 'error');
        router.back();
      }
    } catch (error) {
      console.warn('Lỗi tải chi tiết voucher:', error);
      showToast('Không thể tải chi tiết ưu đãi lúc này', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoucherDetail();
  }, [id]);

  const handleClaim = async () => {
    if (!voucher || claiming) return;
    setClaiming(true);
    try {
      const res = await voucherApi.saveVoucher(voucher.id || voucher._id || '');
      if (res.success) {
        showToast('Đã lưu ưu đãi thành công vào ví! 🎁', 'success');
        setVoucher(prev => prev ? { ...prev, isSaved: true } : null);
      } else {
        showToast(res.message || 'Lưu mã thất bại', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi lưu mã', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleUseNow = () => {
    if (!voucher) return;
    const restId = voucher.restaurantId?.id || voucher.restaurantId?._id;
    if (restId) {
      // Navigate straight to restaurant detail for booking
      router.push(`/restaurants/${restId}`);
    } else {
      // General voucher, go to home or search screen
      router.push('/(tabs)');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!voucher) return null;

  const discountText =
    voucher.discountType === 'percentage'
      ? `${voucher.discountValue}%`
      : formatCurrency(voucher.discountValue);

  const restInfo = voucher.restaurantId;
  const isSaved = voucher.isSaved === true;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.headerTitle]} numberOfLines={1}>Chi tiết ưu đãi</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Golden Ticket Card */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.ticketCard}>
          {/* Top Notch Section (Golden border theme) */}
          <View style={styles.ticketTop}>
            <View style={styles.glowDot} />
            <Text style={styles.ticketHeader}>MÃ KHUYẾN MÃI</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{voucher.code}</Text>
            </View>
            <Text style={styles.discountValueText}>{discountText}</Text>
            <Text style={styles.discountLabelText}>GIẢM GIÁ ĐẶT CỌC BÀN</Text>
          </View>

          {/* Ticket Dashed Separator with punch notches */}
          <View style={styles.ticketDivider}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.notchRight} />
          </View>

          {/* Ticket Bottom Section */}
          <View style={styles.ticketBottom}>
            <Text style={styles.ticketTitle}>{voucher.title || 'Ưu đãi đặc biệt'}</Text>
            <Text style={styles.ticketDesc}>{voucher.description || 'Áp dụng cho dịch vụ đặt cọc giữ bàn trực tuyến tại hệ thống BookEat.'}</Text>
            
            <View style={styles.infoRow}>
              <FontAwesome name="calendar" size={14} color={T.color.text3} style={{ width: 20 }} />
              <Text style={styles.infoText}>
                Hiệu lực: <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{formatDate(voucher.startDate)}</Text> - <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{formatDate(voucher.endDate)}</Text>
              </Text>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome name="money" size={14} color={T.color.text3} style={{ width: 20 }} />
              <Text style={styles.infoText}>
                Đơn tối thiểu: <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{formatCurrency(voucher.minOrderAmount || 0)}</Text>
              </Text>
            </View>

            {voucher.maxDiscountAmount && (
              <View style={styles.infoRow}>
                <FontAwesome name="info-circle" size={14} color={T.color.text3} style={{ width: 20 }} />
                <Text style={styles.infoText}>
                  Giảm tối đa: <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{formatCurrency(voucher.maxDiscountAmount)}</Text>
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Participating Restaurant Section */}
        {restInfo ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Áp dụng tại nhà hàng</Text>
            <View style={styles.restaurantRow}>
              <Image
                source={{ uri: restInfo.images?.[0]?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150' }}
                style={styles.restLogo}
              />
              <View style={styles.restInfo}>
                <Text style={styles.restName}>{restInfo.name}</Text>
                <Text style={styles.restAddress} numberOfLines={2}>
                  <FontAwesome name="map-marker" size={12} color={T.color.text3} />{' '}
                  {restInfo.address ? `${restInfo.address.street}, ${restInfo.address.ward}, ${restInfo.address.district}, ${restInfo.address.city}` : 'Địa chỉ đang cập nhật'}
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Phạm vi áp dụng</Text>
            <View style={styles.generalApplyRow}>
              <FontAwesome name="globe" size={24} color={T.color.primary} />
              <Text style={styles.generalApplyText}>
                Áp dụng cho tất cả nhà hàng đối tác trên hệ thống BookEat toàn quốc.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Terms & Conditions */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Điều khoản và Điều kiện</Text>
          <View style={styles.termsList}>
            <Text style={styles.termItem}>• Ưu đãi chỉ áp dụng khi thanh toán đặt cọc trực tuyến qua ứng dụng BookEat.</Text>
            <Text style={styles.termItem}>• Mỗi tài khoản khách hàng chỉ được lưu và sử dụng mã ưu đãi tối đa 1 lần.</Text>
            <Text style={styles.termItem}>• Ưu đãi không thể quy đổi thành tiền mặt hoặc chuyển nhượng.</Text>
            <Text style={styles.termItem}>• Không áp dụng đồng thời với các chương trình khuyến mãi khác của nhà hàng.</Text>
            <Text style={styles.termItem}>• BookEat có quyền hủy bỏ hoặc thay đổi điều khoản ưu đãi trong trường hợp phát hiện gian lận.</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {isSaved ? (
          <Pressable onPress={handleUseNow} style={styles.primaryBtn}>
            <FontAwesome name="calendar" size={15} color="#0C0F16" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Đặt bàn dùng ngay</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleClaim} style={styles.primaryBtn} disabled={claiming}>
            {claiming ? (
              <ActivityIndicator size="small" color="#0C0F16" />
            ) : (
              <>
                <FontAwesome name="gift" size={15} color="#0C0F16" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Lưu ưu đãi vào ví</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
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
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: T.space.lg,
  },
  ticketCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.3)',
    marginTop: T.space.lg,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: T.space.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 150, 83, 0.02)',
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.color.primary,
    marginBottom: T.space.xs,
    shadowColor: T.color.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  ticketHeader: {
    color: T.color.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  codeBadge: {
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.25)',
    borderRadius: T.radius.sm,
    paddingHorizontal: T.space.md,
    paddingVertical: 5,
    marginVertical: T.space.md,
  },
  codeText: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  discountValueText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    fontFamily: T.font.displayBlack,
  },
  discountLabelText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: T.space.xs,
  },
  ticketDivider: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 150, 83, 0.2)',
  },
  notchLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.color.bg,
    position: 'absolute',
    left: -12,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.3)',
  },
  notchRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.color.bg,
    position: 'absolute',
    right: -12,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.3)',
  },
  ticketBottom: {
    padding: T.space.xl,
  },
  ticketTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: T.space.sm,
  },
  ticketDesc: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: T.space.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  infoText: {
    color: T.color.text2,
    fontSize: 13,
    marginLeft: T.space.sm,
  },
  sectionCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    marginTop: T.space.md,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restLogo: {
    width: 50,
    height: 50,
    borderRadius: T.radius.sm,
    marginRight: T.space.md,
  },
  restInfo: {
    flex: 1,
  },
  restName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  restAddress: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  generalApplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
  },
  generalApplyText: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  termsList: {
    gap: 8,
  },
  termItem: {
    color: T.color.text3,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C0F16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: T.space.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.color.primary,
    borderRadius: T.radius.lg,
    height: 48,
    width: '100%',
  },
  btnText: {
    color: '#0C0F16',
    fontSize: 14,
    fontWeight: '700',
  },
});
