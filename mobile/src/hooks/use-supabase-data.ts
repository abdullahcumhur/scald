// Menü ve Şubeler ekranlarının Supabase'den veri çekmesini sağlayan hook'lar.
//
// EXPO_PUBLIC_SUPABASE_URL tanımlı değilse (henüz gerçek bir Supabase projesi
// kurulmadıysa) ya da sorgu hata verirse, src/data/mock.ts içindeki sabit
// veriye düşülür ki geliştirme/demo kesintisiz devam edebilsin.

import { useEffect, useState } from 'react';

import { mockCategories, mockLocations, mockProducts, mockPromotions } from '@/data/mock';
import { mapCategory, mapLocation, mapProduct, mapPromotion } from '@/lib/mappers';
import { supabase } from '@/lib/supabase';
import type { Category, Location, Product, Promotion } from '@/types/models';

const hasSupabaseConfig = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL);

type DataState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export function useCategories(): DataState<Category[]> {
  const [state, setState] = useState<DataState<Category[]>>({
    data: mockCategories,
    loading: hasSupabaseConfig,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!hasSupabaseConfig) {
      console.warn('[useCategories] Supabase yapılandırılmamış, mock kategoriler kullanılıyor.');
      return;
    }

    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          console.warn('[useCategories] Supabase sorgusu başarısız, mock kategorilere dönülüyor:', error?.message);
          setState({ data: mockCategories, loading: false, error: error?.message ?? 'unknown error' });
          return;
        }
        setState({ data: data.map(mapCategory), loading: false, error: null });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export function useProducts(): DataState<Product[]> {
  const [state, setState] = useState<DataState<Product[]>>({
    data: mockProducts,
    loading: hasSupabaseConfig,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!hasSupabaseConfig) {
      console.warn('[useProducts] Supabase yapılandırılmamış, mock ürünler kullanılıyor.');
      return;
    }

    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          console.warn('[useProducts] Supabase sorgusu başarısız, mock ürünlere dönülüyor:', error?.message);
          setState({ data: mockProducts, loading: false, error: error?.message ?? 'unknown error' });
          return;
        }
        setState({ data: data.map(mapProduct), loading: false, error: null });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export function usePromotions(): DataState<Promotion[]> {
  const [state, setState] = useState<DataState<Promotion[]>>({
    data: mockPromotions,
    loading: hasSupabaseConfig,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!hasSupabaseConfig) {
      console.warn('[usePromotions] Supabase yapılandırılmamış, mock kampanyalar kullanılıyor.');
      return;
    }

    supabase
      .from('promotions')
      .select('*')
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          console.warn('[usePromotions] Supabase sorgusu başarısız, mock kampanyalara dönülüyor:', error?.message);
          setState({ data: mockPromotions, loading: false, error: error?.message ?? 'unknown error' });
          return;
        }

        const now = Date.now();
        const active = data
          .map(mapPromotion)
          .filter((promotion) => {
            const startsOk = !promotion.startsAt || new Date(promotion.startsAt).getTime() <= now;
            const endsOk = !promotion.endsAt || new Date(promotion.endsAt).getTime() >= now;
            return startsOk && endsOk;
          });

        setState({ data: active, loading: false, error: null });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export function useLocations(): DataState<Location[]> {
  const [state, setState] = useState<DataState<Location[]>>({
    data: mockLocations,
    loading: hasSupabaseConfig,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!hasSupabaseConfig) {
      console.warn('[useLocations] Supabase yapılandırılmamış, mock şubeler kullanılıyor.');
      return;
    }

    supabase
      .from('locations')
      .select('*')
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data) {
          console.warn('[useLocations] Supabase sorgusu başarısız, mock şubelere dönülüyor:', error?.message);
          setState({ data: mockLocations, loading: false, error: error?.message ?? 'unknown error' });
          return;
        }
        setState({ data: data.map(mapLocation), loading: false, error: null });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
