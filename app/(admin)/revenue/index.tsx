import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { StatGrid, StatCard } from '../../../src/components/admin/StatCard';
import { ActionCard } from '../../../src/components/admin/ActionCard';

import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';

export default function AdminFinanceDashboard() {
  const router = useRouter();
  const { data } = useAdminDashboard();
  const monetization = data?.monetization || {};
  const pendingWithdrawalsCount = data?.pendingWithdrawalsCount || 0;
  const pendingRefundsCount = data?.pendingRefundsCount || 0;
  
  const totalRevenue = monetization.paidRevenue?.total || 0;
  const commission = monetization.projectedRevenue?.bookingCommissionBillable || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AdminHeader title="Tài chính" />

      <StatGrid>
        <StatCard 
          label="Tổng doanh thu" 
          value={totalRevenue ? (totalRevenue / 1000).toFixed(0) + 'K' : '0'} 
          valueColor="#e8955d" 
          delta="Đã thanh toán" 
          deltaType="positive" 
        />
        <StatCard 
          label="Rút tiền chờ XL" 
          value={`${pendingWithdrawalsCount}`} 
          valueColor="#3B82F6" 
          delta="Yêu cầu" 
          deltaType="neutral" 
        />
        <StatCard 
          label="Hoàn tiền chờ XL" 
          value={`${pendingRefundsCount}`} 
          valueColor="#EF4444" 
          delta="Yêu cầu" 
          deltaType="negative" 
        />
        <StatCard 
          label="Hoa hồng TN" 
          value={commission ? (commission / 1000).toFixed(0) + 'K' : '0'} 
          valueColor="#10B981" 
          delta="Chờ thanh toán" 
          deltaType="positive" 
        />
      </StatGrid>

      <View style={{ gap: 4, marginTop: 8 }}>
        <ActionCard
          icon="credit-card"
          title="Yêu cầu rút tiền"
          subtitle={`${pendingWithdrawalsCount} chờ duyệt`}
          badge={pendingWithdrawalsCount}
          badgeBgColor="#e8955d"
          iconColor="#e8955d"
          onPress={() => router.navigate('/(admin)/revenue/withdrawals' as any)}
        />
        <ActionCard
          icon="refresh-cw"
          title="Yêu cầu hoàn tiền"
          subtitle={`${pendingRefundsCount} chờ duyệt`}
          badge={pendingRefundsCount}
          iconColor="#8A8A93"
          onPress={() => router.navigate('/(admin)/revenue/refunds' as any)}
        />
        <ActionCard
          icon="bar-chart-2"
          title="Báo cáo doanh thu"
          subtitle="Tải xuống PDF"
          iconColor="#8A8A93"
          onPress={() => router.navigate('/(admin)/revenue/list' as any)}
        />
        <ActionCard
          icon="gift"
          title="Voucher nền tảng"
          subtitle="Quản lý mã giảm giá"
          iconColor="#8A8A93"
          onPress={() => router.push('/(admin)/vouchers')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  content: { padding: 16, paddingBottom: 40 },
});
