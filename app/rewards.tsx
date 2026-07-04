import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { loyaltyApi } from '@/src/api/loyalty.api';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { LoyaltyHistoryItem } from '@/src/types/loyalty.types';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; icon: string; minPoints: number; nextAt: number | null }
> = {
  bronze: { label: 'Dong', color: '#CD7F32', icon: 'trophy', minPoints: 0, nextAt: 1000 },
  silver: { label: 'Bac', color: '#C0C0C0', icon: 'trophy', minPoints: 1000, nextAt: 3000 },
  gold: { label: 'Vang', color: '#FFD700', icon: 'trophy', minPoints: 3000, nextAt: 8000 },
  platinum: { label: 'Bach Kim', color: T.color.primary, icon: 'diamond', minPoints: 8000, nextAt: null },
};

const REWARDS_CATALOGUE = [
  { id: '1', title: 'Voucher giam 50K', cost: 500, icon: 'ticket' },
  { id: '2', title: 'Mien phi dat coc', cost: 800, icon: 'star' },
  { id: '3', title: 'Uu tien hang cho', cost: 300, icon: 'clock-o' },
  { id: '4', title: 'Voucher sinh nhat 100K', cost: 1200, icon: 'gift' },
];

const getTierFromPoints = (points: number): Tier => {
  if (points >= TIER_CONFIG.platinum.minPoints) return 'platinum';
  if (points >= TIER_CONFIG.gold.minPoints) return 'gold';
  if (points >= TIER_CONFIG.silver.minPoints) return 'silver';
  return 'bronze';
};

const getTierProgress = (points: number, tier: Tier) => {
  const currentTier = TIER_CONFIG[tier];
  if (!currentTier.nextAt) {
    return { progress: 1, remainingPoints: 0 };
  }

  const tierRange = currentTier.nextAt - currentTier.minPoints;
  const currentPointsInTier = Math.max(0, points - currentTier.minPoints);

  return {
    progress: Math.min(1, tierRange <= 0 ? 1 : currentPointsInTier / tierRange),
    remainingPoints: Math.max(currentTier.nextAt - points, 0),
  };
};

