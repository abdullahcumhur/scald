import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { mockLoyaltySummary } from '@/data/mock';

// Gerçek kullanıcı verisi Supabase Auth bağlanana kadar kullanılan geçici veri.
const mockUser = {
  name: 'Misafir Kullanıcı',
  email: 'misafir@scaldcoffee.com',
};

type ProfileMenuItem = {
  id: string;
  label: string;
};

const profileMenuItems: ProfileMenuItem[] = [
  { id: 'order-history', label: 'Sipariş Geçmişi' },
  { id: 'favorites', label: 'Favoriler' },
  { id: 'notification-settings', label: 'Bildirim Ayarları' },
  { id: 'logout', label: 'Çıkış Yap' },
];

function handleMenuItemPress(id: string) {
  // Henüz işlevsiz — ileride ilgili ekrana yönlendirme / aksiyon eklenecek.
  console.log(`Profile menu item pressed: ${id}`);
}

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Profil
        </ThemedText>

        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
          <ThemedView type="backgroundElement" style={styles.userCard}>
            <ThemedText type="subtitle">{mockUser.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mockUser.email}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.userCardSpacing}>
              Sadakat Puanın
            </ThemedText>
            <ThemedText type="subtitle" themeColor="primary">
              {mockLoyaltySummary.points} puan
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mockLoyaltySummary.tier} · bir sonraki seviye {mockLoyaltySummary.nextTierAt} puan
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            {profileMenuItems.map((item) => (
              <Pressable key={item.id} onPress={() => handleMenuItemPress(item.id)}>
                <ThemedView type="backgroundElement" style={styles.menuRow}>
                  <ThemedText type="default">{item.label}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
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
  title: {
    fontSize: 32,
    lineHeight: 38,
    paddingTop: Spacing.three,
  },
  list: {
    gap: Spacing.four,
  },
  userCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  userCardSpacing: {
    marginTop: Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
