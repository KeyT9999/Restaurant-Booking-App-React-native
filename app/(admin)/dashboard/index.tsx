import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ActionCard } from '../../../src/components/admin/ActionCard';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, error, refetch } = useAdminDashboard();

  const overview = data?.overview || {};
  const restaurantStats = data?.restaurantStats || {};
  const monetization = data?.monetization || {};
  const pendingWithdrawalsCount = data?.pendingWithdrawalsCount || 0;
  const pendingRefundsCount = data?.pendingRefundsCount || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#e8955d" />}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { marginTop: Math.max(insets.top, 20) }]}>
        <View>
          <Text style={styles.greeting}>Tổng quan hệ thống</Text>
          <Text style={styles.adminLabel}>Admin Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
          <TouchableOpacity style={styles.bellIcon}>
            <Feather name="bell" size={18} color="#A0A0AB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert Card */}
      {(restaurantStats.pendingRestaurants > 0 || pendingWithdrawalsCount > 0) && (
        <View style={styles.alertCard}>
          <View style={styles.alertLeft}>
            <Feather name="alert-triangle" size={20} color="#e8955d" style={{ marginTop: 2 }} />
            <View>
              {restaurantStats.pendingRestaurants > 0 && <Text style={styles.alertTitle}>{restaurantStats.pendingRestaurants} nhà hàng chờ phê duyệt</Text>}
              {pendingWithdrawalsCount > 0 && <Text style={styles.alertDesc}>{pendingWithdrawalsCount} yêu cầu rút tiền mới</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            if (restaurantStats.pendingRestaurants > 0) {
              router.push('/(admin)/restaurants/list?approvalStatus=pending');
            } else {
              router.navigate('/(admin)/revenue/withdrawals' as any);
            }
          }}>
            <Text style={styles.alertAction}>Xem →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>DOANH THU NỀN TẢNG</Text>
          <Text style={[styles.statValue, { color: '#e8955d' }]}>
            {monetization.totalPotentialRevenue ? (monetization.totalPotentialRevenue / 1000000).toFixed(1) + 'M' : '0M'}
          </Text>
          <Text style={styles.statDelta}>↗ +0% tháng này</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TỔNG NGƯỜI DÙNG</Text>
          <Text style={[styles.statValue, { color: '#60A5FA' }]}>
            {overview.totalUsers ? overview.totalUsers.toLocaleString() : '0'}
          </Text>
          <Text style={styles.statDelta}>↗ Mới</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>NHÀ HÀNG HOẠT ĐỘNG</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {restaurantStats.approvedRestaurants || '0'}
          </Text>
          <Text style={styles.statDelta}>↗ Mới duyệt</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TỔNG NHÀ HÀNG</Text>
          <Text style={[styles.statValue, { color: '#FBBF24' }]}>
            {restaurantStats.totalRestaurants || '0'}
          </Text>
          <Text style={styles.statDelta}>↗ Hệ thống</Text>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Doanh thu nền tảng (triệu đồng)</Text>
          <TouchableOpacity>
            <Text style={styles.chartAction}>Chi tiết →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chartArea}>
          <Svg width="100%" height="80" viewBox="0 0 300 80">
            <Defs>
              <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#e8955d" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#e8955d" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M 0,60 Q 50,70 100,50 T 200,40 T 300,20 L 300,80 L 0,80 Z"
              fill="url(#grad)"
            />
            <Path
              d="M 0,60 Q 50,70 100,50 T 200,40 T 300,20"
              fill="none"
              stroke="#e8955d"
              strokeWidth="2"
            />
          </Svg>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>T2</Text>
            <Text style={styles.chartLabelText}>T3</Text>
            <Text style={styles.chartLabelText}>T4</Text>
            <Text style={styles.chartLabelText}>T5</Text>
            <Text style={styles.chartLabelText}>T6</Text>
            <Text style={styles.chartLabelText}>T7</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hành động nhanh</Text>
      <View style={{ gap: 4 }}>
        <ActionCard
          icon="file-text"
          title="Phê duyệt nhà hàng"
          subtitle={`${restaurantStats.pendingRestaurants || 0} đang chờ`}
          badge={restaurantStats.pendingRestaurants}
          onPress={() => router.push('/(admin)/restaurants/list?approvalStatus=pending')}
        />
        <ActionCard
          icon="credit-card"
          title="Yêu cầu rút tiền"
          subtitle={`${pendingWithdrawalsCount} chờ xử lý`}
          badge={pendingWithdrawalsCount}
          onPress={() => router.navigate('/(admin)/revenue/withdrawals' as any)}
        />
        <ActionCard
          icon="refresh-cw"
          title="Yêu cầu hoàn tiền"
          subtitle={`${pendingRefundsCount} chờ duyệt`}
          badge={pendingRefundsCount}
          onPress={() => router.navigate('/(admin)/revenue/refunds' as any)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  greeting: { fontSize: 13, color: '#8A8A93', marginBottom: 4 },
  adminLabel: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#042F1C',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  bellIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#14151A', justifyContent: 'center', alignItems: 'center',
  },
  alertCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#2D1B13', borderWidth: 1, borderColor: '#5C311C',
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  alertLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  alertDesc: { fontSize: 12, color: '#A0A0AB' },
  alertAction: { fontSize: 13, color: '#e8955d', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: '#121318', borderRadius: 14, padding: 16,
    width: '48%', borderWidth: 1, borderColor: '#1F2029',
  },
  statLabel: { fontSize: 10, color: '#8A8A93', letterSpacing: 1, fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  statDelta: { fontSize: 11, color: '#10B981', fontWeight: '500' },
  chartCard: {
    backgroundColor: '#121318', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1F2029', marginBottom: 24,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
  chartAction: { fontSize: 12, color: '#e8955d', fontWeight: '600' },
  chartArea: { height: 120, justifyContent: 'flex-end' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  chartLabelText: { fontSize: 11, color: '#5C5C66' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
});
