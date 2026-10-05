// Şubeler ekranı — artık sekme çubuğunda değil, üst seviye bir pushed route
// (bkz. `_layout.tsx`'teki `<Stack.Screen name="locations" />`). Ana sayfadan
// ve diğer yerlerden `router.push('/locations')` ile açılır, bu yüzden
// kendi geri butonu + başlık satırını taşır (bkz. order-history.tsx'teki
// aynı desen).
//
// Veri/harita mantığı başka bir görev tarafından zaten kurulmuş ve
// çalışıyor: `useLocations()` hook'u, native/web harita bileşen split'i
// (`locations-map.tsx` / `locations-map.web.tsx`) ve "yol tarifi al"
// `Linking` akışı — bu dosyada sadece görsel yeniden tasarım yapılıyor,
// bu mantık korunuyor.
//
// Not: `location.openingHours` backend'de serbest metin/jsonb'den
// biçimlendirilen bir GÖRÜNÜM string'i (bkz. `lib/mappers.ts`
// `formatOpeningHours`), güvenilir biçimde parse edilebilecek yapılandırılmış
// bir veri değil. Bu yüzden açık/kapalı rozetini burada HESAPLAMIYORUZ —
// yanlış bir durum göstermek, hiç göstermemekten daha kötü.

import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// react-native-maps native tarafta çalışır; web'de desteklenmez. Web'de haritayı
// hiç import etmeden basit bir placeholder gösteriyoruz, böylece web build'i
// bu native-only modül yüzünden patlamaz.
import LocationsMap from '@/components/locations-map';
import { QrActionSheet } from '@/components/qr-action-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useLocations } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import type { Location } from '@/types/models';

// Son seçilen şube burada saklanıyor. Sepet/sipariş ekranı (bu görevin
// kapsamı dışında, başka bir agent'a ait) isterse bu değeri okuyup
// varsayılan şube olarak kullanabilir — burada sadece seçimi kalıcı
// hale getiriyoruz.
const SELECTED_LOCATION_KEY = 'scald:selected-location-id';

function openDirections(location: Location) {
  const query = encodeURIComponent(`${location.lat},${location.lng}`);
  Linking.openURL(`https://maps.google.com/?q=${query}`);
}

