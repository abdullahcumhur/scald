// Web implementasyonu. react-native-maps native-only olduğu için web'de harita
// hiç render edilmiyor — ekran doğrudan şube listesini gösteriyor.
import type { Location } from '@/types/models';

type LocationsMapProps = {
  locations: Location[];
};

export default function LocationsMap(_props: LocationsMapProps) {
  return null;
}
