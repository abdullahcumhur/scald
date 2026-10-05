import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isConfigured, loading, session } = useAuth();

  // Supabase henüz yapılandırılmadıysa (EXPO_PUBLIC_SUPABASE_URL yok) auth
  // akışını atlayıp doğrudan misafir/demo modunda sekmeleri göster.
  if (isConfigured && loading) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (isConfigured && !session) {
    return <AuthScreen />;
  }

  // (tabs) grubu NativeTabs'i barındırır. order-history gibi tab olmayan
  // ekranlar bu Stack'e kardeş olarak eklenir ki router.push ile erişilebilsin
  // — NativeTabs tek başına, Trigger olarak tanımlanmamış route'lara
  // navigasyonu native tarafta sessizce yok sayar.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order-history" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
