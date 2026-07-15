import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter, Redirect, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OwnerRestaurantProvider, useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { useAuth } from '@/src/auth/useAuth';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Sub-component that renders the actual tabs or the empty state if the owner has no restaurants
function OwnerTabContent() {
  const { restaurants, isLoadingRestaurants, refreshRestaurants } = useOwnerRestaurant();
  const { logout } = useAuth();
  const router = useRouter();

  if (isLoadingRestaurants) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
        <Text style={[typography.bodyMD, styles.loadingText]}>Đang tải danh sách nhà hàng...</Text>
      </View>
    );
  }

  // Handle owner having no restaurants
  if (restaurants.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <FontAwesome name="building-o" size={40} color={T.color.primary} />
          </View>
          <Text style={[typography.displaySM, styles.emptyTitle]}>Chưa có nhà hàng</Text>
          <Text style={[typography.bodyMD, styles.emptySubtitle]}>
            Bạn chưa liên kết với nhà hàng nào hoặc nhà hàng đang chờ duyệt. Vui lòng thiết lập thông tin trên trang Web.
          </Text>

          <TouchableOpacity style={styles.refreshBtn} onPress={refreshRestaurants}>
            <Text style={styles.refreshBtnText}>Tải lại dữ liệu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: T.color.primary,
        tabBarInactiveTintColor: T.color.text3,
        tabBarStyle: {
          backgroundColor: T.color.card,
          borderTopWidth: 1,
          borderTopColor: T.color.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đặt bàn',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Bàn ăn',
          tabBarIcon: ({ color }) => <TabBarIcon name="table" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Thực đơn',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Nhà hàng',
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function OwnerTabLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.color.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  if (!isAuthenticated || user?.role !== 'restaurant_owner') {
    if (__DEV__) {
      console.log('[Guard redirect]', {
        from: '/' + segments.join('/'),
        to: '/(tabs)',
        role: user?.role || 'guest',
        reason: 'User is not restaurant_owner or not authenticated',
      });
    }
    return <Redirect href="/(tabs)" />;
  }

  return <OwnerTabContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: T.color.text2,
    marginTop: T.space.md,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 150, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.xl,
  },
  emptyTitle: {
    color: T.color.text1,
    textAlign: 'center',
    marginBottom: T.space.sm,
  },
  emptySubtitle: {
    color: T.color.text2,
    textAlign: 'center',
    marginBottom: T.space.xl,
    lineHeight: 20,
  },
  refreshBtn: {
    backgroundColor: T.color.primary,
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.xl,
    borderRadius: T.radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  refreshBtnText: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: T.color.border,
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.xl,
    borderRadius: T.radius.md,
    width: '100%',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: T.color.text2,
    fontSize: 15,
    fontWeight: '600',
  },
});
