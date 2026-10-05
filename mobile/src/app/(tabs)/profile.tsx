import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

const STAMPS_GOAL = 6;

type ProfileMenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isConfigured, user, profile, signOut } = useAuth();

  // Supabase henüz yapılandırılmadıysa (misafir/demo modu) sabit değerlerle göster.
  const displayName = isConfigured ? (profile?.fullName ?? 'Scald Üyesi') : 'Misafir Kullanıcı';
  const displayEmail = isConfigured ? (user?.email ?? '') : 'misafir@scaldcoffee.com';
  const coffeeStamps = isConfigured ? (profile?.coffeeStamps ?? 0) : 0;
  const clampedStamps = Math.min(Math.max(coffeeStamps, 0), STAMPS_GOAL);
  const initial = (displayName.trim().charAt(0) || 'S').toUpperCase();

  const menuItems: ProfileMenuItem[] = [
    {
      id: 'order-history',
      label: 'Siparişlerim',
      icon: 'shopping-bag',
      onPress: () => router.push('/order-history'),
    },
    {
      id: 'favorites',
      label: 'Favorilerim',
      icon: 'heart',
      onPress: () => router.push('/favorites'),
    },
    {
      id: 'scald-club',
      label: 'Ödüller',
      icon: 'gift',
      onPress: () => router.push('/scald-club'),
    },
    {
      id: 'notification-settings',
      label: 'Bildirimler',
      icon: 'bell',
      onPress: () => router.push('/notification-settings'),
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: 'settings',
      // Henüz özel bir ayarlar ekranı yok — ileride ilgili ekrana yönlendirme eklenecek.
      onPress: () => console.log('Profile menu item pressed: settings'),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Profil
        </ThemedText>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
          showsVerticalScrollIndicator={false}>
          <ThemedView type="backgroundElement" style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="subtitle" themeColor="primary" style={styles.avatarText}>
                  {initial}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText type="subtitle" numberOfLines={1} style={styles.userName}>
                  {displayName}
                </ThemedText>
                {!!displayEmail && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {displayEmail}
                  </ThemedText>
                )}
              </View>
            </View>

            <View style={[styles.stampsPill, { backgroundColor: theme.backgroundSelected }]}>
              <Feather name="coffee" size={14} color={theme.primary} />
              <ThemedText type="small" themeColor="primary" style={styles.stampsPillText}>
                {clampedStamps}/{STAMPS_GOAL} damga
              </ThemedText>
            </View>
          </ThemedView>

          {isConfigured && user && (
            <ThemedView type="backgroundElement" style={styles.qrCard}>
              <ThemedText type="smallBold">Puan Kazan</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.qrHint}>
                Kasada bu kodu göster, puanların otomatik yüklensin.
              </ThemedText>
              <View style={styles.qrWrapper}>
                <QRCode value={user.id} size={170} />
              </View>
            </ThemedView>
          )}

          <View style={styles.section}>
            {menuItems.map((item) => (
              <Pressable key={item.id} onPress={item.onPress}>
                <ThemedView type="backgroundElement" style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconWrap, { backgroundColor: theme.backgroundSelected }]}>
                      <Feather name={item.icon} size={16} color={theme.primary} />
                    </View>
                    <ThemedText type="default">{item.label}</ThemedText>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                </ThemedView>
              </Pressable>
            ))}

            <Pressable onPress={() => Linking.openURL('https://www.instagram.com/scald.coffee/')}>
              <ThemedView type="backgroundElement" style={styles.menuRow}>
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconWrap, { backgroundColor: theme.backgroundSelected }]}>
                    <Feather name="instagram" size={16} color={theme.primary} />
                  </View>
                  <ThemedText type="default">Instagram&apos;da Takip Et</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  @scald.coffee
                </ThemedText>
              </ThemedView>
            </Pressable>

            {isConfigured && user && (
              <Pressable onPress={() => signOut()}>
                <ThemedView type="backgroundElement" style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuIconWrapDanger}>
                      <Feather name="log-out" size={16} color="#D3453B" />
                    </View>
                    <ThemedText type="default" style={styles.signOutText}>
                      Çıkış Yap
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            )}
          </View>
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
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    lineHeight: 28,
  },
  userInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  userName: {
    fontSize: 22,
    lineHeight: 26,
  },
  stampsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  stampsPillText: {},
  qrCard: {
    borderRadius: Radius.loyalty,
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
    gap: Spacing.two,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexShrink: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(211,69,59,0.12)',
  },
  signOutText: {
    color: '#D3453B',
  },
});
