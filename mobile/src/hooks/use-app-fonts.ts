import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

// Marka fontlarını (başlıklar için Cormorant Garamond, gövde metni için
// Manrope — bkz. scaldcoffee.com) uygulama açılışında yükler. `Fonts`
// (src/constants/theme.ts) içindeki `fontFamily` değerleriyle isim eşleşmesi
// burada tanımlanan anahtarlara bağlıdır.
export function useAppFonts() {
  return useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
}
