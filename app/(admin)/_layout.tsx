import React from 'react';
import { Tabs } from 'expo-router';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function AdminLayout() {
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
        name="restaurants" 
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
