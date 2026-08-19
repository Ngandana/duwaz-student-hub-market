import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShopContext } from '@/context/ShopContext';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Fetches /api/businesses/mine/all on every login and stores the list
 * in ShopContext. Re-fetches whenever the token changes (new login / account switch).
 */
const ShopLoader = () => {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { setMyShops, setLoadingShop } = useShopContext();

  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      prevTokenRef.current = null;
      return;
    }

    if (prevTokenRef.current === token) return;

    prevTokenRef.current = token;
    setLoadingShop(true);

    console.log('[ShopLoader] New login — fetching /api/businesses/mine/all...');

    fetch(`${BASE_URL}/api/businesses/mine/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          console.warn('[ShopLoader] Error:', res.status);
          setMyShops([]);
          return;
        }
        const shops = await res.json();
        console.log('[ShopLoader] Shops loaded:', shops.length);
        setMyShops(Array.isArray(shops) ? shops : []);
      })
      .catch((err) => {
        console.warn('[ShopLoader] Network error:', err?.message);
        setMyShops([]);
      });
  }, [isAuthenticated, authLoading, token]);

  return null;
};

export default ShopLoader;
