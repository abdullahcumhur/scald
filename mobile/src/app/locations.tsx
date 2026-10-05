import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocations } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import type { Location } from '@/types/models';

// react-native-maps native tarafta çalışır; web'de desteklenmez. Web'de haritayı
// hiç import etmeden basit bir placeholder gösteriyoruz, böylece web build'i
// bu native-only modül yüzünden patlamaz.
import LocationsMap from '@/components/locations-map';

function openDirections(location: Location) {
  const query = encodeURIComponent(`${location.lat},${location.lng}`);
  Linking.openURL(`https://maps.google.com/?q=${query}`);
}

export default function LocationsScreen() {
  const { data: locations, loading } = useLocations();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="primary" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <ThemedView type="primary" style={styles.headerRow}>
            <Ionicons name="location" size={20} color="#ffffff" />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Şubeler
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>

      <ThemedView style={styles.body}>
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <LocationsMap locations={locations} />

            <ScrollView
              contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
              showsVerticalScrollIndicator={false}>
              {locations.map((location) => (
                <ThemedView key={location.id} type="backgroundElement" style={styles.card}>
                  {location.imageUrl && (
                    <Image
                      source={{ uri: location.imageUrl }}
                      style={styles.photo}
                      contentFit="cover"
                      transition={200}
                    />
                  )}
                  <ThemedView style={styles.cardContent} lightColor="transparent" darkColor="transparent">
                    <ThemedText type="default">{location.name}</ThemedText>

                    <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                        {location.address}
                      </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                        {location.openingHours}
                      </ThemedText>
                    </ThemedView>

                    <Pressable onPress={() => openDirections(location)} style={styles.directionsRow}>
                      <Ionicons name="navigate" size={15} color={theme.primary} />
                      <ThemedText type="linkPrimary" themeColor="primary">
                        Yol tarifi al
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              ))}
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
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  infoText: {
    flex: 1,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
});
