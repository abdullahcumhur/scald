// Favoriler — bkz. backend/supabase/migrations/0012_customer_app_redesign.sql
// (public.favorites, user_id+product_id birincil anahtarlı basit bir tablo).
// Supabase yapılandırılmamışsa (misafir/demo modu) favoriler sadece React
// state'inde tutulur, hiçbir yere kaydedilmez.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type FavoritesContextValue = {
  favoriteIds: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isConfigured, user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    // Effect gövdesinde doğrudan senkron setState çağırmamak için (bkz.
    // react-hooks/set-state-in-effect) mantığı ayrı bir fonksiyona taşıyoruz
    // — bu da projede başka yerlerde kullanılan desenle aynı.
    async function run() {
      if (!isConfigured || !user) {
        setFavoriteIds(new Set());
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (!isMounted) return;
      if (error) {
        console.warn('[FavoritesProvider] Favoriler yüklenemedi:', error.message);
        return;
      }
      setFavoriteIds(new Set((data ?? []).map((row) => row.product_id as string)));
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, user]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const alreadyFavorite = favoriteIds.has(productId);

      // İyimser güncelleme — Supabase yapılandırılmamışsa ya da kullanıcı
      // giriş yapmamışsa da favoriler en azından bu oturum için çalışır.
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (alreadyFavorite) next.delete(productId);
        else next.add(productId);
        return next;
      });

      if (!isConfigured || !user) return;

      if (alreadyFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) console.warn('[FavoritesProvider] Favori kaldırılamadı:', error.message);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) console.warn('[FavoritesProvider] Favori eklenemedi:', error.message);
      }
    },
    [favoriteIds, isConfigured, user]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites, FavoritesProvider içinde kullanılmalı');
  }
  return ctx;
}
