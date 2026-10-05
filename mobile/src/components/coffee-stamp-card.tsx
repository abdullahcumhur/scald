// Kahve damgası kartı — ev sahibinin referans gösterdiği rakip uygulama
// ekran görüntüsünden (Kahve Dünyası, dairesel "5/8" halka + ortada kahve
// fincanı ikonu) ilham alınmıştır, birebir kopyası değildir. Mevcut
// loyaltyPoints (puan) sisteminden tamamen ayrı: harcama tutarından bağımsız,
// sadece "kaç kahve içildi" sayan ikinci bir sadakat mekaniği (bkz.
// backend/supabase/migrations/0008_coffee_stamps.sql, mobile/src/lib/auth-context.tsx).
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

const STAMPS_GOAL = 6;
const RING_SIZE = 84;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function CoffeeStampCard() {
  const theme = useTheme();
  const { isConfigured, profile } = useAuth();

  // Supabase kurulmamışsa (misafir/demo modu) ya da profil henüz
  // yüklenmemişse, ana sayfadaki loyaltyPoints/greetingName fallback'iyle
  // aynı mantıkla 0/6'ya düşüyoruz — ayrı bir mock veri setine ihtiyaç yok.
  const stamps = isConfigured ? profile?.coffeeStamps ?? 0 : 0;
  const freeCoffees = isConfigured ? profile?.freeCoffees ?? 0 : 0;

  const clampedStamps = Math.min(Math.max(stamps, 0), STAMPS_GOAL);
  const progress = clampedStamps / STAMPS_GOAL;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.backgroundSelected}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.primary}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter} pointerEvents="none">
          <Ionicons name="cafe" size={20} color={theme.primary} />
          <ThemedText type="smallBold" style={styles.ringLabel}>
            {clampedStamps}/{STAMPS_GOAL}
          </ThemedText>
        </View>
      </View>

      <View style={styles.textGroup}>
        <ThemedText type="smallBold">Kahve Damgası</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Her 6 kahvede 1 kahve bizden.
        </ThemedText>

        {freeCoffees > 0 && (
          <View style={[styles.freeBanner, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="primary" numberOfLines={1}>
              🎁 {freeCoffees} ücretsiz kahve hakkın var!
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  ringLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  textGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  freeBanner: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    maxWidth: '100%',
  },
  freeBannerText: {
    color: '#1A1206',
  },
});
