import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ownerApi } from '@/src/api/owner.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Table changing state
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const fetchBookingDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ownerApi.getBookingDetail(id);
      if (res.success) {
        setBooking(res.data);
      } else {
        showToast(res.message || 'Không thể lấy thông tin chi tiết', 'error');
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      const res = await ownerApi.confirmBooking(booking._id || booking.id);
      if (res.success) {
        showToast('Xác nhận đặt bàn thành công!', 'success');
        fetchBookingDetail();
      } else {
        showToast(res.message || 'Thao tác thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Lỗi hệ thống', 'error');
    }
  };

  const handleCancel = () => {
    if (!booking) return;
    Alert.prompt(
      'Huỷ đặt bàn',
      'Vui lòng nhập lý do huỷ đặt bàn:',
      [
        { text: 'Huỷ bỏ', style: 'cancel' },
        {
          text: 'Huỷ đặt bàn',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim().length === 0) {
              showToast('Lý do huỷ là bắt buộc', 'error');
              return;
            }
            try {
              const res = await ownerApi.cancelBooking(booking._id || booking.id, reason.trim());
              if (res.success) {
                showToast('Đã huỷ đặt bàn thành công!', 'success');
                fetchBookingDetail();
              } else {
                showToast(res.message || 'Thao tác thất bại', 'error');
              }
            } catch (e: any) {
              showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleComplete = async () => {
    if (!booking) return;
    Alert.prompt(
      'Hoàn thành đặt bàn',
      'Nhập số lượng khách thực tế (để trống nếu đúng số đăng ký):',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Hoàn thành',
          onPress: async (val: string | undefined) => {
            const count = val ? Number(val) : undefined;
            try {
              const res = await ownerApi.completeBooking(booking._id || booking.id, count);
              if (res.success) {
                showToast('Đã hoàn thành lượt đặt bàn!', 'success');
                fetchBookingDetail();
              } else {
                showToast(res.message || 'Thao tác thất bại', 'error');
              }
            } catch (e: any) {
              showToast(e.response?.data?.message || 'Lỗi hệ thống', 'error');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleNoShow = async () => {
    if (!booking) return;
    Alert.alert('Khách vắng mặt', 'Đánh dấu khách hàng này đã không đến?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Vắng mặt',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.markNoShow(booking._id || booking.id);
            if (res.success) {
              showToast('Đã đánh dấu khách vắng mặt (no-show)!', 'success');
              fetchBookingDetail();
            } else {
              showToast(res.message || 'Thao tác thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Lỗi hệ thống', 'error');
          }
        },
      },
    ]);
  };

  const handleAddNote = async () => {
    if (noteContent.trim().length === 0) return;
    setAddingNote(true);
    try {
      const res = await ownerApi.addInternalNote(booking._id || booking.id, noteContent.trim());
      if (res.success) {
        showToast('Đã thêm ghi chú nội bộ', 'success');
        setNoteContent('');
        fetchBookingDetail();
      }
    } catch (e) {
      showToast('Không thể thêm ghi chú', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNotes = async () => {
    Alert.alert('Xoá ghi chú', 'Bạn muốn xoá toàn bộ ghi chú nội bộ của booking này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteInternalNote(booking._id || booking.id);
            if (res.success) {
              showToast('Đã xoá ghi chú', 'success');
              fetchBookingDetail();
            }
          } catch (e) {
            showToast('Không thể xoá ghi chú', 'error');
          }
        },
      },
    ]);
  };

  const openChangeTableModal = async () => {
    if (!booking) return;
    setLoadingTables(true);
    setTableModalVisible(true);
    setSelectedTables(booking.tableNumbers || []);
    try {
      const res = await ownerApi.getAvailableTables(booking._id || booking.id);
      if (res.success) {
        setAvailableTables(res.data || []);
      }
    } catch (e) {
      showToast('Không thể lấy danh sách bàn trống', 'error');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleToggleTableSelection = (tableNo: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableNo) ? prev.filter((t) => t !== tableNo) : [...prev, tableNo]
    );
  };

  const submitTableChange = async () => {
    if (selectedTables.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 bàn', 'error');
      return;
    }
    try {
      const res = await ownerApi.changeTable(booking._id || booking.id, selectedTables);
      if (res.success) {
        showToast('Thay đổi bàn ăn thành công!', 'success');
        setTableModalVisible(false);
        fetchBookingDetail();
      } else {
        showToast(res.message || 'Thao tác thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Bàn chọn không hợp lệ', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin đặt bàn</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(212, 150, 83, 0.1)', text: T.color.primary, label: 'Chờ duyệt' };
      case 'confirmed': return { bg: 'rgba(16, 185, 129, 0.1)', text: T.color.success, label: 'Đã nhận' };
      case 'completed': return { bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text2, label: 'Đã xong' };
      case 'cancelled': return { bg: 'rgba(244, 63, 94, 0.1)', text: T.color.error, label: 'Đã huỷ' };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text2, label: status };
    }
  };

  const statusStyle = getStatusStyle(booking.status);
  const dateStr = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
  const depositText = booking.depositAmount > 0
    ? `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.depositAmount)} (${booking.depositPaid ? 'Đã thanh toán' : 'Chưa thanh toán'})`
    : 'Không yêu cầu';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={T.color.text1} />
        </TouchableOpacity>
        <Text style={[typography.displaySM, styles.headerTitle]}>Chi tiết đặt bàn</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>THÔNG TIN KHÁCH HÀNG</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Họ và tên</Text>
            <Text style={styles.detailValue}>{booking.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Điện thoại</Text>
            <Text style={styles.detailValue}>{booking.customerPhone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{booking.customerEmail}</Text>
          </View>
        </View>

        {/* Booking Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>CHI TIẾT LỊCH ĐẶT</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã đặt bàn</Text>
            <Text style={styles.detailValue}>#{booking.id?.toUpperCase() || booking._id?.toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày đặt</Text>
            <Text style={styles.detailValue}>{dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khung giờ</Text>
            <Text style={styles.detailValue}>{booking.bookingTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số khách</Text>
            <Text style={styles.detailValue}>{booking.numberOfGuests} người</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tiền đặt cọc</Text>
            <Text style={styles.detailValue}>{depositText}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bàn được gán</Text>
            <Text style={styles.detailValue}>
              {booking.tableNumbers?.length > 0 ? booking.tableNumbers.join(', ') : 'Chưa gán bàn'}
            </Text>
          </View>
          {booking.specialRequests ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Yêu cầu đặc biệt của khách:</Text>
              <Text style={styles.noteText}>{booking.specialRequests}</Text>
            </View>
          ) : null}
        </View>

        {/* Internal Notes Card */}
        <View style={styles.card}>
          <View style={styles.noteHeaderRow}>
            <Text style={styles.cardSectionTitle}>GHI CHÚ NỘI BỘ</Text>
            {booking.internalNotes ? (
              <TouchableOpacity onPress={handleDeleteNotes}>
                <Text style={styles.clearNotesText}>Xoá hết</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {booking.internalNotes ? (
            <View style={styles.internalNotesBox}>
              <Text style={styles.internalNotesContent}>{booking.internalNotes}</Text>
            </View>
          ) : (
            <Text style={styles.noNotesText}>Chưa có ghi chú nội bộ nào.</Text>
          )}

          <View style={styles.addNoteRow}>
            <TextInput
              placeholder="Thêm ghi chú nội bộ..."
              placeholderTextColor={T.color.placeholder}
              value={noteContent}
              onChangeText={setNoteContent}
              style={styles.noteInput}
            />
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={handleAddNote}
              disabled={addingNote || noteContent.trim().length === 0}
            >
              {addingNote ? (
                <ActivityIndicator size="small" color={T.color.text1} />
              ) : (
                <FontAwesome name="paper-plane" size={14} color={T.color.text1} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer action buttons depending on booking status */}
      <View style={styles.footer}>
        {booking.status === 'pending' && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel}>
              <Text style={styles.dangerBtnText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successBtn} onPress={handleConfirm}>
              <Text style={styles.successBtnText}>Duyệt đặt bàn</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'confirmed' && (
          <View style={styles.buttonGroupVertical}>
            <View style={styles.buttonGroupRow}>
              <TouchableOpacity style={styles.warningBtn} onPress={handleNoShow}>
                <Text style={styles.warningBtnText}>Vắng mặt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryOutlineBtn} onPress={openChangeTableModal}>
                <Text style={styles.primaryOutlineText}>Đổi bàn</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.successBtnLarge} onPress={handleComplete}>
              <Text style={styles.successBtnText}>Khách đã ăn xong / Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'no_show' && booking.status !== 'pending' && (
          <TouchableOpacity style={styles.cancelBookingBtn} onPress={handleCancel}>
            <Text style={styles.cancelBookingText}>Huỷ đặt bàn</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Change Table Modal */}
      <Modal
        visible={tableModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTableModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn bàn ăn</Text>
              <TouchableOpacity onPress={() => setTableModalVisible(false)}>
                <FontAwesome name="times" size={18} color={T.color.text2} />
              </TouchableOpacity>
            </View>

            {loadingTables ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={T.color.primary} />
              </View>
            ) : (
              <FlatList
                data={availableTables}
                keyExtractor={(item) => item.tableNumber}
                renderItem={({ item }) => {
                  const isSelected = selectedTables.includes(item.tableNumber);
                  return (
                    <TouchableOpacity
                      style={[styles.tableItem, isSelected && styles.tableItemActive]}
                      onPress={() => handleToggleTableSelection(item.tableNumber)}
                    >
                      <View style={styles.tableItemInfo}>
                        <FontAwesome
                          name="circle"
                          size={12}
                          color={isSelected ? T.color.primary : T.color.text3}
                          style={{ marginRight: 10 }}
                        />
                        <Text style={[styles.tableNameText, isSelected && styles.tableNameTextActive]}>
                          Bàn {item.tableNumber} ({item.capacity} chỗ)
                        </Text>
                      </View>
                      {isSelected && <FontAwesome name="check" size={14} color={T.color.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.modalLoading}>
                    <Text style={styles.noTablesText}>Không tìm thấy bàn trống phù hợp</Text>
                  </View>
                }
                style={styles.modalList}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTableModalVisible(false)}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitTableChange}>
                <Text style={styles.modalSubmitText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  errorText: {
    color: T.color.error,
    fontSize: 16,
    marginBottom: T.space.lg,
  },
  backBtn: {
    paddingVertical: T.space.sm,
    paddingHorizontal: T.space.lg,
    backgroundColor: T.color.card,
    borderRadius: T.radius.sm,
  },
  backBtnText: {
    color: T.color.text1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.xl,
    paddingVertical: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: T.color.text1,
    fontWeight: '700',
    flex: 1,
    marginLeft: T.space.md,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: T.radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.lg,
    paddingBottom: T.space['4xl'],
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.md,
  },
  cardSectionTitle: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: T.space.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  detailLabel: {
    color: T.color.text3,
    fontSize: 13,
  },
  detailValue: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginTop: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  noteLabel: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    color: T.color.text2,
    fontSize: 12.5,
    lineHeight: 18,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  clearNotesText: {
    color: T.color.error,
    fontSize: 11,
  },
  internalNotesBox: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.md,
  },
  internalNotesContent: {
    color: T.color.text1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  noNotesText: {
    color: T.color.text3,
    fontSize: 12.5,
    marginBottom: T.space.md,
    fontStyle: 'italic',
  },
  addNoteRow: {
    flexDirection: 'row',
    gap: T.space.sm,
  },
  noteInput: {
    flex: 1,
    backgroundColor: T.color.bg,
    color: T.color.text1,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    height: 40,
    fontSize: 13,
  },
  addNoteBtn: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: T.space.xl,
    backgroundColor: T.color.bg,
    borderTopWidth: 1,
    borderTopColor: T.color.border,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  dangerBtn: {
    flex: 1,
    height: 44,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: T.color.error,
    fontSize: 14,
    fontWeight: '600',
  },
  successBtn: {
    flex: 2,
    height: 44,
    borderRadius: T.radius.md,
    backgroundColor: T.color.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBtnText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroupVertical: {
    gap: T.space.sm,
  },
  buttonGroupRow: {
    flexDirection: 'row',
    gap: T.space.sm,
  },
  warningBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBtnText: {
    color: T.color.error,
    fontSize: 13.5,
    fontWeight: '600',
  },
  primaryOutlineBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryOutlineText: {
    color: T.color.primary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  successBtnLarge: {
    height: 44,
    borderRadius: T.radius.md,
    backgroundColor: T.color.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBookingBtn: {
    height: 44,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.sm,
  },
  cancelBookingText: {
    color: T.color.error,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    marginBottom: T.space.md,
  },
  modalTitle: {
    color: T.color.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  modalLoading: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTablesText: {
    color: T.color.text3,
    fontSize: 13.5,
  },
  modalList: {
    width: '100%',
    marginBottom: T.space.lg,
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.sm,
    borderRadius: T.radius.md,
    marginBottom: T.space.xs,
  },
  tableItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tableItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableNameText: {
    color: T.color.text2,
    fontSize: 14,
  },
  tableNameTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  modalCancelText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.sm,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
});
