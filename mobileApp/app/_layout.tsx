import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SensorsProvider } from '../services/sensor-context';

export default function RootLayout() {
  return (
    <SensorsProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SensorsProvider>
  );
}