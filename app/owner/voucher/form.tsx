import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function VoucherForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalUsageLimit, setGlobalUsageLimit] = useState('');
  const [perCustomerLimit, setPerCustomerLimit] = useState('1');

  const loadVoucherDetail = async () => {
    if (!isEdit || !id || !activeRestaurant?.id) return;
    setLoading(true);
    try {
      const res = await ownerApi.getVouchers(activeRestaurant.id);
      if (res.success) {
        const list = res.data || [];
        const item = list.find((x: any) => x._id === id);
        if (item) {
          setCode(item.code || '');
          setName(item.name || '');
          setDescription(item.description || '');
          setDiscountType(item.discountType || 'percentage');
          setDiscountValue(String(item.discountValue || ''));
          setMaxDiscountAmount(String(item.maxDiscountAmount || ''));
          setMinOrderAmount(String(item.minOrderAmount || ''));
          if (item.endDate) {
            // Standard format YYYY-MM-DD
            setEndDate(new Date(item.endDate).toISOString().split('T')[0]);
          }
          setGlobalUsageLimit(String(item.globalUsageLimit || ''));
          setPerCustomerLimit(String(item.perCustomerLimit || '1'));
        }
      }
    } catch (e) {
      console.error('Error fetching voucher detail:', e);
      showToast('Không thể tải chi tiết voucher', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoucherDetail();
  }, [id, activeRestaurant]);

  const handleSubmit = async () => {
    if (!activeRestaurant?.id) return;
    if (code.trim().length === 0) {
      showToast('Mã code voucher là bắt buộc', 'error');
      return;
    }
    if (name.trim().length === 0) {
      showToast('Tên voucher là bắt buộc', 'error');
      return;
    }
    if (discountValue.trim().length === 0 || isNaN(Number(discountValue))) {
      showToast('Giá trị giảm giá phải là số hợp lệ', 'error');
      return;
    }
    if (endDate.trim().length === 0) {
      showToast('Vui lòng nhập ngày hết hạn', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      restaurantId: activeRestaurant.id,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount.trim() ? Number(maxDiscountAmount) : undefined,
      minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : 0,
      endDate: new Date(endDate).toISOString(),
      globalUsageLimit: globalUsageLimit.trim() ? Number(globalUsageLimit) : undefined,
      perCustomerLimit: perCustomerLimit.trim() ? Number(perCustomerLimit) : 1,
    };

    try {
      if (isEdit && id) {
        const res = await ownerApi.updateVoucher(id, payload);
        if (res.success) {
          showToast('Cập nhật voucher thành công!', 'success');
          router.back();
        } else {
          showToast(res.message || 'Thao tác thất bại', 'error');
        }
      } else {
        const res = await ownerApi.createVoucher(payload);
        if (res.success) {
          showToast('Tạo voucher thành công!', 'success');
          router.back();
        } else {
          showToast(res.message || 'Thao tác thất bại', 'error');
        }
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={T.color.text1} />
        </TouchableOpacity>
        <Text style={[typography.displaySM, styles.headerTitle]}>
          {isEdit ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mã Code Voucher (Viết liền không dấu) *</Text>
          <TextInput
            placeholder="Ví dụ: NOIR10, GIAM20"
            placeholderTextColor={T.color.placeholder}
            autoCapitalize="characters"
            value={code}
            onChangeText={(val) => setCode(val.toUpperCase())}
            style={styles.input}
            editable={!isEdit}
          />
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên chương trình khuyến mãi *</Text>
          <TextInput
            placeholder="Ví dụ: Giảm giá mùa hè, Tri ân khách hàng"
            placeholderTextColor={T.color.placeholder}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* Discount Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loại giảm giá *</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, discountType === 'percentage' && styles.toggleBtnActive]}
              onPress={() => setDiscountType('percentage')}
            >
              <Text style={[styles.toggleText, discountType === 'percentage' && styles.toggleTextActive]}>
                Theo phần trăm (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, discountType === 'fixed' && styles.toggleBtnActive]}
              onPress={() => setDiscountType('fixed')}
            >
              <Text style={[styles.toggleText, discountType === 'fixed' && styles.toggleTextActive]}>
                Tiền cố định (VND)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Discount Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {discountType === 'percentage' ? 'Giá trị giảm (%) *' : 'Giá trị giảm (VND) *'}
          </Text>
          <TextInput
            placeholder={discountType === 'percentage' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
            placeholderTextColor={T.color.placeholder}
            keyboardType="numeric"
            value={discountValue}
            onChangeText={setDiscountValue}
            style={styles.input}
          />
        </View>

        {/* Max Discount Amount */}
        {discountType === 'percentage' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giảm tối đa (VND) - Để trống nếu không giới hạn</Text>
            <TextInput
              placeholder="Ví dụ: 100000"
              placeholderTextColor={T.color.placeholder}
              keyboardType="numeric"
              value={maxDiscountAmount}
              onChangeText={setMaxDiscountAmount}
              style={styles.input}
            />
          </View>
        )}

        {/* Min Order Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giá trị đơn hàng tối thiểu (VND)</Text>
          <TextInput
            placeholder="Ví dụ: 200000"
            placeholderTextColor={T.color.placeholder}
            keyboardType="numeric"
            value={minOrderAmount}
            onChangeText={setMinOrderAmount}
            style={styles.input}
          />
        </View>

        {/* End Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày hết hạn (YYYY-MM-DD) *</Text>
          <TextInput
            placeholder="Ví dụ: 2026-12-31"
            placeholderTextColor={T.color.placeholder}
            value={endDate}
            onChangeText={setEndDate}
            style={styles.input}
          />
        </View>

        {/* Global Usage Limit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tổng lượt sử dụng tối đa - Để trống nếu không giới hạn</Text>
          <TextInput
            placeholder="Ví dụ: 100"
            placeholderTextColor={T.color.placeholder}
            keyboardType="numeric"
            value={globalUsageLimit}
            onChangeText={setGlobalUsageLimit}
            style={styles.input}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả điều kiện áp dụng</Text>
          <TextInput
            placeholder="Ví dụ: Áp dụng cho bàn đặt trước 18:00 hàng ngày..."
            placeholderTextColor={T.color.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting || code.trim().length === 0 || name.trim().length === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={T.color.text1} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    marginLeft: T.space.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.bg,
  },
  scrollContent: {
    padding: T.space.xl,
    gap: T.space.lg,
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: T.color.card,
    color: T.color.text1,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: T.space.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: T.space.sm,
    marginTop: T.space.xs,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.card,
  },
  toggleBtnActive: {
    borderColor: T.color.primary,
    backgroundColor: 'rgba(212, 150, 83, 0.05)',
  },
  toggleText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
  submitBtn: {
    height: 48,
    borderRadius: T.radius.md,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '600',
  },
});
