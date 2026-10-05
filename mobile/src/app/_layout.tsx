import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
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

  return <AppTabs />;
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
