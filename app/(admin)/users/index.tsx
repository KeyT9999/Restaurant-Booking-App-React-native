import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { StatGrid, StatCard } from '../../../src/components/admin/StatCard';
import { ActionCard } from '../../../src/components/admin/ActionCard';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';

export default function AdminUsersDashboard() {
  const router = useRouter();
  const { data } = useAdminDashboard();
  const overview = data?.overview || {};
  const total = overview.totalUsers || 0;
  const owners = overview.totalOwners || 0;
  const customers = overview.totalCustomers || 0;
  const active = overview.activeUsers || 0;
  const blocked = overview.inactiveUsers || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AdminHeader title="Người dùng" />

      <StatGrid>
        <StatCard 
          label="Tổng" 
          value={total.toLocaleString()} 
          valueColor="#e8955d" 
          delta="+140 tuần" 
          deltaType="positive" 
        />
        <StatCard 
          label="Chủ nhà hàng" 
          value={owners} 
          valueColor="#3B82F6" 
          delta="Đang hoạt động" 
          deltaType="positive" 
        />
        <StatCard 
          label="Đang dùng" 
          value={active.toLocaleString()} 
          valueColor="#10B981" 
          delta="65.7%" 
          deltaType="positive" 
        />
        <StatCard 
          label="Bị chặn" 
          value={blocked} 
          valueColor="#EF4444" 
          delta="+2 tuần này" 
          deltaType="negative" 
        />
      </StatGrid>

      <View style={{ gap: 4, marginTop: 8 }}>
        <ActionCard
          icon="users"
          title="Khách hàng"
          subtitle={`${customers.toLocaleString()} người dùng`}
          iconColor="#8A8A93"
          onPress={() => router.push('/(admin)/users/list?role=customer')}
        />
        <ActionCard
          icon="user-check"
          title="Chủ nhà hàng"
          subtitle={`${owners} đối tác`}
          iconColor="#e8955d"
          onPress={() => router.push('/(admin)/users/list?role=restaurant_owner')}
        />
        <ActionCard
          icon="calendar"
          title="Đặt bàn nền tảng"
          subtitle={`${data?.bookingStats?.totalBookings || 0} tổng`}
          iconColor="#10B981"
          onPress={() => router.push('/(admin)/bookings')}
        />
        <ActionCard
          icon="trending-up"
          title="Tất cả người dùng"
          subtitle="Quản lý danh sách"
          iconColor="#3B82F6"
          onPress={() => router.push('/(admin)/users/list')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090A0F' },
  content: { padding: 16, paddingBottom: 40 },
});
