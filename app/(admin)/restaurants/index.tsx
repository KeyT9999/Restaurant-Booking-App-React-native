import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { StatGrid, StatCard } from '../../../src/components/admin/StatCard';
import { ActionCard } from '../../../src/components/admin/ActionCard';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';

export default function AdminRestaurantsDashboard() {
  const router = useRouter();
  const { data } = useAdminDashboard();
  const restaurantStats = data?.restaurantStats || {};
  const total = restaurantStats.totalRestaurants || 0;
  const active = restaurantStats.approvedRestaurants || 0;
  const pending = restaurantStats.pendingRestaurants || 0;
  const suspended = restaurantStats.suspendedRestaurants || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AdminHeader title="Nhà hàng" />

      <StatGrid>
        <StatCard 
          label="Đang hoạt động" 
          value={active} 
          valueColor="#10B981" 
          delta="+3 tháng này" 
          deltaType="positive" 
        />
        <StatCard 
          label="Chờ duyệt" 
          value={pending} 
          valueColor="#e8955d" 
          delta="Cần xem xét" 
          deltaType="positive" 
        />
        <StatCard 
          label="Tạm dừng" 
          value={suspended} 
          valueColor="#EF4444" 
          delta="Vi phạm chính sách" 
          deltaType="negative" 
        />
        <StatCard 
          label="Tổng" 
          value={total} 
          valueColor="#3B82F6" 
          delta="Tất cả nhà hàng" 
          deltaType="positive" 
        />
      </StatGrid>

      <View style={{ gap: 4, marginTop: 8 }}>
        <ActionCard
          icon="clock"
          title="Chờ phê duyệt"
          subtitle={`${pending} hồ sơ mới`}
          badge={pending}
          badgeBgColor="#e8955d"
          onPress={() => router.push('/(admin)/restaurants/list?approvalStatus=pending')}
        />
        <ActionCard
          icon="trending-up"
          title="Tất cả nhà hàng"
          subtitle="Quản lý danh sách"
          iconColor="#3B82F6"
          onPress={() => router.push('/(admin)/restaurants/list')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  content: { padding: 16, paddingBottom: 40 },
});
