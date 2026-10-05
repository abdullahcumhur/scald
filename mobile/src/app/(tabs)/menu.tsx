// Menü ekranı — kategori + metin aramasını birlikte uygulayan, 2 sütunlu
// fotoğraf-öncelikli ürün ızgarası. Kategori seçimi ve arama birbirini
// tamamlar: önce aktif kategoriye göre, sonra arama metnine göre filtrelenir.

import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import type { Product } from '@/types/models';

const SKELETON_CARD_COUNT = 6;

export default function MenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: products, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Supabase'den veri geldikten sonra kategori listesi değişebileceği için
  // (mock -> gerçek veri), seçim yoksa ilk kategoriyi türetilmiş state olarak kullan.
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id;

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = product.categoryId === activeCategoryId;
      const matchesQuery = normalizedQuery.length === 0 || product.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategoryId, searchQuery]);

  const isLoading = categoriesLoading || productsLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBlock}>
          <ThemedText type="title" style={styles.headerTitle}>
            Bugün ne içmek istersin?
          </ThemedText>

          <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
            <Feather name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Kahve, tatlı veya ürün ara"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {isLoading ? (
          <MenuSkeleton />
        ) : (
          <FlatList
            data={visibleProducts}
            keyExtractor={(product) => product.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.gridContent, { paddingBottom: BottomTabInset + Spacing.four }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              categories.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}>
                  {categories.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setSelectedCategoryId(category.id)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isActive ? theme.primary : theme.backgroundElement,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={isActive ? styles.categoryChipTextActive : undefined}
                          themeColor={isActive ? undefined : 'textSecondary'}>
                          {category.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="coffee" size={28} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStateText}>
                  {searchQuery.trim().length > 0
                    ? `"${searchQuery}" için bir sonuç bulamadık.`
                    : 'Bu kategoride henüz ürün yok.'}
                </ThemedText>
              </View>
            }
            renderItem={({ item: product }) => (
              <ProductCard
                product={product}
                isFavorite={isFavorite(product.id)}
                onToggleFavorite={() => toggleFavorite(product.id)}
                onQuickAdd={() => addItem(product)}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onQuickAdd,
  onPress,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onQuickAdd: () => void;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardImageWrap}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback, { backgroundColor: theme.backgroundSelected }]}>
            <Feather name="coffee" size={30} color={theme.primary} />
          </View>
        )}

        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.favoriteButton}>
          <Feather
            name="heart"
            size={16}
            color={isFavorite ? theme.primary : theme.textSecondary}
            style={isFavorite ? { opacity: 1 } : { opacity: 0.8 }}
          />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <ThemedText type="small" numberOfLines={1}>
          {product.name}
        </ThemedText>

        <View style={styles.cardFooter}>
          <ThemedText type="smallBold">{product.price}₺</ThemedText>
          <Pressable
            onPress={onQuickAdd}
            hitSlop={8}
            style={[styles.quickAddButton, { backgroundColor: theme.primary }]}>
            <Feather name="plus" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function MenuSkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.gridContent}>
      <View style={styles.categoryRow}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[styles.categoryChipSkeleton, { backgroundColor: theme.backgroundElement }]}
          />
        ))}
      </View>

      <View style={styles.gridRow}>
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <View key={index} style={[styles.card, styles.skeletonCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.cardImage, { backgroundColor: theme.backgroundSelected }]} />
            <View style={styles.cardBody}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.backgroundSelected, width: '70%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.backgroundSelected, width: '40%' }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    flexWrap: 'wrap',
  },
  categoryChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  categoryChipSkeleton: {
    borderRadius: Radius.pill,
    width: 80,
    height: 34,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  gridContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  skeletonCard: {
    minWidth: '47%',
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  cardBody: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  quickAddButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: Spacing.one,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  emptyStateText: {
    textAlign: 'center',
  },
});
