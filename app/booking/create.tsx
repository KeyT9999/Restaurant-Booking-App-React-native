import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { bookingApi } from '@/src/api/booking.api';
import { restaurantApi } from '@/src/api/restaurant.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { RestaurantTable } from '@/src/types/booking.types';
import { formatCurrency } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import { PreOrderSelector } from '@/src/components/booking/PreOrderSelector';
import { VoucherSelector } from '@/src/components/booking/VoucherSelector';
import { MenuItem } from '@/src/types/restaurant.types';

export default function CreateBooking() {
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const { showToast } = useToast();

  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]); // tableNumbers

  // Pre-order and Voucher states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [preOrders, setPreOrders] = useState<{ [itemId: string]: number }>({});
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Availability State
  const [checking, setChecking] = useState(false);
  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([]);
  const [suggestedTables, setSuggestedTables] = useState<RestaurantTable[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  // Generate 7 days starting from today
  const dates = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const isoString = `${d.getFullYear()}-${monthNum}-${dayNum}`;
    
    // Day label
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const label = index === 0 ? 'Hôm nay' : days[d.getDay()];

    return { label, dayNum, monthNum, dateStr: isoString };
  });

  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, []);

  const loadRestaurantDetails = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await restaurantApi.getById(restaurantId);
      if (res.success && res.data) {
        setRestaurantName(res.data.name);
      }
    } catch (error) {
      console.warn('Lỗi tải chi tiết nhà hàng:', error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurantDetails();
  }, [loadRestaurantDetails]);

  // Fetch restaurant menu for pre-ordering
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
    setPreOrders((prev) => {
      const current = prev[itemId] || 0;
      const nextVal = Math.max(0, current + diff);
      const nextPreOrders = { ...prev };
      if (nextVal === 0) {
        delete nextPreOrders[itemId];
      } else {
        nextPreOrders[itemId] = nextVal;
      }
      return nextPreOrders;
    });
  };

  // Calculate pre-order items total
  const preOrderTotal = () => {
    let total = 0;
    Object.keys(preOrders).forEach((itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
      if (item) {
        total += item.price * preOrders[itemId];
      }
    });
    return total;
  };

  // Total order amount for voucher eligibility (which is table deposit)
  const totalOrderAmount = () => {
    return totalDepositAmount();
  };

  // Final payable deposit amount after discount
  const finalPayableAmount = () => {
    return Math.max(0, totalDepositAmount() - discountAmount);
  };

  // Automatically validate/revoke applied voucher if order amount changes
  useEffect(() => {
    if (appliedVoucher) {
      const orderAmount = totalOrderAmount();
      if (orderAmount < (appliedVoucher.minOrderAmount || 0)) {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        showToast('Voucher đã bị gỡ bỏ vì tiền cọc bàn chưa đạt mức tối thiểu.', 'info');
      } else {
        // Re-calculate discount if it is a percentage discount
        if (appliedVoucher.discountType === 'percentage') {
          let disc = Math.round((orderAmount * appliedVoucher.discountValue) / 100);
          if (appliedVoucher.maxDiscountAmount && disc > appliedVoucher.maxDiscountAmount) {
            disc = appliedVoucher.maxDiscountAmount;
          }
          setDiscountAmount(disc);
        }
      }
    }
  }, [selectedTables, appliedVoucher]);

  // Check table availability on date, time, or guest count changes
  const handleCheckAvailability = useCallback(async () => {
    if (!restaurantId || !selectedDate || !selectedTime || !selectedGuests) return;
    setChecking(true);
    setSelectedTables([]);
    try {
      const res = await bookingApi.checkAvailability({
        restaurantId,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        numberOfGuests: selectedGuests,
      });

      if (res.success && res.data) {
        setAvailableTables(res.data.availableTables || []);
        setSuggestedTables(res.data.suggestedTables || []);
        setHasChecked(true);

        // Auto select suggested tables
        if (res.data.suggestedTables && res.data.suggestedTables.length > 0) {
          setSelectedTables(res.data.suggestedTables.map((t: RestaurantTable) => t.tableNumber));
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể kiểm tra bàn trống';
      showToast(msg, 'error');
    } finally {
      setChecking(false);
    }
  }, [restaurantId, selectedDate, selectedTime, selectedGuests, showToast]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      handleCheckAvailability();
    }
  }, [selectedDate, selectedTime, selectedGuests, handleCheckAvailability]);

  // Handle Table Selection
  const handleTableToggle = (tableNumber: string) => {
    if (selectedTables.includes(tableNumber)) {
      setSelectedTables(selectedTables.filter((num) => num !== tableNumber));
    } else {
      setSelectedTables([...selectedTables, tableNumber]);
    }
  };

  // Group tables by Zone
  const getTablesByZone = () => {
    const zones: { [key: string]: RestaurantTable[] } = {};
    availableTables.forEach((table) => {
      const zoneName = table.zone || 'Khu vực chính';
      if (!zones[zoneName]) {
        zones[zoneName] = [];
      }
      zones[zoneName].push(table);
    });
    return zones;
  };

  // Calculate Total Deposit required for the selected tables and pre-order food items
  const totalDepositAmount = () => {
    let deposit = 0;
    availableTables.forEach((table) => {
      if (selectedTables.includes(table.tableNumber)) {
        deposit += table.depositAmount || 0;
      }
    });
    // Cộng thêm 10% tiền món ăn đặt trước
    const foodTotal = preOrderTotal();
    deposit += Math.round(0.1 * foodTotal);
    return deposit;
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      showToast('Vui lòng chọn ngày và giờ đặt chỗ', 'info');
      return;
    }
    if (selectedTables.length === 0) {
      showToast('Vui lòng chọn ít nhất một bàn trống', 'info');
      return;
    }

    // Verify selected tables capacity
    let totalCap = 0;
    availableTables.forEach((t) => {
      if (selectedTables.includes(t.tableNumber)) {
        totalCap += t.capacity;
      }
    });

    if (totalCap < selectedGuests) {
      Alert.alert(
        'Không đủ sức chứa',
        `Các bàn bạn chọn chỉ chứa được ${totalCap} người. Bạn cần chọn thêm bàn cho đủ số khách (${selectedGuests} người) hoặc thay đổi số lượng khách.`
      );
      return;
    }

    // Navigate to Summary Screen
    router.push({
      pathname: '/booking/summary',
      params: {
        restaurantId,
        restaurantName,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        numberOfGuests: selectedGuests,
        tableNumbers: selectedTables.join(','),
        depositAmount: totalDepositAmount(),
        preOrders: JSON.stringify(preOrders),
        voucherCode: appliedVoucher ? appliedVoucher.code : '',
        discountAmount: discountAmount,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const tablesGrouped = getTablesByZone();

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Đặt bàn - {restaurantName}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Date Picker ─── */}
        <SectionHeader title="Chọn ngày đặt bàn" style={styles.sectionHeader} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dates.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <Pressable
                key={item.dateStr}
                onPress={() => setSelectedDate(item.dateStr)}
                style={[styles.dateCard, isSelected && styles.selectedDateCard]}
              >
                <Text style={[styles.dateLabel, isSelected && styles.selectedDateText]}>{item.label}</Text>
                <Text style={[styles.dateNum, isSelected && styles.selectedDateText]}>{item.dayNum}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─── Guests Counter ─── */}
        <View style={styles.guestRow}>
          <View style={styles.guestTextCol}>
            <Text style={[typography.titleSM, styles.guestTitle]}>Số lượng khách</Text>
            <Text style={styles.guestSub}>Vui lòng chọn chính xác số khách đi cùng</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
              style={styles.stepBtn}
            >
              <FontAwesome name="minus" size={12} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.guestCount}>{selectedGuests}</Text>
            <Pressable
              onPress={() => setSelectedGuests(selectedGuests + 1)}
              style={styles.stepBtn}
            >
              <FontAwesome name="plus" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ─── Time Slots Selector ─── */}
        <SectionHeader title="Khung giờ đến" style={styles.sectionHeader} />
        <View style={styles.timeSlotsGrid}>
          {timeSlots.map((time) => (
            <Chip
              key={time}
              label={time}
              active={selectedTime === time}
              onPress={() => setSelectedTime(time)}
              style={styles.timeSlotChip}
            />
          ))}
        </View>

        {/* ─── Table Map Selector ─── */}
        <SectionHeader title="Sơ đồ chọn bàn" style={styles.sectionHeader} />
        <View style={styles.tableMapWrapper}>
          {checking ? (
            <View style={styles.checkingBox}>
              <ActivityIndicator color={T.color.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.checkingText}>Đang kiểm tra sơ đồ bàn trống...</Text>
            </View>
          ) : !selectedTime ? (
            <View style={styles.promptBox}>
              <Text style={styles.promptText}>Vui lòng chọn khung giờ để hiển thị sơ đồ bàn.</Text>
            </View>
          ) : availableTables.length === 0 && hasChecked ? (
            <View style={styles.soldOutBox}>
              <FontAwesome name="exclamation-circle" size={24} color={T.color.error} style={{ marginBottom: 8 }} />
              <Text style={styles.soldOutText}>Hết bàn trống phù hợp cho khung giờ này.</Text>
              <Text style={styles.soldOutSub}>Vui lòng chọn thời gian khác hoặc tăng/giảm số khách.</Text>
            </View>
          ) : (
            <View>
              {/* Legend markers */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, styles.legendAvail]} />
                  <Text style={styles.legendLabel}>Trống</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, styles.legendSug]} />
                  <Text style={styles.legendLabel}>Đề xuất</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, styles.legendSel]} />
                  <Text style={styles.legendLabel}>Đang chọn</Text>
                </View>
              </View>

              {/* Zones & Tables Grid */}
              {Object.keys(tablesGrouped).map((zoneName) => (
                <View key={zoneName} style={styles.zoneSection}>
                  <Text style={styles.zoneTitle}>Khu vực: {zoneName}</Text>
                  <View style={styles.tablesGrid}>
                    {tablesGrouped[zoneName].map((table) => {
                      const isSelected = selectedTables.includes(table.tableNumber);
                      const isSuggested = suggestedTables.some((st) => st.tableNumber === table.tableNumber);
                      
                      return (
                        <Pressable
                          key={table.tableNumber}
                          onPress={() => handleTableToggle(table.tableNumber)}
                          style={[
                            styles.tableCard,
                            isSuggested && styles.suggestedTableCard,
                            isSelected && styles.selectedTableCard
                          ]}
                        >
                          <FontAwesome
                            name="cutlery"
                            size={12}
                            color={isSelected ? '#0C0F16' : (isSuggested ? T.color.primary : T.color.text3)}
                            style={{ marginBottom: 4 }}
                          />
                          <Text style={[styles.tableText, isSelected && styles.selectedTableText]}>Bàn {table.tableNumber}</Text>
                          <Text style={[styles.tableCap, isSelected && { color: '#0C0F16' }]}>
                            {table.capacity} chỗ
                          </Text>
                          {table.depositAmount > 0 && (
                            <Text style={[styles.tableDeposit, isSelected && { color: '#0C0F16' }]}>
                              +{table.depositAmount / 1000}k cọc
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Food Pre-order Section ─── */}
        <SectionHeader title="Gọi trước món ăn (tiết kiệm thời gian)" style={styles.sectionHeader} />
        <PreOrderSelector
          menuItems={menuItems}
          preOrders={preOrders}
          onPreOrderChange={handlePreOrderChange}
          loading={loadingMenu}
        />

        {/* ─── Voucher Promo Code ─── */}
        {selectedTables.length > 0 && (
          <>
            <SectionHeader title="Mã giảm giá đặt bàn" style={styles.sectionHeader} />
            <VoucherSelector
              restaurantId={restaurantId}
              orderAmount={totalOrderAmount()}
              appliedVoucher={appliedVoucher}
              onApplyVoucher={(v, discount) => {
                setAppliedVoucher(v);
                setDiscountAmount(discount);
              }}
              onRemoveVoucher={() => {
                setAppliedVoucher(null);
                setDiscountAmount(0);
              }}
            />
          </>
        )}
      </ScrollView>

      {/* ─── Sticky Bottom Bar ─── */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>
            Đặt cọc bàn ({selectedTables.length} bàn)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Text style={styles.summaryValue}>{formatCurrency(finalPayableAmount())}</Text>
            {discountAmount > 0 && (
              <Text style={styles.discountBadgeText}>
                (-{formatCurrency(discountAmount)})
              </Text>
            )}
          </View>
          {preOrderTotal() > 0 && (
            <Text style={styles.preOrderHint}>
              + {formatCurrency(preOrderTotal())} món đặt trước (trả tại quán)
            </Text>
          )}
        </View>
        <Button
          label="Tiếp tục"
          onPress={handleContinue}
          style={styles.continueBtn}
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
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 130,
  },
  sectionHeader: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.lg,
    marginBottom: T.space.sm,
  },
  dateScroll: {
    paddingHorizontal: T.space.lg,
  },
  dateCard: {
    width: 60,
    height: 74,
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.sm,
  },
  selectedDateCard: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  dateLabel: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedDateText: {
    color: '#0C0F16',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.lg,
    marginVertical: T.space.xl,
  },
  guestTextCol: {
    flex: 1,
    marginRight: T.space.lg,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  guestSub: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 38,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestCount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: T.space.lg,
  },
  timeSlotChip: {
    minWidth: 64,
    alignItems: 'center',
  },
  tableMapWrapper: {
    paddingHorizontal: T.space.lg,
    marginTop: T.space.sm,
  },
  checkingBox: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingText: {
    color: T.color.text2,
    fontSize: 13,
  },
  promptBox: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
  },
  soldOutBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  soldOutSub: {
    color: T.color.text3,
    fontSize: 12,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: T.space.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendAvail: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  legendSug: {
    backgroundColor: 'rgba(212, 150, 83, 0.15)',
    borderWidth: 1,
    borderColor: T.color.primary,
  },
  legendSel: {
    backgroundColor: T.color.primary,
  },
  legendLabel: {
    color: T.color.text2,
    fontSize: 12,
  },
  zoneSection: {
    marginBottom: T.space.lg,
  },
  zoneTitle: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: T.space.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tableCard: {
    width: (SCREEN_WIDTH - 2 * 16 - 2 * 10) / 3, // 3 columns grid
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTableCard: {
    width: (SCREEN_WIDTH - 2 * 16 - 2 * 10) / 3,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedTableCard: {
    width: (SCREEN_WIDTH - 2 * 16 - 2 * 10) / 3,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.primary,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedTableText: {
    color: '#0C0F16',
    fontSize: 13,
    fontWeight: '700',
  },
  tableCap: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  tableDeposit: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
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
  summaryCol: {
    flex: 0.55,
  },
  summaryLabel: {
    color: T.color.text3,
    fontSize: 11,
  },
  summaryValue: {
    color: T.color.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  continueBtn: {
    flex: 0.45,
  },
  discountBadgeText: {
    color: T.color.success,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  preOrderHint: {
    color: T.color.text3,
    fontSize: 10,
    marginTop: 2,
  },
});
