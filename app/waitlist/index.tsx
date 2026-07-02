import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { Chip } from '@/src/components/ui/Chip';
import { waitlistApi } from '@/src/api/waitlist.api';
import { formatDate } from '@/src/utils/format';

type WaitlistStatus = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'expired';

const STATUS_TABS: { label: string; value: WaitlistStatus }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang chờ', value: 'pending' },
  { label: 'Được nhận', value: 'confirmed' },
  { label: 'Đã hủy', value: 'cancelled' },
];

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: T.color.success,
  cancelled: T.color.error,
  expired: T.color.text3,
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Đang xếp hàng',
  confirmed: 'Bàn đã sẵn sàng',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
};

export default function MyWaitlistsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<WaitlistStatus>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await waitlistApi.getMyWaitlists({
        status: status === 'all' ? undefined : status,
        limit: 50,
      });
      setItems(res?.data?.waitlists || res?.data || []);
    } catch (e) {
      console.warn('Lỗi tải danh sách chờ:', e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => {
    const color = STATUS_COLOR[item.status] ?? T.color.text3;
    const label = STATUS_LABEL[item.status] ?? item.status;
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/waitlist/${item.id || item._id}`)}
      >
        <View style={[styles.statusBar, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.restName} numberOfLines={1}>
              {item.restaurant?.name || 'Nhà hàng'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${color}22` }]}>
              <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <FontAwesome name="calendar-o" size={12} color={T.color.text3} />
            <Text style={styles.metaText}>{formatDate(item.preferredDate)} • {item.preferredTime}</Text>
          </View>
          <View style={styles.metaRow}>
            <FontAwesome name="users" size={12} color={T.color.text3} />
            <Text style={styles.metaText}>{item.numberOfGuests} người</Text>
            {item.status === 'pending' && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <FontAwesome name="clock-o" size={12} color={T.color.primary} />
                <Text style={[styles.metaText, { color: T.color.primary }]}>
                  Vị trí #{item.queuePositionSnapshot}
                </Text>
              </>
            )}
          </View>
        </View>
        <FontAwesome name="angle-right" size={16} color={T.color.text3} style={styles.arrow} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.title]}>Danh sách chờ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabList}
        renderItem={({ item: tab }) => (
          <Chip
            key={tab.value}
            label={tab.label}
            active={status === tab.value}
            onPress={() => setStatus(tab.value)}
            sm
            style={styles.tabChip}
          />
        )}
      />

      {/* List */}
      {loading ? (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={90} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item.id || item._id || String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="clock-o"
              title="Không có lượt chờ"
              description="Bạn chưa đăng ký hàng chờ nào"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
  },
  title: { color: T.color.text1 },
  tabList: { paddingHorizontal: T.space.base, paddingBottom: T.space.md, gap: T.space.sm },
  tabChip: {},
  skeletonWrapper: { paddingHorizontal: T.space.base },
  list: { padding: T.space.base, paddingTop: 0, paddingBottom: 32 },
  card: {
    flexDirection: 'row', backgroundColor: T.color.card,
    borderRadius: T.radius.lg, marginBottom: T.space.md,
    borderWidth: 1, borderColor: T.color.border, overflow: 'hidden',
    alignItems: 'center',
  },
  statusBar: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: T.space.md, gap: 6 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  restName: { color: T.color.text1, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: T.radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: T.color.text3, fontSize: 12 },
  metaDot: { color: T.color.text3, fontSize: 12 },
  arrow: { marginRight: T.space.md },
});
