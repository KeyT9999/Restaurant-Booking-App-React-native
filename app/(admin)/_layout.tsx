import React from 'react';
import { Tabs, Redirect, useSegments } from 'expo-router';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/auth/useAuth';

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e8955d" />
      </View>
    );
  }

  // Chỉ redirect khi user thực sự đang cố truy cập (admin) group
  // Kiểm tra segment đầu tiên để xác định context navigation
  if (!isAuthenticated || user?.role !== 'admin') {
    if (__DEV__) {
      console.log('[Guard redirect]', {
        from: '/' + segments.join('/'),
        to: '/(tabs)',
        role: user?.role || 'guest',
        reason: 'User is not admin or not authenticated',
      });
    }
    return <Redirect href="/(tabs)" />;
  }


  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#e8955d',
        tabBarInactiveTintColor: '#5C5C66',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen 
        name="dashboard/index" 
        options={{ 
          title: 'Dashboard', 
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="manage-restaurants" 
        options={{ 
          title: 'Nhà hàng',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="users" 
        options={{ 
          title: 'Người dùng',
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="revenue" 
        options={{ 
          title: 'Tài chính',
          tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="settings/index" 
        options={{ 
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} /> 
        }} 
      />

      {/* Hidden detail screens */}
      <Tabs.Screen name="vouchers/index" options={{ href: null, title: 'Vouchers' }} />
      <Tabs.Screen name="bookings/index" options={{ href: null, title: 'Tất cả đặt bàn' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#16171D',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    position: 'absolute',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 0,
  }
});
