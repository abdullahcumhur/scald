// Bildirim Ayarları — bildirim izni durumunu gösterip yönetmeyi ve cihazda
// tutulan bildirim geçmişini görüntülemeyi sağlayan ekran. `order-history.tsx`
// ile aynı desende: `app-tabs.tsx`'te tanımlı değil, bu yüzden sekme çubuğunda
// görünmez; `profile.tsx`'ten `router.push('/notification-settings')` ile açılır.

import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNotificationHistory } from '@/hooks/use-notification-history';
import { useTheme } from '@/hooks/use-theme';

function formatReceivedAt(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.toLocaleDateString('tr-TR')} · ${date.toLocaleTimeString('tr-TR')}`;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { history, clearHistory } = useNotificationHistory();

  const [permission, setPermission] = useState<Notifications.NotificationPermissionsStatus | null>(
    null
  );
  const [requesting, setRequesting] = useState(false);

  const refreshPermission = useCallback(async () => {
    const status = await Notifications.getPermissionsAsync();
    setPermission(status);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission])
  );

  // Kullanıcı izni cihaz ayarlarından değiştirip uygulamaya geri dönebilir;
  // uygulama tekrar ön plana geldiğinde durumu yeniden okuyoruz.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPermission();
      }
    });

    return () => subscription.remove();
  }, [refreshPermission]);

  async function handleRequestPermission() {
    setRequesting(true);
    try {
      const status = await Notifications.requestPermissionsAsync();
      setPermission(status);
    } catch (error) {
      console.warn('[NotificationSettingsScreen] İzin istenirken hata oluştu:', error);
    } finally {
      setRequesting(false);
    }
  }

  const isGranted = permission?.granted ?? false;
  const canAskAgain = permission?.canAskAgain ?? true;
  const isPermanentlyDenied = !isGranted && permission?.status === 'denied' && !canAskAgain;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <ThemedText type="title" themeColor="primary" style={styles.backIcon}>
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Bildirim Ayarları
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedView style={styles.cardIconRow}>
              <Ionicons
                name={isGranted ? 'checkmark-circle' : 'notifications-outline'}
                size={28}
                color={theme.primary}
              />
              <ThemedText type="smallBold">
                {isGranted
                  ? 'Bildirimler Açık ✓'
                  : isPermanentlyDenied
                    ? 'Bildirimler Kapalı'
                    : 'Bildirimlere İzin Ver'}
              </ThemedText>
            </ThemedView>

            <ThemedText type="small" themeColor="textSecondary">
              {isGranted
                ? 'Sipariş durumu güncellemelerini ve kampanyaları bildirimlerle anında alıyorsun.'
                : isPermanentlyDenied
                  ? 'Bildirim izni cihaz ayarlarından kapatılmış. Sipariş durumu güncellemelerini ve kampanyaları almak için izni ayarlardan açman gerekiyor.'
                  : 'Sipariş durumu güncellemelerini ve kampanyaları kaçırmamak için bildirimlere izin ver.'}
            </ThemedText>

            {!isGranted && (
              <Pressable
                onPress={isPermanentlyDenied ? () => Linking.openSettings() : handleRequestPermission}
                disabled={requesting}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.primary, opacity: pressed || requesting ? 0.7 : 1 },
                ]}>
                <Ionicons
                  name={isPermanentlyDenied ? 'settings-outline' : 'notifications-outline'}
                  size={18}
                  color="#ffffff"
                />
                <ThemedText type="smallBold" style={styles.actionButtonText}>
                  {isPermanentlyDenied
                    ? 'Ayarları Aç'
                    : requesting
                      ? 'Lütfen bekleyin...'
                      : 'İzin Ver'}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

          <ThemedView style={styles.historySection}>
            <ThemedView style={styles.historyHeader}>
              <ThemedText type="smallBold">Bildirim Geçmişi</ThemedText>
              {history.length > 0 && (
                <Pressable onPress={clearHistory} hitSlop={8}>
                  <ThemedText type="small" themeColor="primary">
                    Temizle
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>

            {history.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Henüz bildirim yok.
              </ThemedText>
            ) : (
              <ThemedView style={styles.historyList}>
                {history.map((entry) => (
                  <ThemedView key={entry.id} type="backgroundElement" style={styles.historyRow}>
                    <ThemedView style={styles.historyRowHeader}>
                      <ThemedText type="small">{entry.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatReceivedAt(entry.receivedAt)}
                      </ThemedText>
                    </ThemedView>
                    {entry.body ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {entry.body}
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    backgroundColor: 'transparent',
  },
  backButton: {
    paddingRight: Spacing.one,
  },
  backIcon: {
    fontSize: 32,
    lineHeight: 36,
  },
  title: {
    flex: 1,
    fontSize: 32,
    lineHeight: 38,
  },
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  actionButtonText: {
    color: '#ffffff',
  },
  historySection: {
    gap: Spacing.three,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  historyList: {
    gap: Spacing.two,
  },
  historyRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  historyRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
});
