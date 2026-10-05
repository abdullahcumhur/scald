import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockLoyaltySummary, mockProducts } from '@/data/mock';

export default function HomeScreen() {
  const featured = mockProducts.slice(0, 3);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Hoş geldin
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
            {mockLoyaltySummary.points} puan
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {mockLoyaltySummary.tier} · bir sonraki seviye {mockLoyaltySummary.nextTierAt} puan
          </ThemedText>
        </ThemedView>

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
});
