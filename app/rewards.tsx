import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { apiClient } from '@/src/api/client';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_CONFIG: Record<Tier, { label: string; color: string; icon: string; nextAt: number }> = {
  bronze:   { label: 'Đồng',    color: '#CD7F32', icon: 'trophy', nextAt: 1000 },
  silver:   { label: 'Bạc',     color: '#C0C0C0', icon: 'trophy', nextAt: 3000 },
  gold:     { label: 'Vàng',    color: '#FFD700', icon: 'trophy', nextAt: 8000 },
  platinum: { label: 'Bạch Kim',color: T.color.primary, icon: 'diamond', nextAt: 99999 },
};

const REWARDS_CATALOGUE = [
  { id: '1', title: 'Voucher giảm 50K', cost: 500, icon: 'ticket' },
  { id: '2', title: 'Miễn phí đặt cọc', cost: 800, icon: 'star' },
  { id: '3', title: 'Ưu tiên hàng chờ', cost: 300, icon: 'clock-o' },
  { id: '4', title: 'Voucher sinh nhật 100K', cost: 1200, icon: 'gift' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState<Tier>('bronze');
  const [history, setHistory] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/users/me/rewards').catch(() => null);
      if (res?.data?.success) {
        const data = res.data.data;
        setPoints(data.points ?? 0);
        setTier((data.tier as Tier) ?? 'bronze');
        setHistory(data.history ?? []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const progress = Math.min(1, points / tierCfg.nextAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.title]}>Điểm thưởng</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.skeletonWrapper}>
          <Skeleton width="100%" height={200} borderRadius={20} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 16 }} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Points Hero Card */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.heroCard}>
            <View style={[styles.tierBadge, { backgroundColor: `${tierCfg.color}22` }]}>
              <FontAwesome name={tierCfg.icon as any} size={14} color={tierCfg.color} />
              <Text style={[styles.tierLabel, { color: tierCfg.color }]}>{tierCfg.label}</Text>
            </View>
            <Text style={styles.pointsValue}>{points.toLocaleString('vi-VN')}</Text>
            <Text style={styles.pointsLabel}>Điểm tích lũy</Text>
            {/* Progress bar */}
            <View style={styles.progressWrapper}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: tierCfg.color }]} />
              </View>
              <Text style={styles.progressLabel}>
                Còn {(tierCfg.nextAt - points).toLocaleString('vi-VN')} điểm lên hạng tiếp theo
              </Text>
            </View>
          </Animated.View>

          {/* How to earn */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>Cách tích điểm</Text>
            {[
              { icon: 'cutlery', text: 'Đặt bàn thành công: +10 điểm/lần' },
              { icon: 'star-o', text: 'Viết đánh giá: +5 điểm/lần' },
              { icon: 'heart-o', text: 'Yêu thích nhà hàng: +2 điểm' },
            ].map((item, i) => (
              <View key={i} style={styles.earnRow}>
                <View style={styles.earnIcon}>
                  <FontAwesome name={item.icon as any} size={14} color={T.color.primary} />
                </View>
                <Text style={styles.earnText}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Catalogue */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Đổi quà</Text>
            <View style={styles.catalogueGrid}>
              {REWARDS_CATALOGUE.map((r) => {
                const canRedeem = points >= r.cost;
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.catalogCard, !canRedeem && styles.catalogCardDisabled]}
                    onPress={() => !canRedeem ? null : undefined}
                  >
                    <FontAwesome name={r.icon as any} size={22} color={canRedeem ? T.color.primary : T.color.text3} />
                    <Text style={[styles.catalogTitle, !canRedeem && { color: T.color.text3 }]}>{r.title}</Text>
                    <Text style={[styles.catalogCost, !canRedeem && { color: T.color.text3 }]}>{r.cost} điểm</Text>
                    {!canRedeem && (
                      <Text style={styles.catalogInsuff}>Không đủ điểm</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* History */}
          {history.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch sử điểm</Text>
              {history.slice(0, 5).map((h: any, i) => (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDesc}>{h.description || h.type}</Text>
                    <Text style={styles.historyDate}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString('vi-VN') : ''}</Text>
                  </View>
                  <Text style={[styles.historyPts, { color: (h.points ?? 0) > 0 ? T.color.success : T.color.error }]}>
                    {(h.points ?? 0) > 0 ? '+' : ''}{h.points ?? 0}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
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
  skeletonWrapper: { padding: T.space.base },
  scroll: { padding: T.space.base, paddingBottom: 40 },
  heroCard: {
    backgroundColor: T.color.card, borderRadius: T.radius.xl,
    padding: T.space.xl, alignItems: 'center', marginBottom: T.space.lg,
    borderWidth: 1, borderColor: T.color.border, gap: T.space.sm,
  },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: T.radius.full, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 4,
  },
  tierLabel: { fontSize: 12, fontWeight: '700' },
  pointsValue: {
    fontFamily: T.font.displayBlack, fontSize: 52, fontWeight: '800',
    color: T.color.primary, lineHeight: 60,
  },
  pointsLabel: { color: T.color.text3, fontSize: 14 },
  progressWrapper: { width: '100%', gap: 6, marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: T.color.elevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: T.color.text3, fontSize: 12, textAlign: 'center' },
  section: {
    backgroundColor: T.color.card, borderRadius: T.radius.xl,
    padding: T.space.lg, marginBottom: T.space.lg,
    borderWidth: 1, borderColor: T.color.border,
  },
  sectionTitle: {
    color: T.color.text1, fontSize: 15, fontWeight: '700',
    marginBottom: T.space.md,
  },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: T.space.md, marginBottom: T.space.sm },
  earnIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(212,150,83,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  earnText: { color: T.color.text2, fontSize: 13 },
  catalogueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.md },
  catalogCard: {
    width: '46%', backgroundColor: T.color.elevated,
    borderRadius: T.radius.lg, padding: T.space.md,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.color.border,
  },
  catalogCardDisabled: { opacity: 0.5 },
  catalogTitle: { color: T.color.text1, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  catalogCost: { color: T.color.primary, fontSize: 12, fontWeight: '700' },
  catalogInsuff: { color: T.color.error, fontSize: 10 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: T.space.sm, borderBottomWidth: 1, borderBottomColor: T.color.border,
  },
  historyLeft: { gap: 2 },
  historyDesc: { color: T.color.text1, fontSize: 13 },
  historyDate: { color: T.color.text3, fontSize: 11 },
  historyPts: { fontSize: 14, fontWeight: '700' },
});
