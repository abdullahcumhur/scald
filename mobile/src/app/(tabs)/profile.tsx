import QRCode from 'react-native-qrcode-svg';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { mockLoyaltySummary } from '@/data/mock';
import { useAuth } from '@/lib/auth-context';

type ProfileMenuItem = {
  id: string;
  label: string;
};

const profileMenuItems: ProfileMenuItem[] = [
  { id: 'order-history', label: 'Sipariş Geçmişi' },
  { id: 'favorites', label: 'Favoriler' },
  { id: 'notification-settings', label: 'Bildirim Ayarları' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isConfigured, user, profile, signOut } = useAuth();

  function handleMenuItemPress(id: string) {
    if (id === 'order-history') {
      router.push('/order-history');
      return;
    }
    // Henüz işlevsiz — ileride ilgili ekrana yönlendirme / aksiyon eklenecek.
    console.log(`Profile menu item pressed: ${id}`);
  }

  // Supabase henüz yapılandırılmadıysa (misafir/demo modu) sabit mock veriyle göster.
  const displayName = isConfigured ? (profile?.fullName ?? 'Scald Üyesi') : 'Misafir Kullanıcı';
  const displayEmail = isConfigured ? (user?.email ?? '') : 'misafir@scaldcoffee.com';
  const loyaltyPoints = isConfigured ? (profile?.loyaltyPoints ?? 0) : mockLoyaltySummary.points;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Profil
        </ThemedText>

        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
          <ThemedView type="backgroundElement" style={styles.userCard}>
            <ThemedText type="subtitle">{displayName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {displayEmail}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.userCardSpacing}>
              Sadakat Puanın
            </ThemedText>
            <ThemedText type="subtitle" themeColor="primary">
              {loyaltyPoints} puan
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mockLoyaltySummary.tier} · bir sonraki seviye {mockLoyaltySummary.nextTierAt} puan
            </ThemedText>
          </ThemedView>

          {isConfigured && user && (
            <ThemedView type="backgroundElement" style={styles.qrCard}>
              <ThemedText type="smallBold">Puan Kazan</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.qrHint}>
                Kasada bu kodu göster, puanların otomatik yüklensin.
              </ThemedText>
              <ThemedView style={styles.qrWrapper}>
                <QRCode value={user.id} size={180} />
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView style={styles.section}>
            {profileMenuItems.map((item) => (
              <Pressable key={item.id} onPress={() => handleMenuItemPress(item.id)}>
                <ThemedView type="backgroundElement" style={styles.menuRow}>
                  <ThemedText type="default">{item.label}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}

            <Pressable onPress={() => Linking.openURL('https://www.instagram.com/scald.coffee/')}>
              <ThemedView type="backgroundElement" style={styles.menuRow}>
                <ThemedText type="default">Instagram&apos;da Takip Et</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  @scald.coffee
                </ThemedText>
              </ThemedView>
            </Pressable>

            {isConfigured && user && (
              <Pressable onPress={() => signOut()}>
                <ThemedView type="backgroundElement" style={styles.menuRow}>
                  <ThemedText type="default" style={styles.signOutText}>
                    Çıkış Yap
                  </ThemedText>
                </ThemedView>
              </Pressable>
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
  qrCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  qrHint: {
    textAlign: 'center',
  },
  qrWrapper: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#ffffff',
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
  signOutText: {
    color: '#D3453B',
  },
});
