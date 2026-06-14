'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image?: string;
  size?: string;
  condition?: string;
  sellerUsername: string;
  storeName: string;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
  subtotal: () => number;
}

// Cart lives client-side in Zustand (PRD §10.1).
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) =>
          s.items.find((i) => i.productId === item.productId)
            ? s
            : { items: [...s.items, item] },
        ),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price, 0),
    }),
    { name: 'loopy_cart' },
  ),
);
