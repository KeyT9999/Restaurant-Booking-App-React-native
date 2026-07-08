import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { bookingApi } from '@/src/api/booking.api';
import { restaurantApi } from '@/src/api/restaurant.api';
import { voucherApi } from '@/src/api/voucher.api';
import { paymentApi } from '@/src/api/payment.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { MenuItem } from '@/src/types/restaurant.types';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

export default function BookingSummary() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
    bookingDate: string;
    bookingTime: string;
    numberOfGuests: string;
    tableNumbers: string;
    depositAmount: string;
    preOrders?: string;
    voucherCode?: string;
    discountAmount?: string;
  }>();

  const restaurantId = params.restaurantId || '';
  const restaurantName = params.restaurantName || '';
  const bookingDate = params.bookingDate || '';
  const bookingTime = params.bookingTime || '';
  const numberOfGuests = parseInt(params.numberOfGuests || '2', 10);
  const tableNumbers = params.tableNumbers ? params.tableNumbers.split(',') : [];
  const baseDepositAmount = parseFloat(params.depositAmount || '0');

  // Contact States
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [occasion, setOccasion] = useState<string | null>(null);

  // Pre-order States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [preOrders, setPreOrders] = useState<{ [itemId: string]: number }>(() => {
    try {
      return params.preOrders ? JSON.parse(params.preOrders) : {};
    } catch (_) {
      return {};
    }
  });
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Voucher States
  const [voucherCode, setVoucherCode] = useState(params.voucherCode || '');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(
    params.voucherCode ? { code: params.voucherCode } : null
  );
  const [discountAmount, setDiscountAmount] = useState(parseFloat(params.discountAmount || '0'));
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Booking process state
  const [submitting, setSubmitting] = useState(false);

  const occasions = [
    { label: 'Sinh nhật 🎂', value: 'birthday' },
    { label: 'Kỷ niệm 💖', value: 'anniversary' },
    { label: 'Hẹn hò 🌹', value: 'date' },
    { label: 'Công việc 💼', value: 'business' },
    { label: 'Gia đình 🏠', value: 'family' },
    { label: 'Khác ✨', value: 'other' },
  ];

  // Fetch menu items for pre-ordering
  useEffect(() => {
    async function fetchMenu() {
      if (!restaurantId) return;
      try {
        const res = await restaurantApi.getMenu(restaurantId);
        if (res.success && res.data) {
          setMenuItems(res.data.menuItems || []);
        }
      } catch (error) {
        console.warn('Lỗi tải thực đơn đặt trước:', error);
      } finally {
        setLoadingMenu(false);
      }
    }
    fetchMenu();
  }, [restaurantId]);

  // Adjust pre-order quantity
  const handlePreOrderChange = (itemId: string, diff: number) => {
    const current = preOrders[itemId] || 0;
    const nextVal = Math.max(0, current + diff);
    if (nextVal === 0) {
      const nextPreOrders = { ...preOrders };
      delete nextPreOrders[itemId];
      setPreOrders(nextPreOrders);
    } else {
      setPreOrders({ ...preOrders, [itemId]: nextVal });
    }
  };

  // Validate Voucher Code
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    try {
      const res = await voucherApi.validateVoucher({
        code: voucherCode.toUpperCase().trim(),
        restaurantId,
        orderAmount: baseDepositAmount,
      });

      if (res.valid) {
        setAppliedVoucher(res.voucher);
        setDiscountAmount(res.discountAmount || 0);
        showToast('Áp dụng mã giảm giá thành công!', 'success');
      } else {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        showToast(res.reason || 'Mã giảm giá không hợp lệ', 'error');
      }
    } catch (error) {
      showToast('Lỗi kiểm tra mã giảm giá', 'error');
    } finally {
      setValidatingVoucher(false);
    }
  };

  const getPreOrderPayload = () => {
    const list: any[] = [];
    Object.keys(preOrders).forEach((itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
      if (item && preOrders[itemId] > 0) {
        list.push({
          menuItemId: itemId,
          nameSnapshot: item.name,
          priceSnapshot: item.price,
          quantity: preOrders[itemId],
        });
      }
    });
    return list;
  };

  const finalAmount = Math.max(0, baseDepositAmount - discountAmount);

  const getPreOrdersList = () => {
    const list: any[] = [];
    Object.keys(preOrders).forEach((itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
      if (item && preOrders[itemId] > 0) {
        list.push({
          item,
          quantity: preOrders[itemId]
        });
      }
    });
    return list;
  };

  const preOrdersList = getPreOrdersList();
  const preOrderTotalAmount = preOrdersList.reduce((sum, current) => sum + current.item.price * current.quantity, 0);
  const foodDepositAmount = Math.round(0.1 * preOrderTotalAmount);
  const tableDepositAmount = Math.max(0, baseDepositAmount - foodDepositAmount);

  // Submit and open payment gateway
  const handleSubmitBooking = async () => {
    if (!customerName || !customerPhone || !customerEmail) {
      showToast('Vui lòng điền đầy đủ thông tin liên hệ', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const preOrderItems = getPreOrderPayload();
      const payload: any = {
        restaurantId,
        bookingDate,
        bookingTime,
        numberOfGuests,
        customerName,
        customerPhone,
        customerEmail,
        specialRequests: specialRequests || null,
        occasion: occasion || null,
        tableNumbers,
        preOrderItems,
      };

      if (appliedVoucher) {
        payload.voucherCode = appliedVoucher.code;
      }

      // 1. Create booking in Backend
      const res = await bookingApi.createBooking(payload);
      if (res.success && res.data) {
        const booking = res.data;

        // Release holds
        try {
          await bookingApi.releaseHolds({ restaurantId, bookingDate, bookingTime });
        } catch (e) {
          // Ignore release failure
        }

        // 2. Process payments if needed
        if (booking.finalAmount > 0) {
          const payRes = await paymentApi.createPayment({
            targetType: 'booking',
            targetId: booking.id,
          });

          if (payRes.success && payRes.data) {
            const payment = payRes.data;
            if (payment.checkoutUrl) {
              // Open web page for PayOS checkout
              const result = await WebBrowser.openBrowserAsync(payment.checkoutUrl);
              
              // After browser closes, navigate to success screen to query payment status
              router.push({
                pathname: '/booking/success',
                params: {
                  bookingId: booking.id,
                  orderCode: payment.orderCode,
                  restaurantName,
                },
              });
              return;
            }
          }
        }

        // If zero deposit booking, navigate straight to success
        router.push({
          pathname: '/booking/success',
          params: {
            bookingId: booking.id,
            restaurantName,
          },
        });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt bàn';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Thông tin đặt chỗ</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Booking Card Detail ─── */}
        <View style={styles.bookingCard}>
          <Text style={styles.cardRestName}>{restaurantName}</Text>
          <View style={styles.cardGrid}>
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Ngày đặt</Text>
              <Text style={styles.cardVal}>{formatDate(bookingDate)}</Text>
            </View>
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Giờ đến</Text>
              <Text style={styles.cardVal}>{bookingTime}</Text>
            </View>
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Số khách</Text>
              <Text style={styles.cardVal}>{numberOfGuests} người</Text>
            </View>
          </View>
          <Text style={styles.cardTables}>
            Bàn đã chọn: <Text style={{ color: T.color.primary, fontWeight: '700' }}>{tableNumbers.join(', ')}</Text>
          </Text>
        </View>

        {/* ─── Contact Form ─── */}
        <SectionHeader title="Thông tin liên hệ" style={styles.sectionHeader} />
        <View style={styles.form}>
          <TextField
            label="Họ và tên"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nhập tên người đặt"
            style={styles.formField}
          />
          <TextField
            label="Số điện thoại"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Nhập số điện thoại liên hệ"
            keyboardType="phone-pad"
            style={styles.formField}
          />
          <TextField
            label="Địa chỉ email"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            placeholder="Nhập địa chỉ email của bạn"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.formField}
          />
          <TextField
            label="Ghi chú đặc biệt"
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Ví dụ: bàn gần cửa sổ, ăn chay..."
            multiline
            numberOfLines={3}
            style={styles.formField}
          />
        </View>

        {/* ─── Occasion Chips ─── */}
        <SectionHeader title="Dịp đặc biệt (không bắt buộc)" style={styles.sectionHeader} />
        <View style={styles.occasionGrid}>
          {occasions.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={occasion === o.value}
              onPress={() => setOccasion(occasion === o.value ? null : o.value)}
              style={styles.occChip}
            />
          ))}
        </View>

        {/* ─── Food Pre-order Section (Static) ─── */}
        <SectionHeader title="Món ăn đã đặt trước" style={styles.sectionHeader} />
        <View style={styles.staticBox}>
          {loadingMenu ? (
            <ActivityIndicator color={T.color.primary} style={{ marginVertical: 10 }} />
          ) : preOrdersList.length > 0 ? (
            <View style={styles.preOrderStaticList}>
              {preOrdersList.map(({ item, quantity }) => (
                <View key={item.id} style={styles.preOrderStaticRow}>
                  <View style={styles.preOrderStaticLeft}>
                    <Text style={styles.preOrderStaticName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.preOrderStaticQty}>x{quantity}</Text>
                  </View>
                  <Text style={styles.preOrderStaticPrice}>{formatCurrency(item.price * quantity)}</Text>
                </View>
              ))}
              <View style={styles.staticDivider} />
              <View style={styles.preOrderStaticTotalRow}>
                <Text style={styles.preOrderStaticTotalLabel}>Tổng tiền món ăn (thanh toán tại nhà hàng):</Text>
                <Text style={styles.preOrderStaticTotalVal}>{formatCurrency(preOrderTotalAmount)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.staticEmptyText}>Không có món ăn đặt trước (trả sau tại nhà hàng)</Text>
          )}
        </View>

        {/* ─── Voucher Applied (Static) ─── */}
        <SectionHeader title="Ưu đãi đặt bàn" style={styles.sectionHeader} />
        <View style={styles.staticBox}>
          {appliedVoucher ? (
            <View style={styles.voucherStaticCard}>
              <View style={styles.voucherStaticLeft}>
                <FontAwesome name="tag" size={16} color={T.color.primary} />
                <View style={styles.voucherStaticInfo}>
                  <Text style={styles.voucherStaticCode}>{appliedVoucher.code}</Text>
                  <Text style={styles.voucherStaticTitle} numberOfLines={1}>
                    Giảm giá cọc bàn ({formatCurrency(discountAmount)})
                  </Text>
                </View>
              </View>
              <View style={styles.voucherStaticBadge}>
                <Text style={styles.voucherStaticBadgeText}>Đã áp dụng</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.staticEmptyText}>Không áp dụng mã giảm giá</Text>
          )}
        </View>

        {/* ─── Cost Breakdown ─── */}
        <SectionHeader title="Chi tiết chi phí" style={styles.sectionHeader} />
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownRow}>
            <Text style={styles.bdLabel}>Tiền cọc bàn</Text>
            <Text style={styles.bdValue}>{formatCurrency(tableDepositAmount)}</Text>
          </View>

          {foodDepositAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.bdLabel}>Tiền cọc món ăn (10%)</Text>
              <Text style={styles.bdValue}>{formatCurrency(foodDepositAmount)}</Text>
            </View>
          )}
          
          {discountAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.bdLabel, { color: T.color.primary }]}>Giảm giá Voucher</Text>
              <Text style={[styles.bdValue, { color: T.color.primary }]}>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}

          {preOrderTotalAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.bdLabel}>Tổng giá trị món ăn</Text>
              <Text style={styles.bdValue}>{formatCurrency(preOrderTotalAmount)}</Text>
            </View>
          )}

          <View style={styles.bdDivider} />
          
          <View style={styles.breakdownRow}>
            <Text style={[styles.bdLabel, { fontWeight: '700', color: '#FFFFFF' }]}>Cần thanh toán cọc bây giờ</Text>
            <Text style={styles.finalTotal}>{formatCurrency(finalAmount)}</Text>
          </View>
          
          {preOrderTotalAmount > 0 && (
            <Text style={styles.breakdownNote}>
              * Lưu ý: Bạn cần thanh toán cọc bàn và cọc món ăn tổng cộng {formatCurrency(finalAmount)} bây giờ. Tiền món ăn còn lại ({formatCurrency(preOrderTotalAmount - foodDepositAmount)}) sẽ được thanh toán trực tiếp tại nhà hàng khi bạn đến dùng bữa.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ─── Bottom checkout bar ─── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomLabel}>Tổng thanh toán:</Text>
          <Text style={styles.bottomVal}>{formatCurrency(finalAmount)}</Text>
        </View>
        <Button
          label="Xác nhận & Thanh toán"
          onPress={handleSubmitBooking}
          variant={submitting ? 'loading' : 'primary'}
          style={styles.submitBtn}
        />
      </View>
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
  scrollContent: {
    paddingBottom: 130,
  },
  bookingCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    margin: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardRestName: {
    color: T.color.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: T.space.md,
  },
  cardCol: {
    flex: 1,
  },
  cardLabel: {
    color: T.color.text3,
    fontSize: 11,
    marginBottom: 4,
  },
  cardVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cardTables: {
    color: T.color.text2,
    fontSize: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: T.space.md,
  },
  sectionHeader: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.base,
    marginBottom: T.space.sm,
  },
  form: {
    paddingHorizontal: T.space.lg,
    gap: 8,
  },
  formField: {
    marginBottom: T.space.sm,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: T.space.lg,
  },
  occChip: {
    alignItems: 'center',
  },
  preOrderWrapper: {
    marginVertical: T.space.sm,
  },
  foodList: {
    paddingHorizontal: T.space.lg,
  },
  foodCard: {
    width: 120,
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  foodImg: {
    width: 104,
    height: 70,
    borderRadius: T.radius.sm,
    marginBottom: 6,
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  foodPrice: {
    color: T.color.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  addFoodBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: T.radius.sm,
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  addFoodText: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: T.radius.sm,
    height: 24,
    paddingHorizontal: 4,
    width: '100%',
    justifyContent: 'space-between',
  },
  qtyBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noFoodText: {
    color: T.color.text3,
    fontSize: 13,
    paddingHorizontal: T.space.lg,
    fontStyle: 'italic',
  },
  voucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    height: 48,
    marginHorizontal: T.space.lg,
    paddingHorizontal: T.space.md,
  },
  voucherInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  applyBtn: {
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    paddingHorizontal: T.space.md,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#0C0F16',
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownBox: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.lg,
    marginHorizontal: T.space.lg,
    padding: T.space.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bdLabel: {
    color: T.color.text3,
    fontSize: 13,
  },
  bdValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bdDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: T.space.md,
  },
  finalTotal: {
    color: T.color.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  bottomBar: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLeft: {
    flex: 0.5,
  },
  bottomLabel: {
    color: T.color.text3,
    fontSize: 11,
  },
  bottomVal: {
    color: T.color.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  submitBtn: {
    flex: 0.5,
  },
  staticBox: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.md,
  },
  staticEmptyText: {
    color: T.color.text3,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  preOrderStaticList: {
    gap: 8,
  },
  preOrderStaticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preOrderStaticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  preOrderStaticName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  preOrderStaticQty: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  preOrderStaticPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  staticDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 8,
  },
  preOrderStaticTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preOrderStaticTotalLabel: {
    color: T.color.text3,
    fontSize: 11,
    flex: 0.7,
  },
  preOrderStaticTotalVal: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  voucherStaticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherStaticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherStaticInfo: {
    marginLeft: T.space.md,
    flex: 1,
  },
  voucherStaticCode: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  voucherStaticTitle: {
    color: T.color.text2,
    fontSize: 11,
    marginTop: 2,
  },
  voucherStaticBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: T.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voucherStaticBadgeText: {
    color: T.color.success,
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownNote: {
    color: T.color.text3,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
