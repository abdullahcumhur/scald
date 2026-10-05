import { Image } from 'expo-image';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocations } from '@/hooks/use-supabase-data';
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Şubeler
        </ThemedText>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <LocationsMap locations={locations} />

            <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
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
                  <ThemedView style={styles.cardContent}>
                    <ThemedText type="default">{location.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {location.address}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {location.openingHours}
                    </ThemedText>

                    <Pressable onPress={() => openDirections(location)}>
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
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
});
