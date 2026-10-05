// Web implementasyonu. react-native-maps native-only olduğu için web'de harita
// yerine basit bir placeholder/liste gösteriyoruz.
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Location } from '@/types/models';

type LocationsMapProps = {
  locations: Location[];
};

export default function LocationsMap({ locations }: LocationsMapProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.placeholder}>
      <ThemedText type="smallBold">Harita yalnızca mobil uygulamada kullanılabilir</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {locations.length} şube listede aşağıda görüntüleniyor.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: Spacing.six * 3.5,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
});
