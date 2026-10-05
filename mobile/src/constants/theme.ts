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
  },
  dark: {
    text: '#F4F5F8',
    background: '#0E0E14',
    backgroundElement: '#1B1C26',
    backgroundSelected: '#272A3C',
    textSecondary: '#A7ABBD',
    primary: '#8B93E8',
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
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
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
