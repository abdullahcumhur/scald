// Favorilerim — kullanıcının favoriye eklediği ürünleri listeleyen ekran.
// `app-tabs.tsx`'te tanımlı değil, bu yüzden sekme çubuğunda görünmez;
// `profile.tsx`'ten `router.push('/favorites')` ile açılır.

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useProducts } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import type { Product } from '@/types/models';

export default function FavoritesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: products } = useProducts();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteIds.has(product.id)),
    [products, favoriteIds]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header} lightColor="transparent" darkColor="transparent">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Favorilerim
          </ThemedText>
        </ThemedView>

        {favoriteProducts.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.backgroundElement }]}>
              <Feather name="heart" size={28} color={theme.textSecondary} />
            </View>
            <ThemedText type="default" style={styles.emptyText}>
              Henüz bir favorin yok.
            </ThemedText>
            <Pressable
              onPress={() => router.push('/menu')}
              style={({ pressed }) => [
                styles.exploreButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
              ]}>
              <ThemedText type="smallBold" style={styles.exploreButtonText}>
                Menüyü Keşfet
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {favoriteProducts.map((product) => (
                <FavoriteCard
                  key={product.id}
                  product={product}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  onAdd={() => addItem(product)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function FavoriteCard({
  product,
  onToggleFavorite,
  onAdd,
}: {
  product: Product;
  onToggleFavorite: () => void;
  onAdd: () => void;
}) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.photoWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.photo} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: theme.backgroundSelected }]} />
        )}
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={[styles.heartButton, { backgroundColor: theme.backgroundElement }]}>
          <Feather name="heart" size={15} color={theme.primary} style={styles.heartIconFilled} />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <ThemedText type="default" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="smallBold">{product.price}₺</ThemedText>

        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Feather name="shopping-bag" size={14} color="#ffffff" />
          <ThemedText type="small" style={styles.addButtonText}>
            Tekrar Sipariş Ver
          </ThemedText>
        </Pressable>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  list: {
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  card: {
    width: '48%',
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  photoPlaceholder: {},
  heartButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIconFilled: {},
  cardBody: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
  },
  addButtonText: {
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  exploreButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
  },
  exploreButtonText: {
    color: '#ffffff',
  },
});
