import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function WaitlistAssignScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { showToast } = useToast();

  const [waitlist, setWaitlist] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [ownerNote, setOwnerNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // 1. Fetch waitlist detail
      const listRes = await ownerApi.getWaitlists();
      if (listRes.success) {
        const found = listRes.data?.waitlists?.find((w: any) => w._id === id || w.id === id);
        if (found) {
          setWaitlist(found);
        } else {
          showToast('Không tìm thấy thông tin lượt chờ', 'error');
          router.back();
          return;
        }
      }

      // 2. Fetch available tables
      const tablesRes = await ownerApi.getWaitlistAvailableTables(id as string);
      if (tablesRes.success) {
        setTables(tablesRes.data?.tables || []);
      }
    } catch (error) {
      console.error('Error loading waitlist assign data:', error);
      showToast('Không thể tải danh sách bàn trống', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleConfirmAssign = async () => {
    if (!id || !selectedTableId) return;

    setSubmitting(true);
    try {
      const res = await ownerApi.confirmWaitlist(id as string, [selectedTableId], ownerNote.trim());
      if (res.success) {
        showToast('Giao bàn ăn thành công!', 'success');
        router.push('/owner/waitlist' as any);
      } else {
        showToast(res.message || 'Giao bàn thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Xếp bàn cho khách" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Waitlist details summary */}
        {waitlist && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khách hàng:</Text>
              <Text style={styles.infoValue}>{waitlist.customerName || waitlist.customer?.fullName || 'Khách ẩn danh'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{waitlist.customerPhone || waitlist.customer?.phoneNumber || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng khách:</Text>
              <Text style={[styles.infoValue, { color: T.color.primary }]}>
                {waitlist.numberOfGuests} người
              </Text>
            </View>
            {waitlist.note && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>Yêu cầu: {waitlist.note}</Text>
              </View>
            )}
          </View>
        )}

        {/* Available tables selection list */}
        <Text style={styles.listHeader}>Chọn bàn trống thích hợp ({tables.length})</Text>

        {tables.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="info-circle" size={32} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Hiện tại không có bàn trống nào đủ sức chứa phù hợp</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tables.map((table) => {
              const isSelected = selectedTableId === table.id;
              return (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableItem,
                    isSelected && styles.tableItemActive,
                  ]}
                  onPress={() => setSelectedTableId(table.id)}
                >
                  <View
                    style={[
                      styles.tableIcon,
                      isSelected ? styles.tableIconActive : styles.tableIconNormal,
                    ]}
                  >
                    <Text style={styles.tableIconText}>{table.tableNumber}</Text>
                  </View>

                  <View style={styles.tableMeta}>
                    <Text style={styles.tableTitle}>Bàn {table.tableNumber} - {table.capacity} chỗ</Text>
                    <Text style={styles.tableZone}>{table.zone || 'Khu vực chung'}</Text>
                  </View>

                  {isSelected && (
                    <FontAwesome name="check-circle" size={18} color={T.color.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Owner Note */}
        {selectedTableId && (
          <View style={styles.noteInputGroup}>
            <Text style={styles.noteInputLabel}>Ghi chú xếp bàn (không bắt buộc)</Text>
            <TextInput
              placeholder="Nhập ghi chú cho đặt bàn này..."
              placeholderTextColor={T.color.placeholder}
              value={ownerNote}
              onChangeText={setOwnerNote}
              style={styles.textArea}
            />
          </View>
        )}

        {/* Submit action */}
        <TouchableOpacity
          style={[styles.submitBtn, !selectedTableId && styles.submitBtnDisabled]}
          disabled={!selectedTableId || submitting}
          onPress={handleConfirmAssign}
        >
          {submitting ? (
            <ActivityIndicator color={T.color.text1} />
          ) : (
            <Text style={styles.submitBtnText}>
              {selectedTableId ? 'Xác nhận giao bàn' : 'Vui lòng chọn bàn'}
            </Text>
          )}
        </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.xl,
  },
  sectionTitle: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: T.space.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: T.space.xs,
  },
  infoLabel: {
    color: T.color.text2,
    fontSize: 13,
  },
  infoValue: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    marginTop: T.space.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  noteText: {
    color: T.color.text2,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  listHeader: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  emptyContainer: {
    paddingVertical: T.space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: T.space.sm,
    marginBottom: T.space.lg,
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  tableItemActive: {
    borderColor: T.color.primary,
    backgroundColor: 'rgba(212, 150, 83, 0.04)',
  },
  tableIcon: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
  },
  tableIconNormal: {
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
  },
  tableIconActive: {
    backgroundColor: T.color.primary,
  },
  tableIconText: {
    color: T.color.text1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  tableMeta: {
    flex: 1,
  },
  tableTitle: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  tableZone: {
    color: T.color.text3,
    fontSize: 11.5,
    marginTop: 2,
  },
  noteInputGroup: {
    marginTop: T.space.md,
    gap: T.space.xs,
  },
  noteInputLabel: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    padding: T.space.md,
    color: T.color.text1,
    fontSize: 13.5,
    textAlignVertical: 'top',
    height: 60,
    marginBottom: T.space.lg,
  },
  submitBtn: {
    height: 48,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  submitBtnDisabled: {
    backgroundColor: T.color.border,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
});
