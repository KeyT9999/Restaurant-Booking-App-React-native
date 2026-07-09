import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';

const CHART_DATA = [
  { label: 'T1', value: 45 },
  { label: 'T2', value: 65 },
  { label: 'T3', value: 80 },
  { label: 'T4', value: 105 },
  { label: 'T5', value: 135 },
  { label: 'T6', value: 175 },
  { label: 'T7', value: 220 },
];
const MAX_CHART_VAL = 220;

export default function AdminRevenueDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data } = useAdminDashboard();
  const monetization = data?.monetization || {};
  
  const totalRevenue = monetization.paidRevenue?.total || 0;
  const commission = monetization.projectedRevenue?.bookingCommissionBillable || 0;
  const featured = monetization.paidRevenue?.featuredRestaurant || 0;
  const refunds = data?.pendingRefundsCount || 0;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo Doanh thu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        {/* Stat Grid */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>THÁNG NÀY</Text>
            <Text style={[styles.cardValue, { color: '#e8955d' }]}>{formatCurrency(totalRevenue)}</Text>
            <Text style={[styles.cardDelta, { color: '#10B981' }]}>Tổng ĐT</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HOA HỒNG (5%)</Text>
            <Text style={[styles.cardValue, { color: '#10B981' }]}>{formatCurrency(commission)}</Text>
            <Text style={[styles.cardDelta, { color: '#10B981' }]}>Chờ thu</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>GÓI NỔI BẬT</Text>
            <Text style={[styles.cardValue, { color: '#3B82F6' }]}>{formatCurrency(featured)}</Text>
            <Text style={[styles.cardDelta, { color: '#10B981' }]}>Đã thanh toán</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HOÀN TIỀN</Text>
            <Text style={[styles.cardValue, { color: '#EF4444' }]}>{refunds}</Text>
            <Text style={[styles.cardDelta, { color: '#EF4444' }]}>yêu cầu</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Doanh thu 7 tháng (Minh họa)</Text>
          <View style={styles.chartContainer}>
            {/* Y Axis */}
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>220</Text>
              <Text style={styles.axisText}>165</Text>
              <Text style={styles.axisText}>110</Text>
              <Text style={styles.axisText}>55</Text>
              <Text style={styles.axisText}>0</Text>
            </View>
            {/* Bars */}
            <View style={styles.barsArea}>
              {CHART_DATA.map((item, index) => {
                const heightPercent = (item.value / MAX_CHART_VAL) * 100;
                return (
                  <View key={index} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Top Restaurants */}
        <Text style={styles.sectionTitle}>Top nhà hàng doanh thu (Minh họa)</Text>
        
        <View style={styles.listItem}>
          <Text style={styles.listName}>Noir Saigon</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.listVal}>45M</Text>
            <Text style={styles.listSub}>21%</Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listName}>Omakase Haneda</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.listVal}>38M</Text>
            <Text style={styles.listSub}>18%</Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listName}>The Grill House</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.listVal}>31M</Text>
            <Text style={styles.listSub}>15%</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: '#090A0F',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16171D', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  content: { padding: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: '#16171D', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1E1F28'
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#5C5C66', letterSpacing: 1, marginBottom: 12 },
  cardValue: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  cardDelta: { fontSize: 12, fontWeight: '500' },

  chartCard: {
    backgroundColor: '#16171D', borderRadius: 20, padding: 20,
    marginBottom: 32, borderWidth: 1, borderColor: '#1E1F28'
  },
  chartTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 24 },
  chartContainer: { flexDirection: 'row', height: 200 },
  yAxis: { justifyContent: 'space-between', paddingBottom: 24, paddingRight: 10 },
  axisText: { fontSize: 11, color: '#5C5C66', fontWeight: '500' },
  barsArea: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginLeft: 10 },
  barCol: { alignItems: 'center', width: 30, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', marginBottom: 10 },
  barFill: { width: '100%', backgroundColor: '#e8955d', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 11, color: '#5C5C66', fontWeight: '500' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#8A8A93', marginBottom: 16 },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#16171D', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1E1F28'
  },
  listName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  listVal: { fontSize: 16, fontWeight: '800', color: '#e8955d', marginBottom: 4 },
  listSub: { fontSize: 12, color: '#5C5C66', fontWeight: '500' },
});
