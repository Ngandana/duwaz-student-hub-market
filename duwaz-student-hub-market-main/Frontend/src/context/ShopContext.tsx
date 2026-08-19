import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Business } from '@/types';

interface ShopContextValue {
  myShops: Business[];          // all shops owned by the logged-in user
  isLoadingShop: boolean;
  setMyShops: (shops: Business[]) => void;
  setLoadingShop: (loading: boolean) => void;
  clearShops: () => void;
  // convenience — true if user owns at least one shop
  hasShops: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

const SHOPS_KEY = 'duwaz_my_shops';

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [myShops, setMyShopsState] = useState<Business[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(true);

  // Seed from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SHOPS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMyShopsState(parsed);
          setIsLoadingShop(false);
        }
      } catch {
        localStorage.removeItem(SHOPS_KEY);
      }
    }
    // if nothing in cache, keep isLoadingShop=true until ShopLoader resolves
  }, []);

  const setMyShops = useCallback((shops: Business[]) => {
    setMyShopsState(shops);
    setIsLoadingShop(false);
    if (shops.length > 0) {
      localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
    } else {
      localStorage.removeItem(SHOPS_KEY);
    }
  }, []);

  const setLoadingShop = useCallback((loading: boolean) => {
    setIsLoadingShop(loading);
  }, []);

  const clearShops = useCallback(() => {
    setMyShopsState([]);
    setIsLoadingShop(true);
    localStorage.removeItem(SHOPS_KEY);
  }, []);

  return (
    <ShopContext.Provider
      value={{
        myShops,
        isLoadingShop,
        setMyShops,
        setLoadingShop,
        clearShops,
        hasShops: myShops.length > 0,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShopContext() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShopContext must be used inside <ShopProvider>');
  return ctx;
}