function callLocation(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

export default function LocationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: locations, loading } = useLocations();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_LOCATION_KEY)
      .then((value) => {
        if (value) setSelectedId(value);
      })
      .catch((error) => {
        console.warn('[LocationsScreen] Seçili şube okunamadı:', error);
      });
  }, []);

  const selectLocation = useCallback(async (id: string) => {
    setSelectedId(id);
    try {
      await AsyncStorage.setItem(SELECTED_LOCATION_KEY, id);
    } catch (error) {
      console.warn('[LocationsScreen] Seçili şube kaydedilemedi:', error);
    }
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

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
            Şubeler
          </ThemedText>
        </ThemedView>

        {loading ? (
          <LocationsSkeleton />
        ) : (
          <>
            <LocationsMap locations={locations} />

            <ScrollView
              contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
              showsVerticalScrollIndicator={false}>
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  expanded={expandedId === location.id}
                  selected={selectedId === location.id}
                  onToggleExpand={() => toggleExpanded(location.id)}
                  onSelect={() => selectLocation(location.id)}
                />
              ))}

              <QrActionSheet />
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

type LocationCardProps = {
  location: Location;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
};

function LocationCard({ location, expanded, selected, onToggleExpand, onSelect }: LocationCardProps) {
  const theme = useTheme();

  // "Şubeyi Gör" sadece gösterecek ek bir şey varsa (fotoğraf veya telefon)
  // bir işlev görür — aksi halde boş bir akordiyon açmak yerine aksiyonu
  // hiç göstermiyoruz.
  const hasExpandableDetail = Boolean(location.imageUrl || location.phone);

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, selected && { borderColor: theme.primary, borderWidth: 1.5 }]}>
      <ThemedView style={styles.nameRow} lightColor="transparent" darkColor="transparent">
        <ThemedText type="default" style={styles.locationName}>
          {location.name}
        </ThemedText>
        {selected && (
          <ThemedView style={[styles.selectedBadge, { backgroundColor: theme.backgroundSelected }]}>
            <Feather name="check" size={11} color={theme.primary} />
            <ThemedText type="small" themeColor="primary" style={styles.selectedBadgeText}>
              Seçili
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
        <Feather name="map-pin" size={13} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
          {location.address}
        </ThemedText>
      </ThemedView>

      {location.openingHours ? (
        <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
          <Feather name="clock" size={13} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
            {location.openingHours}
          </ThemedText>
        </ThemedView>
      ) : null}

      {hasExpandableDetail && (
        <Pressable onPress={onToggleExpand} style={styles.seeMoreRow} hitSlop={8}>
          <ThemedText type="small" themeColor="primary">
            {expanded ? 'Daralt' : 'Şubeyi Gör'}
          </ThemedText>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.primary} />
        </Pressable>
      )}

      {expanded && hasExpandableDetail && (
        <ThemedView style={styles.expandedSection} lightColor="transparent" darkColor="transparent">
          {location.imageUrl && (
            <Image
              source={{ uri: location.imageUrl }}
              style={styles.photo}
              contentFit="cover"
              transition={200}
            />
          )}

          {location.phone ? (
            <Pressable onPress={() => callLocation(location.phone!)} style={styles.infoRow} hitSlop={8}>
              <Feather name="phone" size={13} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                {location.phone}
              </ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      )}

      <ThemedView style={styles.actionsRow} lightColor="transparent" darkColor="transparent">
        <Pressable onPress={() => openDirections(location)} style={styles.directionsButton} hitSlop={8}>
          <Feather name="navigation" size={14} color={theme.primary} />
          <ThemedText type="linkPrimary" themeColor="primary">
            Yol Tarifi Al
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onSelect}
          disabled={selected}
          style={[styles.selectButton, { backgroundColor: selected ? theme.backgroundSelected : theme.primary }]}>
          <Feather name={selected ? 'check' : 'map-pin'} size={13} color={selected ? theme.primary : '#ffffff'} />
          <ThemedText type="small" style={selected ? { color: theme.primary } : styles.selectButtonTextActive}>
            {selected ? 'Seçili Şube' : 'Bu Şubeyi Seç'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

// Harita + liste yüklenirken bare spinner yerine basit, bu ekrana özel bir
// skeleton — diğer ekranlardaki skeleton'larla paylaşılan bir bileşen değil
// (her sibling görev kendi ekranı için ayrı bir versiyon yapıyor, bu da
// kasıtlı: ortak/export edilen bir skeleton sistemi bu görevin kapsamı
// dışında).
function LocationsSkeleton() {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <ThemedView style={styles.skeletonContainer}>
      <Animated.View
        style={[styles.skeletonMap, { backgroundColor: theme.backgroundElement, opacity: pulse }]}
      />
      {[0, 1, 2].map((index) => (
        <ThemedView key={index} type="backgroundElement" style={styles.skeletonCard}>
          <Animated.View
            style={[styles.skeletonPhoto, { backgroundColor: theme.backgroundSelected, opacity: pulse }]}
          />
          <ThemedView style={styles.skeletonCardBody} lightColor="transparent" darkColor="transparent">
            <Animated.View
              style={[
                styles.skeletonLine,
                styles.skeletonLineWide,
                { backgroundColor: theme.backgroundSelected, opacity: pulse },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonLine,
                styles.skeletonLineNarrow,
                { backgroundColor: theme.backgroundSelected, opacity: pulse },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonLine,
                styles.skeletonLineMedium,
                { backgroundColor: theme.backgroundSelected, opacity: pulse },
              ]}
            />
          </ThemedView>
        </ThemedView>
      ))}
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
  card: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  locationName: {
    flex: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  selectedBadgeText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    flex: 1,
  },
  seeMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    alignSelf: 'flex-start',
    marginTop: Spacing.half,
  },
  expandedSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.button,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  selectButtonTextActive: {
    color: '#ffffff',
  },
  skeletonContainer: {
    flex: 1,
    gap: Spacing.three,
  },
  skeletonMap: {
    height: Spacing.six * 3.5,
    borderRadius: Spacing.three,
  },
  skeletonCard: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  skeletonPhoto: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.button,
  },
  skeletonCardBody: {
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: Radius.button,
  },
  skeletonLineWide: {
    width: '70%',
  },
  skeletonLineMedium: {
    width: '55%',
  },
  skeletonLineNarrow: {
    width: '40%',
  },
});
