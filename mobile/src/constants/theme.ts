/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// scaldcoffee.com'daki gerçek logo/marka renklerinden alınmıştır (logo mürekkep
// rengi #140A61, site topbar'ı #14242e). Koyu modda okunabilirlik için primary
// daha açık bir tona çekildi.
export const Colors = {
  light: {
    text: '#14151A',
    background: '#ffffff',
    backgroundElement: '#F4F5F8',
    backgroundSelected: '#E3E5F2',
    textSecondary: '#5B5F6D',
    primary: '#140A61',
    // Ana sayfadaki "Hazır Al" CTA kartı ve kampanya rozetleri için sıcak vurgu rengi.
    accent: '#F2B134',
  },
  dark: {
    text: '#F4F5F8',
    background: '#0E0E14',
    backgroundElement: '#1B1C26',
    backgroundSelected: '#272A3C',
    textSecondary: '#A7ABBD',
    primary: '#8B93E8',
    accent: '#F2B134',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
