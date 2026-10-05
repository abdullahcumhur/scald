// Kahve damgası kartı — ana sayfadaki KOMPAKT sadakat teaser'ı. Tam
// detay/geçmiş/ödüller ekranı (tabs)/scald-club.tsx'te ayrı bir ekran olarak
// yaşıyor; bu kart sadece "kaç damga var, kaç tane kaldı" özetini gösterir.
// Mevcut loyaltyPoints (puan) sisteminden tamamen ayrı: harcama tutarından
// bağımsız, sadece "kaç kahve içildi" sayan ikinci bir sadakat mekaniği (bkz.
// backend/supabase/migrations/0008_coffee_stamps.sql, mobile/src/lib/auth-context.tsx).
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

const STAMPS_GOAL = 6;

export function CoffeeStampCard() {
  const theme = useTheme();
  const { isConfigured, profile } = useAuth();

  // Supabase kurulmamışsa (misafir/demo modu) ya da profil henüz
  // yüklenmemişse 0/6'ya düşüyoruz — ayrı bir mock veri setine ihtiyaç yok.
  const stamps = isConfigured ? profile?.coffeeStamps ?? 0 : 0;
  const freeCoffees = isConfigured ? profile?.freeCoffees ?? 0 : 0;

  const clampedStamps = Math.min(Math.max(stamps, 0), STAMPS_GOAL);
  const remaining = STAMPS_GOAL - clampedStamps;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
          <Feather name="coffee" size={18} color={theme.primary} />
        </View>
        <View style={styles.headerTextGroup}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            SCALD CLUB
          </ThemedText>
          <ThemedText type="smallBold">
            {clampedStamps} / {STAMPS_GOAL}
          </ThemedText>
        </View>
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: STAMPS_GOAL }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < clampedStamps
                ? { backgroundColor: theme.primary }
                : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.backgroundSelected },
            ]}
          />
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {freeCoffees > 0
          ? `${freeCoffees} kahve bizden — kullanılabilir`
          : `${remaining} kahve daha`}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.loyalty,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    gap: Spacing.half,
  },
  label: {
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
  },
});
