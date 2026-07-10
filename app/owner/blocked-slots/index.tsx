import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Switch, Modal, Alert, RefreshControl } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function BlockedSlotsScreen() {
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState('');
  const [slotType, setSlotType] = useState<'full_day' | 'time_range'>('full_day');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getBlockedSlots(activeRestaurant.id);
      if (res.success) {
        setSlots(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
      showToast('Không thể tải danh sách giờ chặn', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setSlots([]);
    fetchSlots();
  }, [activeRestaurant]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSlots(false);
  };

  const handleDeleteSlot = (id: string, dateStr: string) => {
    if (!activeRestaurant?.id) return;
    Alert.alert('Mở khóa khung giờ', `Bạn có chắc chắn muốn hủy chặn giờ ngày ${dateStr} không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Mở khóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteBlockedSlot(activeRestaurant.id, id);
            if (res.success) {
              showToast('Đã hủy chặn giờ thành công', 'success');
              fetchSlots(false);
            } else {
              showToast(res.message || 'Mở khóa thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
          }
        },
      },
    ]);
  };

  const handleSaveSlot = async () => {
    if (!activeRestaurant?.id) return;
    if (!date.trim()) {
      showToast('Vui lòng nhập ngày chặn (YYYY-MM-DD)', 'error');
      return;
    }
    // Simple date format regex check YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      showToast('Ngày không hợp lệ (định dạng YYYY-MM-DD)', 'error');
      return;
    }

    if (slotType === 'time_range') {
      if (!startTime.trim() || !endTime.trim()) {
        showToast('Vui lòng nhập đủ giờ bắt đầu và kết thúc', 'error');
        return;
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
        showToast('Giờ nhập vào không đúng định dạng (HH:mm)', 'error');
        return;
      }
      if (startTime >= endTime) {
        showToast('Giờ kết thúc phải sau giờ bắt đầu', 'error');
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      date: date.trim(),
      slotType,
      startTime: slotType === 'time_range' ? startTime.trim() : null,
      endTime: slotType === 'time_range' ? endTime.trim() : null,
      reason: reason.trim() || null,
      tableNumbers: [],
    };

    try {
      const res = await ownerApi.createBlockedSlot(activeRestaurant.id, payload);
      if (res.success) {
        showToast('Khóa khung giờ thành công!', 'success');
        setModalVisible(false);
        // Clear form
        setDate('');
        setSlotType('full_day');
        setStartTime('11:00');
        setEndTime('14:00');
        setReason('');
        fetchSlots(false);
      } else {
        showToast(res.message || 'Chặn giờ thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const openModalWithDefaultDate = () => {
    setDate(getTodayString());
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Khóa khung giờ đặt" showBack={true} />

      {/* Add Slot Trigger */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={openModalWithDefaultDate}
      >
        <FontAwesome name="lock" size={13} color="#0C0F16" style={{ marginRight: 8 }} />
        <Text style={styles.addBtnText}>Khóa khung giờ mới</Text>
      </TouchableOpacity>

      {loading && slots.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />}
        >
          {slots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="calendar-check-o" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Chưa có khung giờ nào bị khóa chặn</Text>
            </View>
          ) : (
            slots.map((item) => {
              const formattedDate = new Date(item.date).toLocaleDateString('vi-VN');
              const isFullDay = item.slotType === 'full_day';
              const timeStr = isFullDay ? 'Cả ngày' : `${item.startTime} – ${item.endTime}`;

              return (
                <View key={item._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.leftMeta}>
                      <View style={styles.iconCircle}>
                        <FontAwesome name="lock" size={14} color={T.color.error} />
                      </View>
                      <View>
                        <Text style={styles.cardDate}>{formattedDate}</Text>
                        <Text style={styles.cardTime}>{timeStr}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSlot(item._id, formattedDate)}
                    >
                      <FontAwesome name="trash" size={14} color={T.color.text3} />
                    </TouchableOpacity>
                  </View>

                  {item.reason ? (
                    <Text style={styles.reasonText}>Lý do: {item.reason}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Form Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Khóa khung giờ đặt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={18} color={T.color.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày khóa (YYYY-MM-DD) *</Text>
                <TextInput
                  placeholder="Ví dụ: 2026-07-25"
                  placeholderTextColor={T.color.placeholder}
                  value={date}
                  onChangeText={setDate}
                  style={styles.input}
                />
              </View>

              {/* Slot type switch */}
              <View style={styles.switchRow}>
                <Text style={styles.label}>Khóa cả ngày</Text>
                <Switch
                  value={slotType === 'full_day'}
                  onValueChange={(val) => setSlotType(val ? 'full_day' : 'time_range')}
                  trackColor={{ false: '#3A4255', true: 'rgba(212, 150, 83, 0.4)' }}
                  thumbColor={slotType === 'full_day' ? T.color.primary : T.color.text3}
                />
              </View>

              {/* Time Range Inputs */}
              {slotType === 'time_range' && (
                <View style={styles.timeInputsRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Giờ bắt đầu (HH:mm) *</Text>
                    <TextInput
                      placeholder="11:00"
                      placeholderTextColor={T.color.placeholder}
                      value={startTime}
                      onChangeText={setStartTime}
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Giờ kết thúc (HH:mm) *</Text>
                    <TextInput
                      placeholder="14:00"
                      placeholderTextColor={T.color.placeholder}
                      value={endTime}
                      onChangeText={setEndTime}
                      style={styles.input}
                    />
                  </View>
                </View>
              )}

              {/* Reason */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lý do khóa</Text>
                <TextInput
                  placeholder="Ví dụ: Tổ chức tiệc riêng, sửa chữa..."
                  placeholderTextColor={T.color.placeholder}
                  value={reason}
                  onChangeText={setReason}
                  style={styles.input}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtnModal}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnTextModal}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                disabled={submitting}
                onPress={handleSaveSlot}
              >
                {submitting ? (
                  <ActivityIndicator color="#0C0F16" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác nhận khóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
    marginHorizontal: T.space.xl,
    marginTop: T.space.md,
    marginBottom: T.space.sm,
  },
  addBtnText: {
    color: '#0C0F16',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    paddingBottom: T.space['3xl'],
  },
  emptyContainer: {
    paddingVertical: T.space['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 12.5,
    textAlign: 'center',
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    marginBottom: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDate: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '600',
  },
  cardTime: {
    color: T.color.text2,
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonText: {
    color: T.color.text3,
    fontSize: 12.5,
    marginTop: T.space.md,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: T.color.card,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    marginBottom: T.space.lg,
  },
  modalTitle: {
    color: T.color.text1,
    fontSize: 15.5,
    fontWeight: '700',
  },
  modalForm: {
    gap: T.space.md,
    paddingBottom: T.space.xl,
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 42,
    paddingHorizontal: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    paddingHorizontal: T.space.md,
    height: 46,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: T.space.md,
    marginTop: T.space.md,
  },
  cancelBtnModal: {
    flex: 1,
    height: 42,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cancelBtnTextModal: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: T.radius.sm,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0C0F16',
    fontSize: 13,
    fontWeight: '700',
  },
});
