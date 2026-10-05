import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { mockLocations } from '@/data/mock';
import type { Location } from '@/types/models';

function openDirections(location: Location) {
  const query = encodeURIComponent(`${location.lat},${location.lng}`);
  Linking.openURL(`https://maps.google.com/?q=${query}`);
}

export default function LocationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Şubeler
        </ThemedText>

        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
          {mockLocations.map((location) => (
            <ThemedView key={location.id} type="backgroundElement" style={styles.card}>
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
          ))}
        </ScrollView>
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
    padding: Spacing.four,
    gap: Spacing.one,
  },
});
