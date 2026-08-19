import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Phone,
  Star,
  Navigation,
  AlertCircle,
  Store,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackingApi, type TrackingResponse } from '@/services/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { step: 1, icon: ShoppingBag,   label: 'Order Placed',         description: 'Your order has been received' },
  { step: 2, icon: Truck,         label: 'Driver Assigned',       description: 'A driver is on their way to the shop' },
  { step: 3, icon: Store,         label: 'Picked Up From Shop',   description: 'Driver collected your order' },
  { step: 4, icon: Navigation,    label: 'On The Way To You',     description: 'Driver is heading to your location' },
  { step: 5, icon: CheckCircle2,  label: 'Delivered',             description: 'Your order has been delivered' },
];

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING_ASSIGNMENT:      'Waiting for driver',
  ASSIGNED:                'Driver assigned',
  DRIVER_ACCEPTED:         'Driver accepted',
  TRAVELLING_TO_SHOP:      'Driver going to shop',
  PICKED_UP:               'Order picked up',
  TRAVELLING_TO_CUSTOMER:  'On the way to you',
  ARRIVED:                 'Driver arrived',
  DELIVERED:               'Delivered',
  DELIVERY_FAILED:         'Delivery failed',
  CANCELLED:               'Cancelled',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING:           'Order Pending',
  CONFIRMED:         'Order Confirmed',
  PREPARING:         'Being Prepared',
  READY_FOR_PICKUP:  'Ready for Pickup',
  OUT_FOR_DELIVERY:  'Out for Delivery',
  DELIVERED:         'Delivered',
  CANCELLED:         'Cancelled',
  REFUNDED:          'Refunded',
};

