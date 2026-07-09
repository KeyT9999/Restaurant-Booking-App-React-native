import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminVouchers } from '../../../src/hooks/useAdminVouchers';
import { adminApi } from '../../../src/api/admin.api';

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Hoạt động' },
  { key: 'expired', label: 'Hết hạn' },
];

export default function AdminVouchersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, error, refresh, loadMore } = useAdminVouchers();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    maxUsage: '', expiryDate: '', description: '',
  });

  const filteredData = data.filter((item: any) => {
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    if (activeFilter === 'active') return item.isActive && !isExpired;
    if (activeFilter === 'expired') return isExpired;
    return true;
  });

  const handleCreate = async () => {
    if (!form.code || !form.discountValue) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã và giá trị giảm giá');
      return;
    }
    try {
      setCreating(true);
      const payload = {
        name: `Voucher ${form.code.toUpperCase().trim()}`,
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        globalUsageLimit: form.maxUsage ? Number(form.maxUsage) : undefined,
        endDate: form.expiryDate || undefined,
        description: form.description || undefined,
      };
      const res = await adminApi.createVoucher(payload);
      if (res?.success || res?.data) {
        Alert.alert('Thành công', `Đã tạo voucher ${payload.code}`);
        setShowCreate(false);
        setForm({ code: '', discountType: 'percentage', discountValue: '', maxUsage: '', expiryDate: '', description: '' });
        refresh();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể tạo voucher');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tạo voucher');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const isActive = item.isActive && !isExpired;
    const statusColor = isActive ? '#10B981' : isExpired ? '#EF4444' : '#5C5C66';
    const statusLabel = isActive ? 'Hoạt động' : isExpired ? 'Hết hạn' : 'Vô hiệu';

    return (
      <View style={[styles.card, !isActive && styles.cardDimmed]}>
        <View style={styles.cardTop}>
          {/* Code + Type */}
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Feather name="tag" size={14} color="#e8955d" />
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          {/* Discount Value */}
          <Text style={styles.discountValue}>
            {item.discountType === 'percentage'
              ? `Giảm ${item.discountValue}%`
              : `Giảm ${(item.discountValue || 0).toLocaleString('vi-VN')}đ`}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color="#5C5C66" />
            <Text style={styles.metaText}>HSD: {formatDate(item.expiryDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={12} color="#5C5C66" />
            <Text style={styles.metaText}>Dùng: {item.usageCount || 0}/{item.maxUsage || '∞'}</Text>
          </View>
          {item.minOrderValue > 0 && (
            <View style={styles.metaItem}>
              <Feather name="shopping-cart" size={12} color="#5C5C66" />
              <Text style={styles.metaText}>Tối thiểu: {(item.minOrderValue || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
          )}
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Voucher Hệ thống</Text>
          <Text style={styles.headerSub}>{filteredData.length} vouchers</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && data.length === 0 ? (
        <ActivityIndicator size="large" color="#e8955d" style={{ marginTop: 60 }} />
      ) : error && data.length === 0 ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => item._id || item.id || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e8955d" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="tag" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Chưa có voucher nào</Text>
              <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreate(true)}>
                <Text style={styles.emptyCreateText}>Tạo voucher đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Voucher Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalSheet}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo Voucher Mới</Text>
                <TouchableOpacity onPress={() => setShowCreate(false)}>
                  <Ionicons name="close" size={24} color="#8A8A93" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Code */}
                <Text style={styles.fieldLabel}>Mã Voucher *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: SUMMER2025"
                  placeholderTextColor="#3A3D4D"
                  value={form.code}
                  onChangeText={(v) => setForm(f => ({ ...f, code: v.toUpperCase() }))}
                  autoCapitalize="characters"
                />

                {/* Discount Type */}
                <Text style={styles.fieldLabel}>Loại giảm giá *</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, form.discountType === 'percentage' && styles.typeBtnActive]}
                    onPress={() => setForm(f => ({ ...f, discountType: 'percentage' }))}
                  >
                    <Text style={[styles.typeBtnText, form.discountType === 'percentage' && styles.typeBtnTextActive]}>% Phần trăm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, form.discountType === 'fixed' && styles.typeBtnActive]}
                    onPress={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                  >
                    <Text style={[styles.typeBtnText, form.discountType === 'fixed' && styles.typeBtnTextActive]}>₫ Số tiền</Text>
                  </TouchableOpacity>
                </View>

                {/* Discount Value */}
                <Text style={styles.fieldLabel}>Giá trị giảm *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={form.discountType === 'percentage' ? 'VD: 20 (%)' : 'VD: 50000 (VNĐ)'}
                  placeholderTextColor="#3A3D4D"
                  value={form.discountValue}
                  onChangeText={(v) => setForm(f => ({ ...f, discountValue: v }))}
                  keyboardType="numeric"
                />

                {/* Max Usage */}
                <Text style={styles.fieldLabel}>Số lần dùng tối đa</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Để trống = không giới hạn"
                  placeholderTextColor="#3A3D4D"
                  value={form.maxUsage}
                  onChangeText={(v) => setForm(f => ({ ...f, maxUsage: v }))}
                  keyboardType="numeric"
                />

                {/* Expiry Date */}
                <Text style={styles.fieldLabel}>Ngày hết hạn (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2025-12-31"
                  placeholderTextColor="#3A3D4D"
                  value={form.expiryDate}
                  onChangeText={(v) => setForm(f => ({ ...f, expiryDate: v }))}
                />
                
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={styles.quickDateBtn}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setForm(f => ({ ...f, expiryDate: d.toISOString().split('T')[0] }));
                    }}
                  >
                    <Text style={styles.quickDateText}>+7 ngày</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickDateBtn}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setForm(f => ({ ...f, expiryDate: d.toISOString().split('T')[0] }));
                    }}
                  >
                    <Text style={styles.quickDateText}>+30 ngày</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickDateBtn}
                    onPress={() => {
                      const d = new Date();
                      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                      setForm(f => ({ ...f, expiryDate: endOfMonth.toISOString().split('T')[0] }));
                    }}
                  >
                    <Text style={styles.quickDateText}>Cuối tháng</Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={styles.fieldLabel}>Mô tả</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Mô tả ngắn về voucher..."
                  placeholderTextColor="#3A3D4D"
                  value={form.description}
                  onChangeText={(v) => setForm(f => ({ ...f, description: v }))}
                  multiline
                />

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitText}>Tạo Voucher</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16,
    backgroundColor: '#0F111A', borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#5C5C66', textAlign: 'center', marginTop: 2 },
  createBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8955d', justifyContent: 'center', alignItems: 'center' },

  // Filter
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16171D', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#e8955d' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#5C5C66' },
  filterTextActive: { color: '#FFF' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: { backgroundColor: '#16171D', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1E1F28' },
  cardDimmed: { opacity: 0.55 },
  cardTop: { marginBottom: 12 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  codeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeText: { fontSize: 17, fontWeight: '800', color: '#e8955d', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  discountValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#5C5C66' },
  description: { fontSize: 12, color: '#3A3D4D', marginTop: 8, fontStyle: 'italic' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#3A3D4D', fontSize: 16 },
  emptyCreateBtn: { marginTop: 8, backgroundColor: '#e8955d', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyCreateText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0F111A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  fieldLabel: { fontSize: 13, color: '#8A8A93', marginBottom: 8, marginTop: 16, fontWeight: '600' },
  input: {
    backgroundColor: '#16171D', borderRadius: 12, borderWidth: 1, borderColor: '#1E1F28',
    color: '#FFF', fontSize: 15, paddingHorizontal: 16, paddingVertical: 12,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#16171D', borderWidth: 1, borderColor: '#1E1F28', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#e8955d20', borderColor: '#e8955d' },
  typeBtnText: { fontSize: 14, color: '#5C5C66', fontWeight: '600' },
  typeBtnTextActive: { color: '#e8955d' },
  submitBtn: {
    marginTop: 24, backgroundColor: '#e8955d', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 32,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  quickDateBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E1F28', borderRadius: 8, borderWidth: 1, borderColor: '#3A3D4D' },
  quickDateText: { fontSize: 12, color: '#FFF' },
});
