import { Stack } from 'expo-router';

export default function RevenueLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="list" />
      <Stack.Screen name="withdrawals/index" />
      <Stack.Screen name="refunds/index" />
    </Stack>
  );
}
