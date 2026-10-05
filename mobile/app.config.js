// Dinamik Expo config. app.json statik temel config olarak kalıyor (Expo CLI
// otomatik okur ve bu dosyaya `config` parametresi olarak enjekte eder); bu
// dosya sadece build zamanında ortam değişkenine bağlı olan tek bir alanı
// (android.config.googleMaps.apiKey) üstüne yazıyor. İkisi birlikte var
// olabiliyor — Expo, app.config.js'i app.json üzerine "middleware" gibi
// uygular: https://docs.expo.dev/workflow/configuration/
//
// Google Maps Android SDK API key'i gerçek bir Google Cloud Console key'i
// girilmediği (veya hâlâ TODO_ placeholder'ı olduğu) sürece config'e hiç
// eklenmiyor; böylece native tarafta sessizce bozuk/gri bir harita yerine,
// JS tarafında (locations-map.tsx) bu durumu process.env üzerinden tespit
// edip kullanıcıya anlamlı bir fallback kart gösterebiliyoruz.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function isRealGoogleMapsKey(value) {
  return Boolean(value) && !value.startsWith('TODO_');
}

module.exports = ({ config }) => {
  if (!isRealGoogleMapsKey(GOOGLE_MAPS_API_KEY)) {
    return config;
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};
