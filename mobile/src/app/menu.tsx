import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart-context';

export default function MenuScreen() {
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: products, loading: productsLoading } = useProducts();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const { items: cartItems, addItem } = useCart();
  const theme = useTheme();

  // Supabase'den veri geldikten sonra kategori listesi değişebileceği için
  // (mock -> gerçek veri), seçim yoksa ilk kategoriyi türetilmiş state olarak kullan.
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id;

  const visibleProducts = useMemo(
    () => products.filter((product) => product.categoryId === activeCategoryId),
    [products, activeCategoryId]
  );

  const isLoading = categoriesLoading || productsLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Menü
        </ThemedText>

        {isLoading ? (
          <ThemedText type="small" themeColor="textSecondary">
            Yükleniyor...
          </ThemedText>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}>
              {categories.map((category) => {
                const isActive = category.id === activeCategoryId;
                return (
                  <Pressable key={category.id} onPress={() => setSelectedCategoryId(category.id)}>
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
              {visibleProducts.map((product) => {
                const cartQuantity =
                  cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;
                return (
                  <ThemedView key={product.id} type="backgroundElement" style={styles.productCard}>
                    <ThemedView style={styles.productInfo}>
                      <ThemedText type="default">{product.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {product.description}
                      </ThemedText>
                      {cartQuantity > 0 && (
                        <ThemedText type="small" themeColor="primary">
                          Sepette: {cartQuantity}
                        </ThemedText>
                      )}
                    </ThemedView>
                    <ThemedView style={styles.productActions}>
                      <ThemedText type="smallBold">{product.price}₺</ThemedText>
                      <Pressable
                        onPress={() => addItem(product)}
                        style={({ pressed }) => [
                          styles.addButton,
                          { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                        ]}>
                        <ThemedText type="smallBold" style={styles.addButtonText}>
                          Ekle
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  </ThemedView>
                );
              })}
              {visibleProducts.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Bu kategoride henüz ürün yok.
                </ThemedText>
              )}
            </ScrollView>
          </>
        )}
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
  productActions: {
    alignItems: 'flex-end',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  addButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  addButtonText: {
    color: '#ffffff',
  },
});
