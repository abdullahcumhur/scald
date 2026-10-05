import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { mockCategories, mockProducts } from '@/data/mock';

export default function MenuScreen() {
  const [activeCategoryId, setActiveCategoryId] = useState(mockCategories[0]?.id);

  const visibleProducts = useMemo(
    () => mockProducts.filter((product) => product.categoryId === activeCategoryId),
    [activeCategoryId]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Menü
        </ThemedText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}>
          {mockCategories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <Pressable key={category.id} onPress={() => setActiveCategoryId(category.id)}>
                <ThemedView
                  type={isActive ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.categoryChip}>
                  <ThemedText type="smallBold" themeColor={isActive ? 'text' : 'textSecondary'}>
                    {category.name}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={[styles.productList, { paddingBottom: BottomTabInset }]}>
          {visibleProducts.map((product) => (
            <ThemedView key={product.id} type="backgroundElement" style={styles.productCard}>
              <ThemedView style={styles.productInfo}>
                <ThemedText type="default">{product.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {product.description}
                </ThemedText>
              </ThemedView>
              <ThemedText type="smallBold">{product.price}₺</ThemedText>
            </ThemedView>
          ))}
          {visibleProducts.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Bu kategoride henüz ürün yok.
            </ThemedText>
          )}
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
  categoryRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  categoryChip: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  productList: {
    gap: Spacing.three,
  },
  productCard: {
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
