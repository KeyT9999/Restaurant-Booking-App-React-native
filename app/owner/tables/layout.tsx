import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function TableLayoutScreen() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);

    try {
      const res = await ownerApi.getTables(activeRestaurant.id);
      if (res.success) {
        setTables(res.data?.tables || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching tables for layout:', error);
      showToast('Không thể lấy danh sách sơ đồ bàn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [activeRestaurant]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available':
        return { border: T.color.success, bg: 'rgba(16, 185, 129, 0.15)', text: T.color.success };
      case 'occupied':
        return { border: T.color.error, bg: 'rgba(244, 63, 94, 0.15)', text: T.color.error };
      case 'reserved':
        return { border: T.color.primary, bg: 'rgba(212, 150, 83, 0.15)', text: T.color.primary };
      default:
        return { border: T.color.text3, bg: 'rgba(255, 255, 255, 0.05)', text: T.color.text3 };
    }
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Sơ đồ bàn" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Legend */}
        <View style={styles.legendContainer}>
          {[
            { color: T.color.success, label: 'Trống' },
            { color: T.color.error, label: 'Đang dùng' },
            { color: T.color.primary, label: 'Đã đặt' },
            { color: T.color.text3, label: 'Bảo trì / Tắt' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Floor Map Area */}
        <View style={styles.floorMap}>
          {tables.length === 0 ? (
            <View style={styles.emptyMap}>
              <FontAwesome name="info-circle" size={32} color={T.color.text3} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyMapText}>Nhà hàng chưa có bàn ăn nào</Text>
            </View>
          ) : (
            tables.map((item, index) => {
              // Calculate default position if coordinates are not saved in backend
              const columnsCount = 3;
              const cellWidth = 30; // %
              const cellHeight = 18; // %
              const cellGapX = 3.3; // %
              const cellGapY = 5; // %

              const colIndex = index % columnsCount;
              const rowIndex = Math.floor(index / columnsCount);

              const defaultLeft = colIndex * (cellWidth + cellGapX) + 3.3;
              const defaultTop = rowIndex * (cellHeight + cellGapY) + 5;

              // Use custom coordinates if defined
              const left = item.coordinates?.x !== undefined ? `${item.coordinates.x}%` : `${defaultLeft}%`;
              const top = item.coordinates?.y !== undefined ? `${item.coordinates.y}%` : `${defaultTop}%`;

              const statusStyle = getStatusStyle(item.status);

              return (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={[
                    styles.tableNode,
                    {
                      left: left as any,
                      top: top as any,
                      borderColor: statusStyle.border,
                      backgroundColor: statusStyle.bg,
                    },
                  ]}
                  onPress={() => router.push(`/owner/tables/form?id=${item.id || item._id}` as any)}
                >
                  <Text style={[styles.tableNodeTitle, { color: statusStyle.text }]}>
                    {item.tableNumber}
                  </Text>
                  <Text style={styles.tableNodeSeats}>{item.capacity} ghế</Text>
                  <Text style={styles.tableNodeZone} numberOfLines={1}>
                    {item.zone || 'Chung'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          {/* Entrance Door Label */}
          {tables.length > 0 && (
            <View style={styles.entranceBadge}>
              <FontAwesome name="sign-in" size={10} color={T.color.text2} style={{ marginRight: 4 }} />
              <Text style={styles.entranceBadgeText}>CỬA VÀO</Text>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <FontAwesome name="lightbulb-o" size={16} color={T.color.primary} style={{ marginRight: 10, marginTop: 2 }} />
          <Text style={styles.infoBoxText}>
            Sơ đồ bàn mô phỏng trực quan trạng thái thời gian thực. Nhấp vào bàn bất kỳ để chỉnh sửa hoặc thay đổi trạng thái hoạt động của bàn.
          </Text>
        </View>
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    gap: T.space.md,
    justifyContent: 'space-between',
    marginBottom: T.space.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.xs,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: T.color.text2,
    fontSize: 11.5,
    fontWeight: '500',
  },
  floorMap: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    height: 400,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: T.space.lg,
  },
  emptyMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMapText: {
    color: T.color.text3,
    fontSize: 13,
  },
  tableNode: {
    position: 'absolute',
    width: '28%',
    height: '16%',
    borderRadius: T.radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.space.xs,
  },
  tableNodeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tableNodeSeats: {
    color: T.color.text1,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tableNodeZone: {
    color: T.color.text3,
    fontSize: 8.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  entranceBadge: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: T.color.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.full,
  },
  entranceBadgeText: {
    color: T.color.text2,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 150, 83, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.1)',
    borderRadius: T.radius.md,
    padding: T.space.md,
  },
  infoBoxText: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
