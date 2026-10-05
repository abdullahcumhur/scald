// Native (iOS/Android) implementasyonu. Metro, `locations-map.web.tsx` dosyasını
// web platformunda bunun yerine otomatik olarak seçer, böylece react-native-maps
// (native-only) hiçbir zaman web bundle'ına dahil edilmez.
import { StyleSheet } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Location } from '@/types/models';

type LocationsMapProps = {
  locations: Location[];
};

// android.config.googleMaps.apiKey derleme zamanında app.config.js tarafından
// bu değişkenden okunuyor (bkz. mobile/app.config.js, mobile/.env.example).
// Key tanımsızsa veya hâlâ placeholder ise Google'ın gri/kırık harita
// karolarını göstermek yerine aşağıdaki bilgilendirme kartını render ediyoruz.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function hasGoogleMapsApiKey() {
  return Boolean(GOOGLE_MAPS_API_KEY) && !GOOGLE_MAPS_API_KEY!.startsWith('TODO_');
}

export default function LocationsMap({ locations }: LocationsMapProps) {
  const first = locations[0];

  if (!hasGoogleMapsApiKey()) {
    return (
      <ThemedView type="backgroundElement" style={styles.placeholder}>
        <ThemedText type="smallBold">Harita yakında</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderText}>
          Google Haritalar için yapılandırma eksik. {locations.length} şube listede aşağıda görüntüleniyor.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: first?.lat ?? 41.0082,
        longitude: first?.lng ?? 28.9784,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }}>
      {locations.map((location) => (
        <Marker key={location.id} coordinate={{ latitude: location.lat, longitude: location.lng }}>
          <Callout>
            <ThemedText type="smallBold">{location.name}</ThemedText>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: Spacing.six * 3.5,
    borderRadius: Spacing.three,
  },
  placeholder: {
    height: Spacing.six * 3.5,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
