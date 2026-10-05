// "Sırasız Teslim Al" (Faz 2.5) sepeti. Kalıcılık gerekmiyor — sadece oturum
// boyunca React state'inde tutulan basit bir sepet. Rezervasyon oluşturulduktan
// sonra cart.tsx `clear()` çağırarak sepeti boşaltır.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Product } from '@/types/models';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.product.id !== productId);
      }
      return current.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
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
