import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedView } from '@/components/themed-view';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useNotificationHistoryListener } from '@/hooks/use-notification-history';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { FavoritesProvider } from '@/lib/favorites-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isConfigured, loading, session } = useAuth();

  // Gelen bildirimleri cihazdaki bildirim geçmişi listesine eklemek için
  // uygulama genelinde tek bir dinleyici — bildirim ayarları ekranı açık
  // olmasa da çalışmalı.
  useNotificationHistoryListener();

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
      <Stack.Screen name="notification-settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="locations" options={{ presentation: 'card' }} />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="favorites" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useAppFonts();

  // Fontlar yüklenene kadar hiçbir şey render etmiyoruz; splash screen zaten
  // görünür kaldığı için (SplashScreen.preventAutoHideAsync + hideAsync'i
  // yalnızca AnimatedSplashOverlay çağırıyor) kullanıcıya boş ekran gibi
  // görünmez. Bu sayede sistem fontuyla render olup sonra marka fontuna
  // geçen bir "flash" yaşanmaz.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <AnimatedSplashOverlay />
            <RootNavigator />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
