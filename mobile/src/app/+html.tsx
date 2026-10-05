import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Bu dosya, statik web export sırasında her sayfa için kök HTML'i
// özelleştirir. Varsayılan Expo Router şablonunu temel alır; PWA olarak
// yüklenebilir olması için manifest bağlantısı, tema rengi ve iOS/Android
// simgeleri eklenmiştir. Detaylar: https://docs.expo.dev/guides/progressive-web-apps/
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* PWA manifest — Chrome/Android "Install app" istemini etkinleştirir. */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#140A61" />
        <meta name="background-color" content="#ffffff" />

        {/* iOS "Add to Home Screen" için standalone mod ve marka simgesi. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Scald" />
        <link rel="apple-touch-icon" href="/pwa-icon-192.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
