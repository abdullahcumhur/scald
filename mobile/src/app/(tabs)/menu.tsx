import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
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
      <ThemedView type="primary" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <ThemedView type="primary" style={styles.headerRow}>
            <Ionicons name="restaurant" size={20} color="#ffffff" />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Menü
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>

      <ThemedView style={styles.body}>
        {isLoading ? (
          <LoadingState />
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
                      type={isActive ? 'primary' : 'backgroundElement'}
                      style={styles.categoryChip}>
                      <ThemedText
                        type="smallBold"
                        style={isActive ? styles.categoryChipTextActive : undefined}
                        themeColor={isActive ? undefined : 'textSecondary'}>
                        {category.name}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              contentContainerStyle={[styles.productList, { paddingBottom: BottomTabInset }]}
              showsVerticalScrollIndicator={false}>
              {visibleProducts.map((product) => {
                const cartQuantity =
                  cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;
                return (
                  <ThemedView key={product.id} type="backgroundElement" style={styles.productCard}>
                    {product.imageUrl && (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productPhoto}
                        contentFit="cover"
                        transition={200}
                      />
                    )}
                    <ThemedView style={styles.productInfo} lightColor="transparent" darkColor="transparent">
                      <ThemedText type="default">{product.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {product.description}
                      </ThemedText>
                      {cartQuantity > 0 && (
                        <ThemedView type="backgroundSelected" style={styles.quantityBadge}>
                          <Ionicons name="cart" size={12} color={theme.primary} />
                          <ThemedText type="small" themeColor="primary" style={styles.quantityBadgeText}>
                            Sepette {cartQuantity}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                    <ThemedView style={styles.productActions} lightColor="transparent" darkColor="transparent">
                      <ThemedText type="smallBold">{product.price}₺</ThemedText>
                      <Pressable
                        onPress={() => addItem(product)}
                        style={({ pressed }) => [
                          styles.addButton,
                          { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                        ]}>
                        <Ionicons name="bag-add-outline" size={15} color="#ffffff" />
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
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    paddingBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerTitle: {
    color: '#ffffff',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
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
  categoryChipTextActive: {
    color: '#ffffff',
  },
  productList: {
    gap: Spacing.three,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  productPhoto: {
    width: 64,
    height: 64,
    borderRadius: Spacing.two,
  },
  productInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  productActions: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    alignSelf: 'flex-start',
    marginTop: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.five,
  },
  quantityBadgeText: {},
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  addButtonText: {
    color: '#ffffff',
  },
});
