import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, change: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Returns the localStorage key for a given user's cart */
function cartKey(userId: number | undefined): string {
  return userId ? `duwaz_cart_${userId}` : 'duwaz_cart_guest';
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // ── Load cart from localStorage when user changes (login / logout / page refresh) ──
  useEffect(() => {
    const key = cartKey(user?.userId);
    try {
      const stored = localStorage.getItem(key);
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  }, [user?.userId]);

  // ── Persist cart to localStorage whenever items change ────────────────────
  useEffect(() => {
    const key = cartKey(user?.userId);
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, user?.userId]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, change: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + change } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Also remove from localStorage immediately
    localStorage.removeItem(cartKey(user?.userId));
  }, [user?.userId]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
