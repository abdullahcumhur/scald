import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockLoyaltySummary } from '@/data/mock';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { usePromotions, useProducts } from '@/hooks/use-supabase-data';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  useRegisterPushToken();

  const { data: products } = useProducts();
  const { data: promotions } = usePromotions();
  const { isConfigured, user, profile } = useAuth();
  const featured = products.slice(0, 3);

  const loyaltyPoints = isConfigured ? (profile?.loyaltyPoints ?? 0) : mockLoyaltySummary.points;
  const greetingName = isConfigured ? (profile?.fullName ?? user?.email ?? 'Hoş geldin') : 'Hoş geldin';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {greetingName}
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Scald Coffee
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.loyaltyCard}>
          <ThemedText type="small" themeColor="textSecondary">
            Sadakat Puanın
          </ThemedText>
          <ThemedText type="subtitle" themeColor="primary">
            {loyaltyPoints} puan
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {mockLoyaltySummary.tier} · bir sonraki seviye {mockLoyaltySummary.nextTierAt} puan
          </ThemedText>
        </ThemedView>

        {promotions.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Kampanyalar</ThemedText>
            {promotions.map((promotion) => (
              <ThemedView key={promotion.id} type="backgroundElement" style={styles.promotionCard}>
                <ThemedText type="default">{promotion.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {promotion.body}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Öne Çıkanlar</ThemedText>
          {featured.map((product) => (
            <ThemedView key={product.id} type="backgroundElement" style={styles.productRow}>
              <ThemedView style={styles.productInfo}>
                <ThemedText type="default">{product.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {product.description}
                </ThemedText>
              </ThemedView>
              <ThemedText type="smallBold">{product.price}₺</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
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
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  loyaltyCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.three,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  productInfo: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  promotionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
