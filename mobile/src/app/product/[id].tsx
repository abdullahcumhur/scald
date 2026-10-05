// Ürün Detay ekranı — büyük fotoğraf, isim/açıklama/fiyat, (varsa) seçenek
// grupları ve sepete ekleme için sticky alt CTA. `product.options` sadece
// gerçekten doluysa (çoğu üründe yok) seçenek arayüzü gösterilir, hiçbir
// ürün için seçenek icat edilmez.

import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useProducts } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { data: products, loading } = useProducts();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const product = products.find((item) => item.id === id);
  const hasOptions = Boolean(product?.options && product.options.length > 0);

  // Seçenek grupları varsa her birinin ilk seçeneğini varsayılan olarak
  // seçili tut, böylece kullanıcı hiçbir şeye dokunmasa da geçerli bir seçim
  // her zaman mevcut olur. Kullanıcının yaptığı seçimler ayrı bir state'te
  // tutulur ve varsayılanların üzerine uygulanır — bu sayede effect içinde
  // setState çağırmaya gerek kalmaz.
  const defaultSelectedOptions = useMemo(() => {
    if (!product?.options || product.options.length === 0) return {};
    const defaults: Record<string, string> = {};
    for (const option of product.options) {
      defaults[option.name] = option.choices[0];
    }
    return defaults;
  }, [product]);
  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<string, string>>({});
  const selectedOptions = { ...defaultSelectedOptions, ...userSelectedOptions };
  const [justAdded, setJustAdded] = useState(false);

  if (!product) {
    if (loading) {
      return (
        <ThemedView style={styles.container}>
          <SafeAreaView edges={['top']} style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </SafeAreaView>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.centered}>
          <Feather name="coffee" size={28} color={theme.textSecondary} />
          <ThemedText type="default" style={styles.notFoundText}>
            Ürün bulunamadı
          </ThemedText>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backToMenuButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Geri dön</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const favorite = isFavorite(product.id);
  const canAddToCart = !hasOptions || Object.keys(selectedOptions).length === product.options!.length;

  function handleAddToCart() {
    addItem(product!, hasOptions ? selectedOptions : undefined);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrap}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.image, styles.imageFallback, { backgroundColor: theme.backgroundSelected }]}>
              <Feather name="coffee" size={48} color={theme.primary} />
            </View>
          )}

          <SafeAreaView edges={['top']} style={styles.headerOverlayRow}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
              <Feather name="chevron-left" size={22} color={theme.text} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>
              {product.name}
            </ThemedText>
            <Pressable
              onPress={() => toggleFavorite(product.id)}
              hitSlop={8}
              style={[styles.favoriteButton, { backgroundColor: theme.backgroundElement }]}>
              <Feather name="heart" size={18} color={favorite ? theme.primary : theme.textSecondary} />
            </Pressable>
          </View>

          <ThemedText type="subtitle" themeColor="primary" style={styles.price}>
            {product.price}₺
          </ThemedText>

          <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
            {product.description}
          </ThemedText>

          {hasOptions &&
            product.options!.map((option) => (
              <View key={option.name} style={styles.optionGroup}>
                <ThemedText type="smallBold">{option.name}</ThemedText>
                <View style={styles.optionChoices}>
                  {option.choices.map((choice) => {
                    const isSelected = selectedOptions[option.name] === choice;
                    return (
                      <Pressable
                        key={choice}
                        onPress={() =>
                          setUserSelectedOptions((current) => ({ ...current, [option.name]: choice }))
                        }
                        style={[
                          styles.optionChip,
                          { backgroundColor: isSelected ? theme.primary : theme.backgroundElement },
                        ]}>
                        <ThemedText
                          type="small"
                          style={isSelected ? styles.optionChipTextActive : undefined}
                          themeColor={isSelected ? undefined : 'textSecondary'}>
                          {choice}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.ctaBar, { backgroundColor: theme.background }]}>
        {justAdded && (
          <View style={styles.confirmationRow}>
            <Feather name="check-circle" size={14} color={theme.primary} />
            <ThemedText type="small" themeColor="primary">
              Sepete eklendi
            </ThemedText>
          </View>
        )}
        <Pressable
          onPress={handleAddToCart}
          disabled={!canAddToCart}
          style={[styles.ctaButton, { backgroundColor: theme.primary, opacity: canAddToCart ? 1 : 0.5 }]}>
          <ThemedText type="smallBold" style={styles.ctaButtonText}>
            SEPETE EKLE · {product.price}₺
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  notFoundText: {
    marginTop: Spacing.one,
  },
  backToMenuButton: {
    marginTop: Spacing.two,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlayRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    marginTop: Spacing.one,
    lineHeight: 22,
  },
  optionGroup: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  optionChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionChipTextActive: {
    color: '#ffffff',
  },
  ctaBar: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  ctaButtonText: {
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
