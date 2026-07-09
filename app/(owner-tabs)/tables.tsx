import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerTablesScreen() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<string>('All');

  const fetchTables = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getTables(activeRestaurant.id);
      if (res.success) {
        setTables(res.data?.tables || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      showToast('Không thể lấy danh sách bàn ăn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTables([]);
    fetchTables();
  }, [activeRestaurant]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'inactive' : 'available';
    try {
      // Optimistic update
      setTables((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t))
      );

      const res = await ownerApi.updateTableStatus(id, newStatus);
      if (res.success) {
        showToast(
          `Đã chuyển bàn sang ${newStatus === 'available' ? 'Hoạt động' : 'Ngừng hoạt động'}`,
          'success'
        );
      } else {
        // Revert
        setTables((prev) =>
          prev.map((t) => (t._id === id ? { ...t, status: currentStatus } : t))
        );
        showToast('Cập nhật trạng thái thất bại', 'error');
      }
    } catch (e: any) {
      // Revert
      setTables((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: currentStatus } : t))
      );
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  const handleDeleteTable = (id: string, tableNumber: string) => {
    Alert.alert('Xoá bàn', `Bạn có chắc chắn muốn xoá bàn "${tableNumber}" không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteTable(id);
            if (res.success) {
              showToast('Đã xoá bàn thành công', 'success');
              fetchTables(false);
            } else {
              showToast(res.message || 'Xoá bàn thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Không thể xoá bàn', 'error');
          }
        },
      },
    ]);
  };

  // Get unique zones
  const zones = ['All', ...Array.from(new Set(tables.map((t) => t.zone || 'Chung'))).filter(Boolean)];

  const filteredTables = activeZone === 'All'
    ? tables
    : tables.filter((t) => (t.zone || 'Chung') === activeZone);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return { text: T.color.success, bg: 'rgba(16, 185, 129, 0.08)' };
      case 'occupied':
        return { text: T.color.error, bg: 'rgba(244, 63, 94, 0.08)' };
      case 'reserved':
        return { text: T.color.primary, bg: 'rgba(212, 150, 83, 0.08)' };
      default:
        return { text: T.color.text3, bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đang dùng';
      case 'reserved':
        return 'Đã đặt';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return 'Không hoạt động';
    }
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Quản lý bàn" />

      {/* Header buttons */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.layoutBtn}
          onPress={() => router.push('/owner/tables/layout' as any)}
        >
          <FontAwesome name="map-o" size={13} color={T.color.text2} style={{ marginRight: 8 }} />
          <Text style={styles.layoutBtnText}>Sơ đồ mặt bằng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/owner/tables/form' as any)}
        >
          <FontAwesome name="plus" size={13} color={T.color.text1} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Thêm bàn</Text>
        </TouchableOpacity>
      </View>

      {/* Zones list */}
      <View style={{ height: 40, marginBottom: T.space.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesScroll}>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneChip, activeZone === zone && styles.zoneChipActive]}
              onPress={() => setActiveZone(zone)}
            >
              <Text style={[styles.zoneText, activeZone === zone && styles.zoneTextActive]}>
                {zone === 'All' ? 'Tất cả' : zone}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredTables.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="table" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Không tìm thấy bàn ăn nào trong khu vực này</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTables.map((item) => {
              const statusStyle = getStatusColor(item.status);
              const isActive = item.status !== 'inactive';

              return (
                <View key={item._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.tableNumber}>{item.tableNumber}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.capacityText}>{item.capacity} chỗ ngồi</Text>
                  <Text style={styles.zoneNameText}>{item.zone || 'Khu vực chung'}</Text>
                  {item.notes ? (
                    <Text style={styles.notesText} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}

                  <View style={styles.divider} />

                  <View style={styles.cardFooter}>
                    <View style={styles.switchWrapper}>
                      <Text style={styles.switchLabel}>Hoạt động</Text>
                      <Switch
                        value={isActive}
                        onValueChange={() => handleToggleStatus(item._id, item.status)}
                        trackColor={{ false: '#3A4255', true: 'rgba(16, 185, 129, 0.4)' }}
                        thumbColor={isActive ? T.color.success : T.color.text3}
                      />
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/owner/tables/form?id=${item._id}` as any)}
                      >
                        <FontAwesome name="pencil" size={12} color={T.color.text2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeleteTable(item._id, item.tableNumber)}
                      >
                        <FontAwesome name="trash" size={12} color={T.color.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  headerActions: {
    flexDirection: 'row',
    gap: T.space.md,
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.md,
    paddingBottom: T.space.sm,
  },
  layoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  layoutBtnText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.md,
  },
  addBtnText: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  zonesScroll: {
    paddingHorizontal: T.space.xl,
    alignItems: 'center',
    gap: T.space.sm,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: T.radius.full,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  zoneChipActive: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  zoneText: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '500',
  },
  zoneTextActive: {
    color: T.color.text1,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingBottom: T.space['3xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.space.md,
  },
  card: {
    width: '47.5%',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.sm,
  },
  tableNumber: {
    color: T.color.text1,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: T.radius.full,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  capacityText: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  zoneNameText: {
    color: T.color.text3,
    fontSize: 11.5,
    marginTop: 2,
  },
  notesText: {
    color: T.color.text2,
    fontSize: 11,
    marginTop: T.space.xs,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: T.space.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    color: T.color.text3,
    fontSize: 9.5,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: T.space['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
  },
});