const getHistoryLabel = (item: LoyaltyHistoryItem) => {
  if (item.description) return item.description;

  const labels: Record<string, string> = {
    earn_deposit: 'Tich diem tu dat coc',
    earn_completed: 'Tich diem tu hoan tat dat ban',
    redeem_deposit: 'Dung diem de giam tien coc',
    redeem_voucher: 'Doi voucher bang diem',
    refund: 'Hoan diem',
    admin_adjust: 'Dieu chinh diem',
  };

  return labels[item.type] || item.type;
};

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [history, setHistory] = useState<LoyaltyHistoryItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await loyaltyApi.getSummary();
      if (res?.success && res.data) {
        setPoints(res.data.loyaltyPoints ?? 0);
        setTotalPointsEarned(res.data.totalPointsEarned ?? 0);
        setHistory(res.data.history ?? []);
      }
    } catch (_) {
      setPoints(0);
      setTotalPointsEarned(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tier = getTierFromPoints(points);
  const tierCfg = TIER_CONFIG[tier];
  const { progress, remainingPoints } = getTierProgress(points, tier);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.title]}>Diem thuong</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.skeletonWrapper}>
          <Skeleton width="100%" height={220} borderRadius={20} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 16 }} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Animated.View entering={FadeInDown.delay(0)} style={styles.heroCard}>
            <View style={[styles.tierBadge, { backgroundColor: `${tierCfg.color}22` }]}>
              <FontAwesome name={tierCfg.icon as never} size={14} color={tierCfg.color} />
              <Text style={[styles.tierLabel, { color: tierCfg.color }]}>{tierCfg.label}</Text>
            </View>

            <Text style={styles.pointsValue}>{points.toLocaleString('vi-VN')}</Text>
            <Text style={styles.pointsLabel}>Diem hien co</Text>

            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{totalPointsEarned.toLocaleString('vi-VN')}</Text>
                <Text style={styles.heroStatLabel}>Tong diem da tich</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{history.length.toLocaleString('vi-VN')}</Text>
                <Text style={styles.heroStatLabel}>Giao dich diem</Text>
              </View>
            </View>

            <View style={styles.progressWrapper}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` as const, backgroundColor: tierCfg.color },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {tierCfg.nextAt
                  ? `Con ${remainingPoints.toLocaleString('vi-VN')} diem len hang tiep theo`
                  : 'Ban dang o hang cao nhat'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>Cach tich diem</Text>
            {[
              { icon: 'cutlery', text: 'Dat ban thanh cong: +10 diem/lan' },
              { icon: 'star-o', text: 'Viet danh gia: +5 diem/lan' },
              { icon: 'heart-o', text: 'Yeu thich nha hang: +2 diem' },
            ].map((item, index) => (
              <View key={index} style={styles.earnRow}>
                <View style={styles.earnIcon}>
                  <FontAwesome name={item.icon as never} size={14} color={T.color.primary} />
                </View>
                <Text style={styles.earnText}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Doi qua</Text>
            <View style={styles.catalogueGrid}>
              {REWARDS_CATALOGUE.map((reward) => {
                const canRedeem = points >= reward.cost;
                return (
                  <Pressable
                    key={reward.id}
                    style={[styles.catalogCard, !canRedeem && styles.catalogCardDisabled]}
                  >
                    <FontAwesome
                      name={reward.icon as never}
                      size={22}
                      color={canRedeem ? T.color.primary : T.color.text3}
                    />
                    <Text style={[styles.catalogTitle, !canRedeem && styles.catalogTextDisabled]}>
                      {reward.title}
                    </Text>
                    <Text style={[styles.catalogCost, !canRedeem && styles.catalogTextDisabled]}>
                      {reward.cost} diem
                    </Text>
                    {!canRedeem && (
                      <Text style={styles.catalogInsuff}>Khong du diem</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {history.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Lich su diem</Text>
              {history.slice(0, 5).map((item, index) => (
                <View key={item.id || `${item.type}-${index}`} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDesc}>{getHistoryLabel(item)}</Text>
                    <Text style={styles.historyDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyPts,
                      { color: item.points > 0 ? T.color.success : T.color.error },
                    ]}
                  >
                    {item.points > 0 ? '+' : ''}
                    {item.points}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.base,
    paddingTop: 52,
    paddingBottom: T.space.md,
  },
  title: { color: T.color.text1 },
  headerSpacer: { width: 40 },
  skeletonWrapper: { padding: T.space.base },
  scroll: { padding: T.space.base, paddingBottom: 40 },
  heroCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.xl,
    alignItems: 'center',
    marginBottom: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    gap: T.space.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: T.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  tierLabel: { fontSize: 12, fontWeight: '700' },
  pointsValue: {
    fontFamily: T.font.displayBlack,
    fontSize: 52,
    fontWeight: '800',
    color: T.color.primary,
    lineHeight: 60,
  },
  pointsLabel: { color: T.color.text3, fontSize: 14 },
  heroStats: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.color.elevated,
    borderRadius: T.radius.lg,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
    marginTop: T.space.sm,
  },
  heroStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatDivider: { width: 1, alignSelf: 'stretch', backgroundColor: T.color.border },
  heroStatValue: { color: T.color.text1, fontSize: 16, fontWeight: '700' },
  heroStatLabel: { color: T.color.text3, fontSize: 11, textAlign: 'center' },
  progressWrapper: { width: '100%', gap: 6, marginTop: 4 },
  progressTrack: {
    height: 6,
    backgroundColor: T.color.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: T.color.text3, fontSize: 12, textAlign: 'center' },
  section: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    marginBottom: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  sectionTitle: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
    marginBottom: T.space.sm,
  },
  earnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,150,83,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnText: { color: T.color.text2, fontSize: 13 },
  catalogueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.md },
  catalogCard: {
    width: '46%',
    backgroundColor: T.color.elevated,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  catalogCardDisabled: { opacity: 0.5 },
  catalogTitle: {
    color: T.color.text1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  catalogCost: { color: T.color.primary, fontSize: 12, fontWeight: '700' },
  catalogTextDisabled: { color: T.color.text3 },
  catalogInsuff: { color: T.color.error, fontSize: 10 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  historyLeft: { gap: 2, flex: 1, paddingRight: T.space.md },
  historyDesc: { color: T.color.text1, fontSize: 13 },
  historyDate: { color: T.color.text3, fontSize: 11 },
  historyPts: { fontSize: 14, fontWeight: '700' },
});
