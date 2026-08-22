import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash, MapPin, Info, Bike, Home, Pencil, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────
// Fee = distance component + time component (50/50 split)
// ≤ 3.9 km / ≤ 10 min  → R10 flat
// > 3.9 km / > 10 min  → R20  (R4.13/mile + R1.00/min)
//
// Rate derivation:
//   Distance: R10 ÷ 2.42 miles = R4.13/mile
//   Time:     R10 ÷ 10 min     = R1.00/min
//   Avg bicycle speed: 15 km/h

// CPUT D6 campus (Cape Peninsula University of Technology, District Six)
const FALLBACK_LAT  = -33.9249;   // CPUT D6 campus
const FALLBACK_LON  =  18.4241;

const RATE_PER_MILE = 4.13;
const RATE_PER_MIN  = 1.00;
const AVG_KMH       = 15;
const BASE_FEE      = 10;
const MAX_FEE       = 20;
const THRESHOLD_KM  = 3.9;

// ── Haversine ────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Geocode via OpenStreetMap Nominatim (free, no key needed) ────────────────
async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Append Cape Town context to improve results for local addresses
    const query = address.toLowerCase().includes('cape town') || address.toLowerCase().includes('cput')
      ? address
      : `${address}, Cape Town, South Africa`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=za`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Duwaz-Marketplace/1.0' },
    });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Fee calculation ───────────────────────────────────────────────────────────
function calcFee(distKm: number) {
  const minutes = (distKm / AVG_KMH) * 60;
  const isExtended = distKm > THRESHOLD_KM;
  if (!isExtended) return { fee: BASE_FEE, minutes, isExtended };
  const miles = distKm / 1.609;
  const raw = miles * RATE_PER_MILE + minutes * RATE_PER_MIN;
  return { fee: Math.min(Math.max(BASE_FEE, Math.round(raw)), MAX_FEE), minutes, isExtended };
}

// ── Fee Breakdown card ────────────────────────────────────────────────────────
const FeeBreakdown = ({
  distKm, minutes, fee, isExtended,
  shopAddress, deliveryAddress,
}: {
  distKm: number; minutes: number; fee: number; isExtended: boolean;
  shopAddress: string; deliveryAddress: string;
}) => (
  <div className={`rounded-lg border p-3 text-xs space-y-2 ${isExtended ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
    <div className="flex items-center gap-1.5 font-semibold text-sm">
      <Bike className={`h-4 w-4 ${isExtended ? 'text-amber-600' : 'text-green-600'}`} />
      <span className={isExtended ? 'text-amber-700' : 'text-green-700'}>
        {isExtended ? 'Extended Delivery' : 'Short Delivery'} — R{fee.toFixed(2)}
      </span>
    </div>

    {/* Route */}
    <div className="bg-white rounded border p-2 space-y-1">
      <div className="flex gap-2 text-gray-600">
        <Store className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
        <span className="truncate"><strong>From (shop):</strong> {shopAddress}</span>
      </div>
      <div className="flex gap-2 text-gray-600">
        <MapPin className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
        <span className="truncate"><strong>To (you):</strong> {deliveryAddress}</span>
      </div>
      <div className="border-t pt-1 flex gap-4 text-gray-500">
        <span>📏 {distKm.toFixed(2)} km</span>
        <span>⏱ ~{Math.round(minutes)} min by bicycle</span>
      </div>
    </div>

    {/* Calculation breakdown */}
    {isExtended ? (
      <div className="bg-white rounded border border-amber-200 p-2 space-y-1">
        <p className="font-semibold text-amber-700 mb-1">How we calculated R{fee.toFixed(2)}:</p>
        <div className="flex justify-between">
          <span className="text-gray-500">Distance: {(distKm / 1.609).toFixed(2)} miles × R4.13/mile</span>
          <span className="font-medium">R{((distKm / 1.609) * RATE_PER_MILE).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Time: ~{Math.round(minutes)} min × R1.00/min</span>
          <span className="font-medium">R{(Math.round(minutes) * RATE_PER_MIN).toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold text-amber-700">
          <span>Delivery fee {fee === MAX_FEE ? '(capped at R20)' : ''}</span>
          <span>R{fee.toFixed(2)}</span>
        </div>
      </div>
    ) : (
      <p className="text-gray-600">
        Distance is within <strong>{THRESHOLD_KM} km</strong> — flat rate of <strong>R{BASE_FEE}</strong> applies.
        ({distKm.toFixed(2)} km, ~{Math.round(minutes)} min by bicycle.)
      </p>
    )}

    <div className="flex items-start gap-1 text-gray-500 pt-1 border-t border-gray-200">
      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>Delivered by our own bicycle riders. Fee covers 10% rider pay + bicycle maintenance.</span>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const CartPage = () => {
  const { toast }    = useToast();
  const navigate     = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [useMyResidence, setUseMyResidence] = useState(true);
  const [customAddress, setCustomAddress]   = useState('');

  // Fee state
  const [deliveryFee,   setDeliveryFee]   = useState(BASE_FEE);
  const [distKm,        setDistKm]        = useState(0);
  const [estMinutes,    setEstMinutes]    = useState(0);
  const [isExtended,    setIsExtended]    = useState(false);
  const [feeCalculated, setFeeCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resolvedShopAddress, setResolvedShopAddress] = useState('');
  const [geocodeError, setGeocodeError]   = useState('');

  const effectiveAddress = useMyResidence ? (user?.locationAddress ?? '') : customAddress;
  const total = subtotal + deliveryFee;

  // Get unique shopIds from cart
  const uniqueShopIds = [...new Set(items.map(i => i.shopId).filter(Boolean))] as number[];

  // ── Fetch shop(s) to get their owner's address ────────────────────────────
  // We use the first shop as the origin (single-shop cart is the common case).
  // For multi-shop carts we use the first shop's address; the fee is then shared.
  const [shopOriginAddress, setShopOriginAddress] = useState<string>('');

  useEffect(() => {
    if (uniqueShopIds.length === 0) return;
    const firstShopId = uniqueShopIds[0];
    const token = localStorage.getItem('duwaz_token');
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/businesses/${firstShopId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(biz => {
        const addr = biz?.student?.locationAddress ?? '';
        setShopOriginAddress(addr);
      })
      .catch(() => setShopOriginAddress(''));
  }, [uniqueShopIds.join(',')]);

  // ── Calculate fee ─────────────────────────────────────────────────────────
  const calculateFee = useCallback(async (delivAddr: string, shopAddr: string) => {
    if (!delivAddr.trim()) return;
    setIsCalculating(true);
    setFeeCalculated(false);
    setGeocodeError('');

    try {
      // Geocode delivery address (required)
      const delivCoords = await geocode(delivAddr);
      if (!delivCoords) {
        setGeocodeError(
          'Could not find your address on the map. Try being more specific (e.g. add suburb and city). Base fee R10 applied.'
        );
        setDeliveryFee(BASE_FEE);
        setDistKm(0);
        setFeeCalculated(true);
        return;
      }

      // Geocode shop address — fall back to CPUT D6 if not found
      let shopCoords = shopAddr ? await geocode(shopAddr) : null;
      if (!shopCoords) {
        shopCoords = { lat: FALLBACK_LAT, lon: FALLBACK_LON };
        setResolvedShopAddress('CPUT D6 Campus, Cape Town (fallback)');
      } else {
        setResolvedShopAddress(shopAddr);
      }

      const dist = haversineKm(shopCoords.lat, shopCoords.lon, delivCoords.lat, delivCoords.lon);
      const { fee, minutes, isExtended: ext } = calcFee(dist);

      setDistKm(dist);
      setEstMinutes(minutes);
      setDeliveryFee(fee);
      setIsExtended(ext);
      setFeeCalculated(true);
    } catch {
      setDeliveryFee(BASE_FEE);
      setFeeCalculated(true);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Recalculate whenever delivery address or shop address changes
  useEffect(() => {
    if (!effectiveAddress) return;
    const t = setTimeout(() => calculateFee(effectiveAddress, shopOriginAddress), 800);
    return () => clearTimeout(t);
  }, [effectiveAddress, shopOriginAddress, calculateFee]);

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    toast({ title: 'Item removed', description: `${name} removed from cart.` });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: '/cart' } } });
      toast({ title: 'Create an account first', description: 'You need an account to make a payment.' });
      return;
    }

    if (!effectiveAddress.trim()) {
      toast({
        title: 'Delivery address required',
        description: useMyResidence
          ? 'Your profile has no residence address. Select "Enter a different address" below.'
          : 'Please enter your delivery address.',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingOut(true);

    const businessGroups: Record<string, typeof items> = {};
    items.forEach(item => {
      const key = String(item.shopId ?? 'unknown');
      if (!businessGroups[key]) businessGroups[key] = [];
      businessGroups[key].push(item);
    });

    const shopIds = Object.keys(businessGroups).filter(k => k !== 'unknown');
    if (shopIds.length === 0) {
      toast({ title: 'Checkout failed', description: 'Could not determine which shop these items belong to.', variant: 'destructive' });
      setIsCheckingOut(false);
      return;
    }

    import('@/services/api').then(({ ordersApi }) => {
      const orderPromises = shopIds.map(shopId => {
        const shopItems = businessGroups[shopId];
        const shopSubtotal = shopItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shopDeliveryFee = deliveryFee / shopIds.length;
        const payload = {
          totalAmount: shopSubtotal + shopDeliveryFee,
          deliveryFee: shopDeliveryFee,
          status: 'PENDING',
          deliveryAddress: effectiveAddress.trim(),
          business: { id: Number(shopId) },
          items: shopItems.map(item => ({
            product: { id: item.id },
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        } as any;
        return ordersApi.create(payload);
      });

      Promise.all(orderPromises)
        .then((createdOrders: any[]) => {
          toast({ title: 'Order placed!', description: 'Track your delivery in real time.' });
          clearCart();
          navigate(`/order/${createdOrders[0].id}/track`);
        })
        .catch((err: any) => {
          toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
        })
        .finally(() => setIsCheckingOut(false));
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/marketplace" className="flex items-center text-duwaz-brown mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />Back to marketplace
      </Link>
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8">

          {/* ── Cart Items ── */}
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                  <img src={item.image ?? '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.shopName}</p>
                    </div>
                    <p className="font-bold">R{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                      <span>{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleRemove(item.id, item.name)}>
                      <Trash className="h-4 w-4 mr-1" />Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Delivery address */}
            <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-duwaz-brown" />
                Delivery Address <span className="text-red-500">*</span>
              </h2>

              {/* Use my residence */}
              {isAuthenticated && user?.locationAddress && (
                <button
                  type="button"
                  onClick={() => setUseMyResidence(true)}
                  className={`w-full flex items-start gap-3 border rounded-lg p-3 text-left transition-all ${
                    useMyResidence ? 'border-duwaz-brown bg-duwaz-brown/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Home className={`h-5 w-5 mt-0.5 flex-shrink-0 ${useMyResidence ? 'text-duwaz-brown' : 'text-gray-400'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${useMyResidence ? 'text-duwaz-brown' : 'text-gray-700'}`}>Use my residence</p>
                    <p className="text-xs text-gray-500 truncate">{user.locationAddress}</p>
                  </div>
                  {useMyResidence && (
                    <span className="ml-auto text-xs bg-duwaz-brown text-white px-2 py-0.5 rounded-full flex-shrink-0">✓ Selected</span>
                  )}
                </button>
              )}

              {/* Custom address */}
              <div>
                <button
                  type="button"
                  onClick={() => setUseMyResidence(false)}
                  className={`w-full flex items-center gap-3 border rounded-lg p-3 text-left transition-all mb-2 ${
                    !useMyResidence ? 'border-duwaz-brown bg-duwaz-brown/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Pencil className={`h-5 w-5 flex-shrink-0 ${!useMyResidence ? 'text-duwaz-brown' : 'text-gray-400'}`} />
                  <p className={`text-sm font-semibold ${!useMyResidence ? 'text-duwaz-brown' : 'text-gray-700'}`}>
                    Enter a different address
                  </p>
                  {!useMyResidence && (
                    <span className="ml-auto text-xs bg-duwaz-brown text-white px-2 py-0.5 rounded-full flex-shrink-0">✓ Selected</span>
                  )}
                </button>

                {!useMyResidence && (
                  <div className="space-y-1">
                    <Label htmlFor="customAddr">Delivery address</Label>
                    <Input
                      id="customAddr"
                      placeholder="e.g. 12 Main Road, Observatory, Cape Town"
                      value={customAddress}
                      onChange={e => setCustomAddress(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-gray-400">Include street, suburb and city for accurate fee calculation.</p>
                  </div>
                )}
              </div>

              {/* No residence warning */}
              {isAuthenticated && !user?.locationAddress && useMyResidence && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠ No residence address on your profile. Please select "Enter a different address" above, or update your profile in Account settings.
                </p>
              )}

              {/* Geocode status */}
              {effectiveAddress && (
                <div className="text-xs flex items-start gap-1.5 text-gray-500">
                  {isCalculating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0 mt-0.5" />
                    Calculating delivery fee from shop to your address…</>
                  ) : geocodeError ? (
                    <><Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{geocodeError}</>
                  ) : feeCalculated && distKm > 0 ? (
                    <><MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    Route found — {distKm.toFixed(2)} km from shop</>
                  ) : null}
                </div>
              )}

              {/* Fee breakdown */}
              {feeCalculated && effectiveAddress && distKm > 0 && (
                <FeeBreakdown
                  distKm={distKm}
                  minutes={estMinutes}
                  fee={deliveryFee}
                  isExtended={isExtended}
                  shopAddress={resolvedShopAddress || shopOriginAddress || 'Shop address'}
                  deliveryAddress={effectiveAddress}
                />
              )}
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5" />
                    Delivery fee
                    {isCalculating && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                  </span>
                  <span>R{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
                onClick={handleCheckout}
                disabled={isCheckingOut || isCalculating}
              >
                {isCheckingOut ? 'Processing…' : isCalculating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating fee…</>
                ) : (
                  <><ShoppingBag className="mr-2 h-4 w-4" />Make Payment — R{total.toFixed(2)}</>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You'll be asked to create an account before paying.
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3 text-center">
                By completing this purchase you agree to our terms and conditions.
              </p>
            </div>

          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add items from the marketplace to get started</p>
          <Button asChild><Link to="/marketplace">Browse Products</Link></Button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
