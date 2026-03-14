import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SensorsProvider } from '../services/sensor-context';
import { AlertsProvider } from '../services/alert-context';

export default function RootLayout() {
  return (
    <SensorsProvider>
      <AlertsProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AlertsProvider>
    </SensorsProvider>
  );
}