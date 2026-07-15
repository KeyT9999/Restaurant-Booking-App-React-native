import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function AdminRestaurantsLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Nếu đang load, hiển thị loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e8955d" />
      </View>
    );
  }

  // Nếu không phải admin, để (admin)/_layout.tsx xử lý redirect
  // Layout này không cần thêm redirect nữa vì parent layout đã handle
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="list" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
