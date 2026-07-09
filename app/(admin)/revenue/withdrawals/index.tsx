import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, Image, TextInput, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminWithdrawals } from '../../../../src/hooks/useAdminWithdrawals';
import { adminApi } from '../../../../src/api/admin.api';

const formatCurrency = (value?: number) => {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Chờ xử lý',  color: '#e8955d', icon: 'clock' },
  approved:  { label: 'Đã duyệt',   color: '#3B82F6', icon: 'check-circle' },
  completed: { label: 'Hoàn thành', color: '#10B981', icon: 'check-circle' },
  rejected:  { label: 'Từ chối',    color: '#EF4444', icon: 'x-circle' },
};

const FILTER_TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'pending',   label: 'Chờ xử lý' },
  { key: 'completed', label: 'Đã xong' },
  { key: 'rejected',  label: 'Từ chối' },
];

export default function AdminWithdrawalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Optimistically update a single item in the list without full refetch
  const { withdrawals: rawWithdrawals, loading, error, refetch } = useAdminWithdrawals();
  const [localWithdrawals, setLocalWithdrawals] = useState<any[]>([]);
  // Track IDs that have been optimistically updated so refetch doesn't overwrite them
  const optimisticUpdates = React.useRef<Record<string, any>>({});

  // Merge server data with any pending optimistic updates
  React.useEffect(() => {
    setLocalWithdrawals(
      rawWithdrawals.map(w => {
        const id = w._id || w.id;
        const optimistic = optimisticUpdates.current[id];
        return optimistic ? { ...w, ...optimistic } : w;
      })
    );
  }, [rawWithdrawals]);

  const filteredData = activeFilter === 'all'
    ? localWithdrawals
    : localWithdrawals.filter((w: any) => w.status === activeFilter);

  const handleAction = async (
    item: any,
    action: 'approve' | 'reject' | 'complete'
  ) => {
    if (action === 'complete') {
      setSelectedItem(item);
      setProofImageUri(null);
      setAdminNote('');
      setCompleteModalVisible(true);
      return;
    }

    const actionMap = { approve: 'Phê duyệt', reject: 'Từ chối', complete: 'Hoàn thành' };
    const isDestructive = action === 'reject';

    Alert.alert(
      'Xác nhận',
      `${actionMap[action]} yêu cầu rút ${formatCurrency(item.amount)} của "${item.restaurant?.name || 'nhà hàng'}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionMap[action],
          style: isDestructive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setProcessingId(item._id || item.id);
              let res;
              if (action === 'approve') res = await adminApi.approveWithdrawal(item._id || item.id);
              else if (action === 'reject') res = await adminApi.rejectWithdrawal(item._id || item.id);

              if (res?.success !== false) {
                Alert.alert('Thành công', `Đã ${actionMap[action].toLowerCase()} yêu cầu`);
                refetch();
              } else {
                Alert.alert('Lỗi', res?.message || 'Không thể thực hiện');
              }
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể thực hiện');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImageUri(result.assets[0].uri);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!selectedItem) return;
    try {
      setIsCompleting(true);
      let uploadedUrl: string | undefined;
      
      if (proofImageUri) {
        console.log('[Withdrawal] Uploading proof image...');
        const formData = new FormData();
        formData.append('image', {
          uri: proofImageUri,
          name: 'proof_' + Date.now() + '.jpg',
          type: 'image/jpeg',
        } as any);
        
        const uploadRes = await adminApi.uploadImage(formData);
        console.log('[Withdrawal] Upload result:', JSON.stringify(uploadRes));
        
        if (uploadRes?.success && uploadRes?.data?.url) {
          uploadedUrl = uploadRes.data.url;
          console.log('[Withdrawal] Uploaded URL:', uploadedUrl);
        } else {
          // Upload failed — stop and show error
          Alert.alert('Lỗi upload ảnh', uploadRes?.message || 'Không thể tải lên ảnh chứng từ. Vui lòng thử lại.');
          return;
        }
      }
      
      console.log('[Withdrawal] Completing with proofImage:', uploadedUrl || '(none)');
      const res = await adminApi.completeWithdrawal(selectedItem._id || selectedItem.id, {
        proofImage: uploadedUrl,
        adminNote: adminNote || undefined,
      });
      console.log('[Withdrawal] Complete response:', JSON.stringify(res));
      
      if (res?.success !== false) {
        Alert.alert('Thành công', 'Đã hoàn tất yêu cầu rút tiền');
        setCompleteModalVisible(false);
        const updatedId = selectedItem._id || selectedItem.id;
        const patch = { status: 'completed', proofImage: uploadedUrl, adminNote: adminNote || undefined };
        // 1. Store in ref so future refetches merge instead of overwrite
        optimisticUpdates.current[updatedId] = patch;
        // 2. Update local display immediately
        setLocalWithdrawals(prev => prev.map(w =>
          (w._id === updatedId || w.id === updatedId) ? { ...w, ...patch } : w
        ));
        // 3. Refetch after short delay to get canonical server data
        setTimeout(() => refetch(), 2000);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể thực hiện');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể thực hiện');
    } finally {
      setIsCompleting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const st = STATUS_CONFIG[item.status] || { label: item.status, color: '#5C5C66', icon: 'help-circle' };
    const isProcessing = processingId === (item._id || item.id);
    // restaurantId is the populated field from the backend
    const restaurantName = item.restaurantId?.name || item.restaurant?.name || 'Nhà hàng';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
            <Feather name={st.icon} size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>

        {/* Bank Info */}
        {item.bankInfo && (
          <View style={styles.bankCard}>
            <Feather name="credit-card" size={14} color="#5C5C66" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>{item.bankInfo.bankName}</Text>
              <Text style={styles.bankDetail}>
                {item.bankInfo.accountNumber} · {item.bankInfo.accountHolder}
              </Text>
            </View>
          </View>
        )}

        {/* Proof Image */}
        {item.proofImage && (
          <View style={styles.proofContainer}>
            <View style={styles.proofHeader}>
              <Feather name="image" size={13} color="#10B981" />
              <Text style={styles.proofText}>Ảnh minh chứng (nhấn để xem to)</Text>
            </View>
            <TouchableOpacity
              onPress={() => setViewingImage(item.proofImage)}
              activeOpacity={0.8}
            >
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: item.proofImage }}
                  style={styles.proofImagePreview}
                  resizeMode="cover"
                  onError={() => console.log('[Withdrawal] Image load error:', item.proofImage)}
                />
                <View style={styles.proofImageOverlay}>
                  <Feather name="maximize-2" size={16} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Note */}
        {item.note ? (
          <View style={styles.noteRow}>
            <Feather name="file-text" size={13} color="#5C5C66" />
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {isProcessing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color="#e8955d" />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        ) : item.status === 'pending' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnApprove]} onPress={() => handleAction(item, 'approve')}>
              <Feather name="check" size={15} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>Phê duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnReject]} onPress={() => handleAction(item, 'reject')}>
              <Feather name="x" size={15} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === 'approved' ? (
          <TouchableOpacity style={[styles.actionBtn, styles.btnComplete, { marginTop: 14 }]} onPress={() => handleAction(item, 'complete')}>
            <Feather name="check-circle" size={15} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Xác nhận đã chuyển tiền</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Yêu cầu rút tiền</Text>
          <Text style={styles.headerSub}>{filteredData.length} yêu cầu</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color="#e8955d" />
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

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#e8955d" style={{ marginTop: 60 }} />
      ) : error ? (
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#e8955d" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#2A2D3A" />
              <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
            </View>
          }
        />
      )}

      {/* Complete Modal */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isCompleting && setCompleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} style={{ width: '100%' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xác nhận hoàn tất</Text>
              <Text style={styles.modalDesc}>
                Xác nhận bạn đã chuyển {selectedItem ? formatCurrency(selectedItem.amount) : ''} cho nhà hàng.
              </Text>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={isCompleting}>
                <Feather name="upload-cloud" size={20} color="#e8955d" />
                <Text style={styles.uploadBtnText}>
                  {proofImageUri ? 'Đổi ảnh chứng từ' : 'Tải lên ảnh chứng từ (Không bắt buộc)'}
                </Text>
              </TouchableOpacity>

              {proofImageUri && (
                <Image source={{ uri: proofImageUri }} style={styles.uploadedImage} />
              )}

              <TextInput
                style={styles.noteInput}
                placeholder="Ghi chú thêm (Không bắt buộc)"
                placeholderTextColor="#5C5C66"
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
                editable={!isCompleting}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCompleteModalVisible(false)}
                  disabled={isCompleting}
                >
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCompleteSubmit}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Hoàn tất</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* View Image Modal */}
      <Modal visible={!!viewingImage} transparent animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={styles.viewImageOverlay}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setViewingImage(null)}>
            <Feather name="x" size={28} color="#FFF" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16,
    backgroundColor: '#0F111A', borderBottomWidth: 1, borderBottomColor: '#1A1D27',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#5C5C66', textAlign: 'center', marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16171D', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#e8955d' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#5C5C66' },
  filterTextActive: { color: '#FFF' },

  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#16171D', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#1E1F28',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  date: { fontSize: 12, color: '#3A3D4D' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },

  amount: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 12 },

  bankCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#1E1F28', borderRadius: 10, padding: 10, marginBottom: 8,
  },
  bankName: { fontSize: 13, fontWeight: '700', color: '#8A8A93', marginBottom: 2 },
  bankDetail: { fontSize: 13, color: '#5C5C66' },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  noteText: { fontSize: 13, color: '#5C5C66', flex: 1 },

  processingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: 10 },
  processingText: { color: '#5C5C66', fontSize: 14 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1,
  },
  btnApprove: { backgroundColor: '#10B98115', borderColor: '#10B98140' },
  btnReject: { backgroundColor: '#EF444415', borderColor: '#EF444440' },
  btnComplete: { backgroundColor: '#3B82F615', borderColor: '#3B82F640' },
  actionText: { fontSize: 14, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#3A3D4D', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },

  proofContainer: { marginTop: 8, padding: 10, backgroundColor: '#1E1F28', borderRadius: 10, overflow: 'hidden' },
  proofHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  proofText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  proofImagePreview: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#2A2D3A' },
  proofImageOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#16171D', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1E1F28' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#8A8A93', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, backgroundColor: '#1E1F28', borderRadius: 12, borderWidth: 1, borderColor: '#e8955d40', marginBottom: 12 },
  uploadBtnText: { color: '#e8955d', fontSize: 14, fontWeight: '600' },
  uploadedImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 16 },
  noteInput: { backgroundColor: '#1E1F28', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1E1F28', alignItems: 'center' },
  modalCancelText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' },
  modalSubmitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  viewImageOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
  fullScreenImage: { width: '100%', height: '100%' },
});

