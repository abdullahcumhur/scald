// Native (iOS/Android) implementasyonu. Metro, `locations-map.web.tsx` dosyasını
// web platformunda bunun yerine otomatik olarak seçer, böylece react-native-maps
// (native-only) hiçbir zaman web bundle'ına dahil edilmez.
import { StyleSheet } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Location } from '@/types/models';

type LocationsMapProps = {
  locations: Location[];
};

export default function LocationsMap({ locations }: LocationsMapProps) {
  const first = locations[0];

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
});
