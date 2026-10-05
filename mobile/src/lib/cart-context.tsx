// "Sırasız Teslim Al" (Faz 2.5) sepeti. Kalıcılık gerekmiyor — sadece oturum
// boyunca React state'inde tutulan basit bir sepet. Rezervasyon oluşturulduktan
// sonra cart.tsx `clear()` çağırarak sepeti boşaltır.
//
// selectedOptions: bkz. backend/supabase/migrations/0012_customer_app_redesign.sql
// (products.options) — aynı ürün farklı seçeneklerle (ör. "Büyük" + "Yulaf
// Sütü") sepete eklenirse ayrı bir satır olarak tutulur. `lineId`, ürün id'si
// + seçilen seçeneklerin deterministik bir serileştirmesidir.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Product } from '@/types/models';

export type SelectedOptions = Record<string, string>;

export type CartItem = {
  lineId: string;
  product: Product;
  quantity: number;
  selectedOptions?: SelectedOptions;
};

function buildLineId(productId: string, selectedOptions?: SelectedOptions): string {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return productId;
  const sortedEntries = Object.entries(selectedOptions).sort(([a], [b]) => a.localeCompare(b));
  return `${productId}::${sortedEntries.map(([k, v]) => `${k}=${v}`).join('|')}`;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, selectedOptions?: SelectedOptions) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, selectedOptions?: SelectedOptions) => {
    const lineId = buildLineId(product.id, selectedOptions);
    setItems((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { lineId, product, quantity: 1, selectedOptions }];
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.lineId !== lineId);
      }
      return current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item));
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, addItem, removeItem, updateQuantity, clear, totalPrice }),
    [items, addItem, removeItem, updateQuantity, clear, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart, CartProvider içinde kullanılmalı');
  }
  return ctx;
}
