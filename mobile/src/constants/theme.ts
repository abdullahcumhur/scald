/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Marka rengi scaldcoffee.com'daki gerçek logo renginden (#140A61). 2026
// yeniden tasarımında mor artık baskın renk DEĞİL — sadece CTA/aktif
// nav/loyalty/rozet gibi vurgu noktalarında kullanılıyor (renk dağılımı
// yaklaşık %65 sıcak ivory, %20 fotoğraf, %10 espresso metin, %5 mor).
// Zemin artık düz beyaz değil, sıcak bir ivory/krem; kart yüzeyleri saf beyaza
// yakın ama arka plandan belirgin şekilde ayrışıyor.
export const Colors = {
  light: {
    text: '#241A12', // espresso / near-black
    background: '#F8F6F2', // warm ivory
    backgroundElement: '#FFFFFF', // kart yüzeyi
    backgroundSelected: '#EDE9F7', // çok hafif mor tint — seçili/aktif durum
    textSecondary: '#8A8178', // muted warm gray
    primary: '#140A61',
    // Ödül/kazanım vurgusu için sıcak amber — sparingly (ör. kazanılan ödül rozeti).
    accent: '#C9962F',
  },
  dark: {
    text: '#F3ECE4',
    background: '#171210', // espresso-dark
    backgroundElement: '#231B17',
    backgroundSelected: '#2E2A3E',
    textSecondary: '#B4AA9E',
    primary: '#9B93E8',
    accent: '#D9A94B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Kart/hero/buton/loyalty/bottom-nav için tutarlı border radius ölçeği —
// bkz. tasarım notları: kart 16-20, hero 24, buton 12-16, loyalty 24, nav 24.
export const Radius = {
  button: 14,
  card: 18,
  hero: 24,
  loyalty: 24,
  nav: 24,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    // scaldcoffee.com ile eşleşen marka fontları: başlıklarda Cormorant
    // Garamond (serif), gövde metninde Manrope (sans-serif). expo-font ile
    // src/hooks/use-app-fonts.ts içinde yüklenirler.
    heading: 'CormorantGaramond_600SemiBold',
    headingBold: 'CormorantGaramond_700Bold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    heading: 'CormorantGaramond_600SemiBold',
    headingBold: 'CormorantGaramond_700Bold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
    heading: 'CormorantGaramond_600SemiBold',
    headingBold: 'CormorantGaramond_700Bold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
