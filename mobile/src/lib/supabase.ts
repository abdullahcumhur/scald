import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. ' +
      'mobile/.env dosyasını mobile/.env.example referans alarak oluşturun.'
  );
}

// @react-native-async-storage/async-storage'ın web sürümü `window.localStorage`'a
// doğrudan erişiyor; bu, expo-router'ın web.output="static" ayarıyla sayfaları
// Node üzerinde SSR ederken (window tanımsızken) çöküyor. Native'de her zaman
// AsyncStorage, web'de ise sadece tarayıcıda (window varken) localStorage
// kullanan, SSR-güvenli bir storage adaptörü tanımlıyoruz.
const expoSupabaseStorage: SupportedStorage = {
  getItem: async (key) => {
    if (Platform.OS !== 'web') return AsyncStorage.getItem(key);
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS !== 'web') return AsyncStorage.setItem(key, value);
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS !== 'web') return AsyncStorage.removeItem(key);
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: expoSupabaseStorage,
    autoRefreshToken: Platform.OS !== 'web' || typeof window !== 'undefined',
    persistSession: true,
    detectSessionInUrl: false,
  },
});
