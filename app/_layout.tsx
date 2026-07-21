import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/src/auth/AuthProvider';
import { ToastProvider } from '@/src/components/ui/Toast';
import { OwnerRestaurantProvider } from '@/src/auth/OwnerRestaurantContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <OwnerRestaurantProvider>
          <RootLayoutNav />
        </OwnerRestaurantProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(owner-tabs)" />
        {/* ─── Customer-facing screens ─── */}
        <Stack.Screen name="restaurants/list" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants/menu" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants/reviews" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="recommendation" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="vouchers" options={{ headerShown: false }} />
        <Stack.Screen name="vouchers/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="wallet/index" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="booking/summary" options={{ headerShown: false }} />
        <Stack.Screen name="booking-cancel/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="review/write" options={{ headerShown: false }} />
        <Stack.Screen name="waitlist/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="waitlist/join" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[restaurantId]" options={{ headerShown: false }} />
        <Stack.Screen name="conversations/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="rewards" options={{ headerShown: false }} />
        <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
        {/* ─── Owner-specific screens ─── */}
        <Stack.Screen name="owner/booking/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="owner/menu/item-form" options={{ headerShown: false }} />
        <Stack.Screen name="owner/menu/category-form" options={{ headerShown: false }} />
        <Stack.Screen name="owner/voucher/form" options={{ headerShown: false }} />
        <Stack.Screen name="owner/vouchers" options={{ headerShown: false }} />
        <Stack.Screen name="owner/reviews" options={{ headerShown: false }} />
        <Stack.Screen name="owner/tables/form" options={{ headerShown: false }} />
        <Stack.Screen name="owner/tables/layout" options={{ headerShown: false }} />
        <Stack.Screen name="owner/waitlist/index" options={{ headerShown: false }} />
        <Stack.Screen name="owner/waitlist/assign" options={{ headerShown: false }} />
        <Stack.Screen name="owner/blocked-slots/index" options={{ headerShown: false }} />
        <Stack.Screen name="owner/wallet/index" options={{ headerShown: false }} />
        <Stack.Screen name="owner/wallet/withdraw" options={{ headerShown: false }} />
        <Stack.Screen name="owner/wallet/bank" options={{ headerShown: false }} />
        <Stack.Screen name="owner/restaurant/create" options={{ headerShown: false }} />
        <Stack.Screen name="owner/restaurant/[id]/edit" options={{ headerShown: false }} />
        <Stack.Screen name="owner/billing/index" options={{ headerShown: false }} />
        {/* ─── Admin ─── */}
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
