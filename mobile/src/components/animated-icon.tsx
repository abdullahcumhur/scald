import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

// Marka açılış animasyonu için gerçek Scald logosu geldiğinde buraya eklenecek.
export function AnimatedSplashOverlay() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <View />;
}
