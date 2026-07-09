import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function TableFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [zone, setZone] = useState('Trong nhà');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('available');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const zonesList = ['Trong nhà', 'VIP', 'Rooftop', 'Sân vườn', 'Bar'];

  useEffect(() => {
    if (isEdit && id) {
      loadTableData();
    }
  }, [id]);

  const loadTableData = async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const res = await ownerApi.getTables(activeRestaurant.id);
      if (res.success) {
        const list = res.data?.tables || res.data || [];
        const found = list.find((t: any) => t._id === id || t.id === id);
        if (found) {
          setTableNumber(found.tableNumber || '');
          setCapacity(String(found.capacity || ''));
          setZone(found.zone || 'Trong nhà');
          setNotes(found.notes || '');
          setStatus(found.status || 'available');
        } else {
          showToast('Không tìm thấy thông tin bàn ăn', 'error');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error fetching table detail:', error);
      showToast('Lỗi khi tải thông tin bàn ăn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeRestaurant?.id) return;
    if (!tableNumber.trim()) {
      showToast('Vui lòng nhập tên/số bàn', 'error');
      return;
    }
    if (!capacity.trim() || isNaN(Number(capacity)) || Number(capacity) < 1) {
      showToast('Sức chứa phải là số lớn hơn 0', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      tableNumber: tableNumber.trim(),
      capacity: Number(capacity),
      zone: zone.trim(),
      notes: notes.trim(),
      status,
    };

    try {
      let res;
      if (isEdit && id) {
        res = await ownerApi.updateTable(id as string, payload);
      } else {
        res = await ownerApi.createTable(activeRestaurant.id, payload);
      }

      if (res.success) {
        showToast(isEdit ? 'Cập nhật bàn thành công!' : 'Thêm bàn mới thành công!', 'success');
        router.back();
      } else {
        showToast(res.message || 'Thao tác thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <RestaurantHeader title={isEdit ? 'Sửa bàn ăn' : 'Thêm bàn ăn'} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {/* Table Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên / Số hiệu bàn *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="tag" size={15} color={T.color.text3} style={styles.inputIcon} />
              <TextInput
                placeholder="Ví dụ: T1, VIP-01, Bàn số 5"
                placeholderTextColor={T.color.placeholder}
                value={tableNumber}
                onChangeText={setTableNumber}
                style={styles.input}
              />
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sức chứa (số ghế) *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="users" size={15} color={T.color.text3} style={styles.inputIcon} />
              <TextInput
                placeholder="Ví dụ: 2, 4, 8"
                placeholderTextColor={T.color.placeholder}
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
                style={styles.input}
              />
            </View>
          </View>

          {/* Zones Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Khu vực nhà hàng</Text>
            <View style={styles.zonesContainer}>
              {zonesList.map((z) => {
                const isSelected = zone === z;
                return (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoneChip, isSelected && styles.zoneChipActive]}
                    onPress={() => setZone(z)}
                  >
                    <Text style={[styles.zoneChipText, isSelected && styles.zoneChipTextActive]}>
                      {z}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              placeholder="Hoặc tự điền khu vực khác..."
              placeholderTextColor={T.color.placeholder}
              value={zone}
              onChangeText={setZone}
              style={[styles.input, styles.customZoneInput]}
            />
          </View>

          {/* Status Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trạng thái hoạt động</Text>
            <View style={styles.statusOptions}>
              {[
                { key: 'available', label: 'Hoạt động', color: T.color.success },
                { key: 'inactive', label: 'Không hoạt động', color: T.color.text3 },
                { key: 'maintenance', label: 'Bảo trì', color: T.color.error },
              ].map((opt) => {
                const isSelected = status === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.statusOpt, isSelected && { borderColor: opt.color, backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}
                    onPress={() => setStatus(opt.key)}
                  >
                    <View style={[styles.radioCircle, isSelected && { borderColor: opt.color }]}>
                      {isSelected && <View style={[styles.radioDot, { backgroundColor: opt.color }]} />}
                    </View>
                    <Text style={[styles.statusOptText, isSelected && { color: opt.color, fontWeight: '600' }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú vị trí</Text>
            <TextInput
              placeholder="Ghi chú thêm: gần cửa sổ, ngoài ban công, cạnh quầy bar..."
              placeholderTextColor={T.color.placeholder}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              style={styles.textArea}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color={T.color.text1} />
            ) : (
              <>
                <FontAwesome name="check" size={14} color={T.color.text1} style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>
                  {isEdit ? 'Lưu thay đổi' : 'Thêm bàn ăn'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    gap: T.space.lg,
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 48,
    paddingHorizontal: T.space.md,
  },
  inputIcon: {
    marginRight: T.space.md,
  },
  input: {
    flex: 1,
    color: T.color.text1,
    fontSize: 14,
    height: '100%',
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.space.sm,
    marginBottom: T.space.xs,
  },
  zoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.radius.md,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  zoneChipActive: {
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderColor: T.color.primary,
  },
  zoneChipText: {
    color: T.color.text2,
    fontSize: 12,
  },
  zoneChipTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  customZoneInput: {
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 40,
    paddingHorizontal: T.space.md,
    fontSize: 13,
  },
  statusOptions: {
    gap: T.space.sm,
  },
  statusOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 44,
    paddingHorizontal: T.space.md,
    gap: T.space.md,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: T.color.text3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptText: {
    color: T.color.text2,
    fontSize: 13,
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
    height: 80,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
    marginTop: T.space.md,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
});
