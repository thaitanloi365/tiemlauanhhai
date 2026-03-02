import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { CartLine } from '@/lib/types';

const STORAGE_KEY = 'tiemlauanhhai_cart';

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

export const selectCartCount = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.quantity, 0);
export const selectCartTotal = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const index = state.lines.findIndex(
            (item) => item.variantId === line.variantId,
          );
          if (index >= 0) {
            const lines = [...state.lines];
            lines[index] = {
              ...lines[index],
              quantity: lines[index].quantity + quantity,
            };
            return { lines };
          }

          return { lines: [...state.lines, { ...line, quantity }] };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((line) =>
              line.variantId === variantId
                ? { ...line, quantity: Math.max(1, quantity) }
                : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.variantId !== variantId),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;

        const noopStorage: StateStorage = {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        };
        return noopStorage;
      }),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

// Compatibility object so existing call sites can keep cartStore.add/update/remove/clear.
export const cartStore = {
  add: (line: Omit<CartLine, 'quantity'>, quantity = 1) =>
    useCartStore.getState().add(line, quantity),
  updateQuantity: (variantId: string, quantity: number) =>
    useCartStore.getState().updateQuantity(variantId, quantity),
  remove: (variantId: string) => useCartStore.getState().remove(variantId),
  clear: () => useCartStore.getState().clear(),
};
