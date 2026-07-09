import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { T } from '@/src/theme/tokens';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (user?.role === 'restaurant_owner') {
        router.replace('/(owner-tabs)' as any);
      } else if (user?.role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={T.color.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
