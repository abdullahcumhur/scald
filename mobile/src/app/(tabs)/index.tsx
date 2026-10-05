import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbianceGallery } from '@/components/ambiance-gallery';
import { CoffeeStampCard } from '@/components/coffee-stamp-card';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { usePromotions, useProducts } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import type { Product } from '@/types/models';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FEATURED_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 280);
const FEATURED_CARD_GAP = Spacing.three;
const PROMO_CARD_WIDTH = SCREEN_WIDTH - Spacing.four * 2;

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: Href;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'order', label: 'Sipariş Ver', icon: 'shopping-bag', route: '/cart' },
  { key: 'menu', label: 'Menü', icon: 'coffee', route: '/menu' },
  { key: 'rewards', label: 'Ödüller', icon: 'award', route: '/scald-club' },
  { key: 'locations', label: 'Şubeler', icon: 'map-pin', route: '/locations' },
];

export default function HomeScreen() {
  useRegisterPushToken();
  const router = useRouter();
  const theme = useTheme();

  const { data: products, loading: productsLoading } = useProducts();
  const { data: promotions, loading: promotionsLoading } = usePromotions();
  const { isConfigured, user, profile } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Fotoğrafı olan ürünleri öne al — "Bugün Scald'da" görsel ağırlıklı bir
  // vitrin olsun, fotoğrafsız ürünler bu carousel'e girmesin.
  const featured = useMemo(
    () => products.filter((product) => Boolean(product.imageUrl)).slice(0, 6),
    [products]
  );

  const firstName = isConfigured
    ? profile?.fullName?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'Scald Üyesi'
    : 'Misafir';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.five }}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerTopRow}>
            <Image
              source={require('@/assets/images/brand/scald-logo-trimmed.png')}
              style={styles.logo}
              contentFit="contain"
            />

            <View style={styles.headerIcons}>
              <Pressable
                onPress={() => router.push('/notification-settings')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={8}>
                <Feather name="bell" size={19} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={8}>
                <Feather name="maximize" size={19} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.greetingGroup}>
            <ThemedText type="subtitle" numberOfLines={1}>
              Merhaba {firstName} 👋
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Bugün kahveni nasıl alırsın?
            </ThemedText>
          </View>
        </SafeAreaView>

        <ThemedView style={styles.body}>
          <CoffeeStampCard />

          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => router.push(action.route)}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <View style={[styles.quickActionIconWrap, { backgroundColor: theme.backgroundSelected }]}>
                  <Feather name={action.icon} size={20} color={theme.primary} />
                </View>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {action.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Bugün Scald&apos;da</ThemedText>

            {productsLoading ? (
              <LoadingState label="Ürünler yükleniyor..." />
            ) : featured.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScrollContent}>
                {featured.map((product) => (
                  <FeaturedProductCard
                    key={product.id}
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                    onQuickAdd={() => addItem(product)}
                    onPress={() => router.push(`/product/${product.id}`)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>

          {promotionsLoading ? (
            <LoadingState label="Kampanyalar yükleniyor..." />
          ) : (
            promotions.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="smallBold">Kampanyalar</ThemedText>

                {promotions.map((promotion) => (
                  <ThemedView key={promotion.id} type="backgroundElement" style={styles.promoCard}>
                    {promotion.imageUrl && (
                      <Image
                        source={{ uri: promotion.imageUrl }}
                        style={styles.promoImage}
                        contentFit="cover"
                        transition={200}
                      />
                    )}
                    <View style={styles.promoTextPanel}>
                      <ThemedText type="default" numberOfLines={2}>
                        {promotion.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                        {promotion.body}
                      </ThemedText>
                      <Pressable
                        style={({ pressed }) => [
                          styles.promoButton,
                          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                        ]}
                        onPress={() => router.push('/menu')}>
                        <ThemedText type="smallBold" style={styles.promoButtonText}>
                          Keşfet
                        </ThemedText>
                        <Feather name="chevron-right" size={14} color="#ffffff" />
                      </Pressable>
                    </View>
                  </ThemedView>
                ))}
              </View>
            )
          )}

          <AmbianceGallery />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

type FeaturedProductCardProps = {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onQuickAdd: () => void;
  onPress: () => void;
};

function FeaturedProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onQuickAdd,
  onPress,
}: FeaturedProductCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featuredCard,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={styles.featuredPhotoWrap}>
        {product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.featuredPhoto}
            contentFit="cover"
            transition={200}
          />
        )}
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={({ pressed }) => [
            styles.favoriteButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <Feather
            name="heart"
            size={16}
            color={isFavorite ? theme.primary : '#ffffff'}
            style={isFavorite ? undefined : styles.favoriteIconOutline}
          />
        </Pressable>
      </View>

      <View style={styles.featuredInfo}>
        <ThemedText type="default" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.featuredDescription}>
          {product.description}
        </ThemedText>

        <View style={styles.featuredFooterRow}>
          <ThemedText type="smallBold">{product.price}₺</ThemedText>
          <Pressable
            onPress={onQuickAdd}
            hitSlop={8}
            style={({ pressed }) => [
              styles.quickAddButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Feather name="plus" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 88,
    height: 28,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingGroup: {
    gap: Spacing.half,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.five,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  quickActionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    minHeight: 96,
    justifyContent: 'center',
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  featuredScrollContent: {
    gap: FEATURED_CARD_GAP,
    paddingRight: Spacing.four,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  featuredPhotoWrap: {
    width: '100%',
    height: 180,
  },
  featuredPhoto: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(36,26,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIconOutline: {
    opacity: 0.92,
  },
  featuredInfo: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  featuredDescription: {
    minHeight: 36,
  },
  featuredFooterRow: {
    marginTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCard: {
    width: PROMO_CARD_WIDTH,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  promoImage: {
    width: '100%',
    height: 160,
  },
  promoTextPanel: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  promoButton: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: Spacing.half,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  promoButtonText: {
    color: '#ffffff',
  },
});
