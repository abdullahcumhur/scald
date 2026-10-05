import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const scheme = useColorScheme();

  // lightColor/darkColor, verildiğinde (ör. "transparent"), hesaplanan tema
  // rengini ezer — aksi halde her ThemedView, type belirtilmese bile opak bir
  // background/dark arka plan alır ve "şeffaf sarmalayıcı" niyeti sessizce yok sayılır.
  const overrideColor = scheme === 'dark' ? darkColor : lightColor;
  const backgroundColor = overrideColor ?? theme[type ?? 'background'];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