// ── ETA Countdown Banner ──────────────────────────────────────────────────────
// Counts down from estimatedArrivalMinutes in real seconds.
// Re-seeds whenever the server sends a new value.
const EtaBanner = ({ estimatedMinutes }: { estimatedMinutes: number }) => {
  const [secondsLeft, setSecondsLeft] = useState(estimatedMinutes * 60);

  // Re-seed when server refreshes the value
  useEffect(() => {
    setSecondsLeft(estimatedMinutes * 60);
  }, [estimatedMinutes]);

  // Countdown tick
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 120; // last 2 min

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
      secondsLeft === 0
        ? 'bg-green-50 border-green-200'
        : isUrgent
        ? 'bg-red-50 border-red-200 animate-pulse'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className={`text-2xl font-mono font-bold tabular-nums ${
        secondsLeft === 0 ? 'text-green-600' : isUrgent ? 'text-red-600' : 'text-amber-700'
      }`}>
        {secondsLeft === 0 ? 'Arriving now!' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase ${
          secondsLeft === 0 ? 'text-green-700' : isUrgent ? 'text-red-700' : 'text-amber-700'
        }`}>Estimated Arrival</p>
        <p className="text-xs text-gray-500">
          {secondsLeft === 0 ? 'Your driver should be with you' : 'Driver is on the way · updates every 8s'}
        </p>
      </div>
    </div>
  );
};

// ── Embedded mini-map using OpenStreetMap + Leaflet (no API key needed) ────────
// We render an iframe to OSM since we can't install leaflet without npm install.
// When driver lat/lng is available we show their pin; otherwise we show the
// delivery address as a search query.
const MiniMap = ({ lat, lng, address }: { lat?: number; lng?: number; address?: string }) => {
  if (lat != null && lng != null) {
    // Use OpenStreetMap embed with a marker at the driver location
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <iframe
          title="Driver location"
          src={src}
          width="100%"
          height="260"
          className="block"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2">
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-white border border-gray-300 rounded px-2 py-1 shadow hover:bg-gray-50"
          >
            Open full map
          </a>
        </div>
      </div>
    );
  }

  if (address) {
    const encoded = encodeURIComponent(address);
    const src = `https://www.openstreetmap.org/export/embed.html?query=${encoded}&layer=mapnik`;
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <iframe
          title="Delivery address"
          src={src}
          width="100%"
          height="260"
          className="block"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2">
          <a
            href={`https://www.openstreetmap.org/search?query=${encoded}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-white border border-gray-300 rounded px-2 py-1 shadow hover:bg-gray-50"
          >
            Open full map
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 h-[260px] flex items-center justify-center">
      <div className="text-center text-gray-400">
        <MapPin className="h-10 w-10 mx-auto mb-2" />
        <p className="text-sm">Location not available yet</p>
      </div>
    </div>
  );
};

// ── Status Timeline ───────────────────────────────────────────────────────────
const StatusTimeline = ({ currentStage, tracking }: { currentStage: number; tracking: TrackingResponse }) => {
  const isFailed =
    tracking.deliveryStatus === 'DELIVERY_FAILED' || tracking.orderStatus === 'CANCELLED';

  return (
    <div className="space-y-0">
      {STAGES.map((stage, idx) => {
        const isDone = currentStage > stage.step;
        const isActive = currentStage === stage.step && !isFailed;
        const isCurrent = isActive;
        const Icon = stage.icon;

        // Timestamp to show for completed stages
        let timestamp: string | undefined;
        if (stage.step === 1 && tracking.orderDate)     timestamp = tracking.orderDate;
        if (stage.step === 2 && tracking.assignedAt)    timestamp = tracking.assignedAt;
        if (stage.step === 3 && tracking.pickedUpAt)    timestamp = tracking.pickedUpAt;
        if (stage.step === 4 && tracking.acceptedAt)    timestamp = tracking.acceptedAt;
        if (stage.step === 5 && tracking.deliveredAt)   timestamp = tracking.deliveredAt;

        return (
          <div key={stage.step} className="flex gap-4">
            {/* Left: icon + vertical line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 ${
                  isFailed && stage.step === currentStage
                    ? 'bg-red-100 text-red-500 border-2 border-red-300'
                    : isDone
                    ? 'bg-green-500 text-white shadow-md'
                    : isActive
                    ? 'bg-duwaz-brown text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isFailed && stage.step === currentStage ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              {idx < STAGES.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-1 transition-all duration-500 ${
                    isDone ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                  style={{ minHeight: '32px' }}
                />
              )}
            </div>

            {/* Right: text */}
            <div className={`pb-6 flex-1 min-w-0 ${idx === STAGES.length - 1 ? 'pb-0' : ''}`}>
              <p
                className={`font-semibold text-sm leading-tight ${
                  isFailed && stage.step === currentStage
                    ? 'text-red-600'
                    : isDone
                    ? 'text-green-700'
                    : isActive
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {stage.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-duwaz-brown bg-amber-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-duwaz-brown rounded-full animate-pulse" />
                    Now
                  </span>
                )}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  isDone || isActive ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {isFailed && stage.step === currentStage
                  ? tracking.failureReason ?? 'Delivery could not be completed'
                  : stage.description}
              </p>
              {timestamp && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(timestamp).toLocaleTimeString('en-ZA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Driver Card ───────────────────────────────────────────────────────────────
const DriverCard = ({ tracking }: { tracking: TrackingResponse }) => {
  if (!tracking.driverName) return null;

  const secondsAgo = tracking.locationUpdatedAt
    ? Math.round((Date.now() - new Date(tracking.locationUpdatedAt).getTime()) / 1000)
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4 text-duwaz-brown" />
          Your Driver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-duwaz-brown/10 flex items-center justify-center flex-shrink-0">
            <Truck className="h-6 w-6 text-duwaz-brown" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{tracking.driverName}</p>
            <p className="text-sm text-gray-500">{tracking.vehicleType}</p>
            {tracking.driverRating != null && tracking.driverRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">{tracking.driverRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {tracking.driverPhone && (
            <a
              href={`tel:${tracking.driverPhone}`}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
              title="Call driver"
            >
              <Phone className="h-4 w-4 text-green-700" />
            </a>
          )}
        </div>

        {/* Live location freshness indicator */}
        {secondsAgo != null && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                secondsAgo < 30 ? 'bg-green-500 animate-pulse' : secondsAgo < 120 ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            />
            <span className="text-gray-500">
              {secondsAgo < 10
                ? 'Location just updated'
                : secondsAgo < 60
                ? `Location updated ${secondsAgo}s ago`
                : `Location updated ${Math.round(secondsAgo / 60)}m ago`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);

  const {
    data: tracking,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['tracking', id],
    queryFn: () => trackingApi.getOrderTracking(id),
    enabled: !!id && !isNaN(id),
    refetchInterval: 8000,   // poll every 8 seconds for live driver location
    staleTime: 5000,
  });

  const isDelivered = tracking?.orderStatus === 'DELIVERED' || tracking?.deliveryStatus === 'DELIVERED';
  const isFailed    = tracking?.deliveryStatus === 'DELIVERY_FAILED' || tracking?.orderStatus === 'CANCELLED';

  const openInGoogleMaps = () => {
    if (tracking?.driverLatitude && tracking?.driverLongitude) {
      window.open(
        `https://www.google.com/maps?q=${tracking.driverLatitude},${tracking.driverLongitude}`,
        '_blank'
      );
    } else if (tracking?.deliveryAddress) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tracking.deliveryAddress)}`,
        '_blank'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg space-y-4">
        <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="h-[260px] bg-gray-200 animate-pulse rounded-xl" />
        <div className="h-32 bg-gray-200 animate-pulse rounded-xl" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (isError || !tracking) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Tracking Unavailable</h2>
        <p className="text-gray-500 mb-6">
          We couldn't load tracking info for order #{id}. It may not exist or you may not have access.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button asChild>
            <Link to="/account">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStage = tracking.currentStage ?? 1;

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/account"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          My Orders
        </Link>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Updated {new Date(dataUpdatedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title + order status badge */}
      <div>
        <h1 className="text-2xl font-bold">Order #{tracking.orderId}</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge
            className={
              isDelivered
                ? 'bg-green-100 text-green-700 border-green-200'
                : isFailed
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }
            variant="outline"
          >
            {ORDER_STATUS_LABELS[tracking.orderStatus] ?? tracking.orderStatus}
          </Badge>
          {tracking.deliveryStatus && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {DELIVERY_STATUS_LABELS[tracking.deliveryStatus] ?? tracking.deliveryStatus}
            </Badge>
          )}
          {!isDelivered && !isFailed && (
            <span className="flex items-center gap-1 text-xs text-duwaz-brown">
              <span className="w-1.5 h-1.5 rounded-full bg-duwaz-brown animate-ping" />
              Live tracking
            </span>
          )}
        </div>
      </div>

      {/* ETA Countdown — only when a driver is assigned and actively delivering */}
      {tracking.estimatedArrivalMinutes != null &&
       tracking.estimatedArrivalMinutes > 0 &&
       !isDelivered && !isFailed && (
        <EtaBanner estimatedMinutes={tracking.estimatedArrivalMinutes} />
      )}

      {/* Map */}
      <MiniMap
        lat={tracking.driverLatitude}
        lng={tracking.driverLongitude}
        address={tracking.deliveryAddress}
      />

      {/* Open in Google Maps button */}
      {(tracking.driverLatitude || tracking.deliveryAddress) && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={openInGoogleMaps}
        >
          <Navigation className="h-4 w-4" />
          Open in Google Maps
        </Button>
      )}

      {/* Driver card */}
      <DriverCard tracking={tracking} />

      {/* Shop info */}
      {tracking.shopName && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase font-semibold">Shop</p>
                <p className="font-medium">{tracking.shopName}</p>
              </div>
              {tracking.shopPhone && (
                <a
                  href={`tel:${tracking.shopPhone}`}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                  title="Call shop"
                >
                  <Phone className="h-4 w-4 text-blue-600" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery address */}
      {tracking.deliveryAddress && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Delivering to</p>
                <p className="text-sm mt-0.5">{tracking.deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-duwaz-brown" />
            Delivery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStage={currentStage} tracking={tracking} />
        </CardContent>
      </Card>

      {/* OTP section — shown when driver has arrived and OTP not yet verified */}
      {tracking.deliveryStatus === 'ARRIVED' && !tracking.otpVerified && (
        <Card className="border-duwaz-brown/50 bg-amber-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-duwaz-brown mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Driver has arrived!</p>
                <p className="text-sm text-gray-600 mt-1">
                  Give your driver the OTP code below to complete the delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OTP code card — visible from when driver is assigned until delivery confirmed */}
      {tracking.otpCode && !tracking.otpVerified && (
        <Card className="border-2 border-duwaz-brown/40 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1 text-center">
              Your Delivery OTP
            </p>
            <div className="flex justify-center my-2">
              <div className="bg-white border-2 border-dashed border-duwaz-brown rounded-xl px-6 py-3">
                <p className="text-4xl font-black tracking-[0.4em] font-mono text-duwaz-brown select-all">
                  {tracking.otpCode}
                </p>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Show this code to your driver when they arrive to confirm delivery.
            </p>
            <p className="text-xs text-center text-amber-700 font-medium mt-1">
              Do not share this with anyone else.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order date</span>
            <span>{new Date(tracking.orderDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
            <span>Total</span>
            <span>R{Number(tracking.totalAmount).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delivered / failed states */}
      {isDelivered && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <p className="font-bold text-green-700">Order Delivered!</p>
          <p className="text-sm text-gray-600">
            Delivered {tracking.deliveredAt
              ? new Date(tracking.deliveredAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
              : ''}
          </p>
          {tracking.deliveryNotes && (
            <p className="text-xs text-gray-500 italic">{tracking.deliveryNotes}</p>
          )}
          <Button asChild size="sm" className="mt-2">
            <Link to="/account">Back to Orders</Link>
          </Button>
        </div>
      )}

      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="font-bold text-red-700">
            {tracking.orderStatus === 'CANCELLED' ? 'Order Cancelled' : 'Delivery Failed'}
          </p>
          {tracking.failureReason && (
            <p className="text-sm text-gray-600">{tracking.failureReason}</p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/account">Back to Orders</Link>
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-4">
        This page refreshes automatically every 8 seconds
      </p>
    </div>
  );
};

export default OrderTrackingPage;
