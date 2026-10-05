import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbianceGallery } from '@/components/ambiance-gallery';
import { CoffeeStampCard } from '@/components/coffee-stamp-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { mockLoyaltySummary } from '@/data/mock';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { usePromotions, useProducts } from '@/hooks/use-supabase-data';
import { useAuth } from '@/lib/auth-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PROMO_CARD_WIDTH = SCREEN_WIDTH - Spacing.four * 2;
const PROMO_CARD_GAP = Spacing.three;

export default function HomeScreen() {
  useRegisterPushToken();
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const { data: products } = useProducts();
  const { data: promotions } = usePromotions();
  const { isConfigured, user, profile } = useAuth();

  // Fotoğrafı olan ürünleri öne al, görsel olarak daha çekici bir "Öne Çıkanlar" olsun.
  const featured = [...products]
    .sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)))
    .slice(0, 3);

  const loyaltyPoints = isConfigured ? (profile?.loyaltyPoints ?? 0) : mockLoyaltySummary.points;
  const greetingName = isConfigured ? (profile?.fullName ?? user?.email ?? 'Scald Üyesi') : 'Misafir';

  const [activePromoIndex, setActivePromoIndex] = useState(0);

  function handlePromoScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (PROMO_CARD_WIDTH + PROMO_CARD_GAP)
    );
    setActivePromoIndex(index);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.five }}>
        <ThemedView type="primary" style={styles.header}>
          <Image
            source={require('@/assets/images/brand/ambiance/interior-reading-nook.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
          />
          <View style={[StyleSheet.absoluteFill, styles.headerScrim]} />
          <SafeAreaView edges={['top']}>
            <ThemedView type="primary" style={styles.headerRow}>
              <ThemedView type="primary" style={styles.headerTextGroup}>
                <ThemedText type="small" style={styles.headerGreeting}>
                  Hoş geldin,
                </ThemedText>
                <ThemedText type="subtitle" style={styles.headerName} numberOfLines={1}>
                  {greetingName}
                </ThemedText>
              </ThemedView>

              <Pressable
                onPress={() => router.push('/profile')}
                style={styles.qrButton}
                hitSlop={8}>
                <Ionicons name="qr-code-outline" size={22} color={theme.primary} />
              </Pressable>
            </ThemedView>

            <Pressable onPress={() => router.push('/profile')} style={styles.loyaltyPill}>
              <Ionicons name="star" size={14} color={theme.accent} />
              <ThemedText type="small" style={styles.loyaltyPillText}>
                {loyaltyPoints} puan · {mockLoyaltySummary.tier}
              </ThemedText>
            </Pressable>
          </SafeAreaView>
        </ThemedView>

        <ThemedView style={styles.body}>
          <CoffeeStampCard />

          <ThemedView style={styles.ctaRow}>
            <Pressable
              style={[styles.ctaCard, { backgroundColor: theme.accent }]}
              onPress={() => router.push('/cart')}>
              <Ionicons name="cafe" size={26} color="#1A1206" />
              <ThemedText type="subtitle" style={styles.ctaTitleDark}>
                Hazır Al
              </ThemedText>
              <ThemedView style={styles.ctaFooterRow} lightColor="transparent" darkColor="transparent">
                <ThemedText type="smallBold" style={styles.ctaActionDark}>
                  Sipariş Ver
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#1A1206" />
              </ThemedView>
            </Pressable>

            <Pressable
              style={[styles.ctaCard, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/menu')}>
              <Ionicons name="restaurant" size={26} color="#ffffff" />
              <ThemedText type="subtitle" style={styles.ctaTitleLight}>
                Menü
              </ThemedText>
              <ThemedView style={styles.ctaFooterRow} lightColor="transparent" darkColor="transparent">
                <ThemedText type="smallBold" style={styles.ctaActionLight}>
                  Menüyü Gör
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </ThemedView>
            </Pressable>
          </ThemedView>

          {promotions.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Haberler ve Fırsatlar</ThemedText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={PROMO_CARD_WIDTH + PROMO_CARD_GAP}
                decelerationRate="fast"
                onMomentumScrollEnd={handlePromoScroll}
                contentContainerStyle={styles.promoScrollContent}>
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
                    <ThemedView
                      style={styles.promoTextPanel}
                      lightColor="transparent"
                      darkColor="transparent">
                      <ThemedText type="default" style={styles.promoTitle} numberOfLines={2}>
                        {promotion.title}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.promoBody}
                        numberOfLines={3}>
                        {promotion.body}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                ))}
              </ScrollView>

              {promotions.length > 1 && (
                <ThemedView style={styles.dotsRow} lightColor="transparent" darkColor="transparent">
                  {promotions.map((promotion, index) => (
                    <ThemedView
                      key={promotion.id}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            index === activePromoIndex ? theme.primary : theme.backgroundSelected,
                        },
                      ]}
                    />
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          )}

          {featured.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Öne Çıkanlar</ThemedText>
              {featured.map((product) => (
                <Pressable key={product.id} onPress={() => router.push('/menu')}>
                  <ThemedView type="backgroundElement" style={styles.productRow}>
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
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {product.description}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="smallBold">{product.price}₺</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </ThemedView>
          )}

          <AmbianceGallery />

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Scald Şubelerini Keşfet</ThemedText>
            <Pressable onPress={() => router.push('/locations')}>
              <ThemedView type="backgroundElement" style={styles.discoverCard}>
                <ThemedView style={styles.discoverIcon} lightColor="transparent" darkColor="transparent">
                  <Ionicons name="location" size={22} color={theme.primary} />
                </ThemedView>
                <ThemedView style={styles.discoverTextGroup} lightColor="transparent" darkColor="transparent">
                  <ThemedText type="default">Şubeleri Listele</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Sana en yakın şubeyi bul, yol tarifi al.
                  </ThemedText>
                </ThemedView>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </ThemedView>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ScrollView>
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
    paddingBottom: Spacing.four,
    overflow: 'hidden',
  },
  headerScrim: {
    backgroundColor: 'rgba(20,10,10,0.55)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerTextGroup: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.72)',
  },
  headerName: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  loyaltyPillText: {
    color: '#ffffff',
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.five,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  ctaCard: {
    flex: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  ctaTitleDark: {
    color: '#1A1206',
    fontSize: 22,
    lineHeight: 26,
  },
  ctaTitleLight: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 26,
  },
  ctaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  ctaActionDark: {
    color: '#1A1206',
  },
  ctaActionLight: {
    color: '#ffffff',
  },
  section: {
    gap: Spacing.three,
  },
  promoScrollContent: {
    gap: PROMO_CARD_GAP,
    paddingRight: Spacing.four,
  },
  promoCard: {
    width: PROMO_CARD_WIDTH,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  promoImage: {
    width: '42%',
    height: 140,
  },
  promoTextPanel: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'center',
    gap: Spacing.half,
  },
  promoTitle: {
    fontFamily: undefined,
  },
  promoBody: {},
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  productPhoto: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  productInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.four,
  },
  discoverIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
});
