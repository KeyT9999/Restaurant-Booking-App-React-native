import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { voucherApi } from '@/src/api/voucher.api';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

interface VoucherSelectorProps {
  restaurantId: string;
  orderAmount: number;
  appliedVoucher: any;
  onApplyVoucher: (voucher: any, discountAmount: number) => void;
  onRemoveVoucher: () => void;
}

export const VoucherSelector: React.FC<VoucherSelectorProps> = ({
  restaurantId,
  orderAmount,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
}) => {
  const { showToast } = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  
  // Available vouchers
  const [vouchers, setVouchers] = useState<any[]>([]);

  const loadVouchers = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // Get restaurant specific vouchers and saved wallet vouchers
      const [restRes, myRes] = await Promise.all([
        voucherApi.getRestaurantVouchers(restaurantId),
        voucherApi.getMyVouchers({ filter: 'active' }),
      ]);

      let list: any[] = [];
      if (restRes.success && restRes.data) {
        list = [...restRes.data];
      }
      if (myRes.success && myRes.data) {
        // De-duplicate if same voucher exists
        const getVoucherId = (item: any) => (item.id || item._id || '').toString();
        myRes.data.forEach((item: any) => {
          const v = item.voucherId;
          if (v && !list.some(existing => getVoucherId(existing) === getVoucherId(v))) {
            // Safe extraction of restaurant ID as string
            let vRestIdStr = '';
            if (v.restaurantId) {
              if (typeof v.restaurantId === 'object') {
                vRestIdStr = (v.restaurantId._id || v.restaurantId.id || '').toString();
              } else {
                vRestIdStr = v.restaurantId.toString();
              }
            }

            // Only add if it's general or matches restaurantId
            if (!vRestIdStr || vRestIdStr === restaurantId.toString()) {
              list.push(v);
            }
          }
        });
      }
      setVouchers(list);
    } catch (error) {
      console.warn('Lỗi tải danh sách voucher đặt chỗ:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      loadVouchers();
    }
  }, [modalVisible, restaurantId]);

  const handleApplyVoucher = async (codeStr: string) => {
    if (!codeStr.trim()) return;
    setValidating(true);
    try {
      const res = await voucherApi.validateVoucher({
        code: codeStr.toUpperCase().trim(),
        restaurantId,
        orderAmount,
      });

      if (res.valid) {
        onApplyVoucher(res.voucher, res.discountAmount || 0);
        showToast('Áp dụng ưu đãi thành công!', 'success');
        setModalVisible(false);
      } else {
        showToast(res.reason || 'Mã giảm giá không hợp lệ', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Lỗi kiểm tra mã giảm giá';
      showToast(msg, 'error');
    } finally {
      setValidating(false);
    }
  };

  return (
    <View style={styles.container}>
      {appliedVoucher ? (
        <View style={styles.appliedCard}>
          <View style={styles.appliedLeft}>
            <FontAwesome name="tag" size={16} color={T.color.primary} />
            <View style={styles.appliedInfo}>
              <Text style={styles.appliedCode}>{appliedVoucher.code}</Text>
              <Text style={styles.appliedText} numberOfLines={1}>
                {appliedVoucher.title || `Ưu đãi áp dụng`}
              </Text>
            </View>
          </View>
          <Pressable onPress={onRemoveVoucher} style={styles.removeBtn}>
            <FontAwesome name="times-circle" size={18} color={T.color.error} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setModalVisible(true)} style={styles.triggerBtn}>
          <View style={styles.triggerLeft}>
            <FontAwesome name="ticket" size={16} color={T.color.primary} style={{ marginRight: T.space.md }} />
            <Text style={styles.triggerText}>Chọn hoặc nhập mã giảm giá</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={T.color.text3} />
        </Pressable>
      )}

      {/* Voucher Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[typography.titleMD, styles.modalTitle]}>Chọn khuyến mãi</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <FontAwesome name="times" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Promo Code Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Nhập mã ưu đãi (ví dụ: BOOKEAT20)"
                placeholderTextColor={T.color.placeholder}
                value={promoCodeInput}
                onChangeText={setPromoCodeInput}
                autoCapitalize="characters"
              />
              <Pressable
                onPress={() => handleApplyVoucher(promoCodeInput)}
                disabled={validating || !promoCodeInput.trim()}
                style={[styles.applyBtn, !promoCodeInput.trim() && styles.disabledApplyBtn]}
              >
                {validating ? (
                  <ActivityIndicator size="small" color="#0C0F16" />
                ) : (
                  <Text style={styles.applyBtnText}>Áp dụng</Text>
                )}
              </Pressable>
            </View>

            {/* Vouchers List */}
            {loading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={T.color.primary} />
                <Text style={styles.loadingText}>Đang tải ưu đãi...</Text>
              </View>
            ) : vouchers.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.voucherList}>
                {vouchers.map((v) => {
                  const discountText =
                    v.discountType === 'percentage'
                      ? `-${v.discountValue}%`
                      : `-${formatCurrency(v.discountValue)}`;

                  const isApplicable = orderAmount >= (v.minOrderAmount || 0);

                  return (
                    <Pressable
                      key={v.id || v._id}
                      onPress={() => isApplicable && handleApplyVoucher(v.code)}
                      disabled={!isApplicable}
                      style={[
                        styles.voucherTicket,
                        !isApplicable && styles.disabledTicket
                      ]}
                    >
                      {/* Left Part: Discount Amount */}
                      <View style={styles.ticketLeft}>
                        <Text style={styles.discountText}>{discountText}</Text>
                        <Text style={styles.typeText}>GIẢM</Text>
                      </View>

                      {/* Dashed Separator */}
                      <View style={styles.ticketDivider}>
                        <View style={styles.notchTop} />
                        <View style={styles.dashedLine} />
                        <View style={styles.notchBottom} />
                      </View>

                      {/* Right Part: Details */}
                      <View style={styles.ticketRight}>
                        <Text style={styles.codeText} numberOfLines={1}>{v.code}</Text>
                        <Text style={styles.titleText} numberOfLines={1}>{v.title || 'Ưu đãi đặt bàn'}</Text>
                        <Text style={styles.minSpendText}>
                          Đơn tối thiểu {formatCurrency(v.minOrderAmount || 0)}
                        </Text>
                        <Text style={styles.expiryText}>HSD: {formatDate(v.endDate)}</Text>
                        
                        {!isApplicable && (
                          <Text style={styles.warningText}>
                            Chưa đạt đơn tối thiểu
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.modalEmpty}>
                <FontAwesome name="gift" size={36} color={T.color.text3} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>Nhà hàng chưa có mã giảm giá nào khả dụng.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: T.space.sm,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.md,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.25)',
    borderRadius: T.radius.md,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.md,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedInfo: {
    marginLeft: T.space.md,
    flex: 1,
  },
  appliedCode: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  appliedText: {
    color: T.color.text2,
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: T.color.bg,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: T.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    height: 48,
    margin: T.space.lg,
    paddingHorizontal: T.space.md,
  },
  promoInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    paddingHorizontal: T.space.md,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledApplyBtn: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#0C0F16',
    fontSize: 12,
    fontWeight: '700',
  },
  modalLoading: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: T.color.text3,
    fontSize: 13,
    marginTop: 8,
  },
  modalEmpty: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
  },
  voucherList: {
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.lg,
    gap: 12,
  },
  voucherTicket: {
    flexDirection: 'row',
    height: 94,
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  disabledTicket: {
    opacity: 0.5,
  },
  ticketLeft: {
    width: 90,
    backgroundColor: 'rgba(212, 150, 83, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountText: {
    color: T.color.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  typeText: {
    color: T.color.text3,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1.5,
  },
  ticketDivider: {
    width: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    width: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: T.color.border,
  },
  notchTop: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.color.bg,
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 2,
  },
  notchBottom: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.color.bg,
    position: 'absolute',
    bottom: -6,
    left: -6,
    zIndex: 2,
  },
  ticketRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
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
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  minSpendText: {
    color: T.color.text2,
    fontSize: 10,
    marginTop: 2,
  },
  expiryText: {
    color: T.color.text3,
    fontSize: 9,
    marginTop: 4,
  },
  warningText: {
    color: T.color.error,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
});
