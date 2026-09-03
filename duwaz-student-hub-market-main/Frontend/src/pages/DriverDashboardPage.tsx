import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, MapPin, Phone, CheckCircle, XCircle, Package, User, Navigation, ArrowLeft, MessageSquare, Send, TrendingUp, Banknote } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { deliveriesApi, messagesApi } from '@/services/api';
import type { DeliveryAssignment, DeliveryStatus, DriverStatus, StoreMessage } from '@/types';

// ── Status config ─────────────────────────────────────────────────────────────
const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING_ASSIGNMENT: 'Pending',
  ASSIGNED: 'Assigned',
  DRIVER_ACCEPTED: 'Accepted',
  TRAVELLING_TO_SHOP: 'Going to Shop',
  PICKED_UP: 'Picked Up',
  TRAVELLING_TO_CUSTOMER: 'On the Way',
  ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING_ASSIGNMENT: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  DRIVER_ACCEPTED: 'bg-indigo-100 text-indigo-700',
  TRAVELLING_TO_SHOP: 'bg-purple-100 text-purple-700',
  PICKED_UP: 'bg-orange-100 text-orange-700',
  TRAVELLING_TO_CUSTOMER: 'bg-yellow-100 text-yellow-700',
  ARRIVED: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  DELIVERY_FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const NEXT_DELIVERY_STATUSES: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  ASSIGNED: ['DRIVER_ACCEPTED'],
  DRIVER_ACCEPTED: ['TRAVELLING_TO_SHOP'],
  TRAVELLING_TO_SHOP: ['PICKED_UP'],
  PICKED_UP: ['TRAVELLING_TO_CUSTOMER'],
  TRAVELLING_TO_CUSTOMER: ['ARRIVED'],
  ARRIVED: ['DELIVERED', 'DELIVERY_FAILED'],
};

const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-green-100 text-green-700' },
  { value: 'BUSY', label: 'Busy', color: 'bg-orange-100 text-orange-700' },
  { value: 'OFFLINE', label: 'Offline', color: 'bg-gray-100 text-gray-700' },
  { value: 'ON_BREAK', label: 'On Break', color: 'bg-yellow-100 text-yellow-700' },
];

// ── Progress Bar ──────────────────────────────────────────────────────────────
const STAGES: { status: DeliveryStatus; label: string; short: string }[] = [
  { status: 'ASSIGNED',               label: 'Assigned',           short: '1' },
  { status: 'DRIVER_ACCEPTED',        label: 'Accepted',           short: '2' },
  { status: 'TRAVELLING_TO_SHOP',     label: 'To Shop',            short: '3' },
  { status: 'PICKED_UP',              label: 'Picked Up',          short: '4' },
  { status: 'TRAVELLING_TO_CUSTOMER', label: 'To Customer',        short: '5' },
  { status: 'ARRIVED',                label: 'Arrived',            short: '6' },
  { status: 'DELIVERED',              label: 'Delivered',          short: '✓' },
];

const STAGE_INDEX: Partial<Record<DeliveryStatus, number>> = Object.fromEntries(
  STAGES.map((s, i) => [s.status, i])
);

const DeliveryProgressBar = ({ status }: { status: DeliveryStatus }) => {
  const currentIdx = STAGE_INDEX[status] ?? -1;
  const isFailed = status === 'DELIVERY_FAILED' || status === 'CANCELLED';

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {STAGES.map((stage, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          return (
            <div key={stage.status} className="flex items-center">
              {/* Step circle */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                isFailed
                  ? idx <= currentIdx
                    ? 'bg-red-200 text-red-700'
                    : 'bg-gray-100 text-gray-400'
                  : isDone
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-duwaz-brown text-white ring-2 ring-duwaz-brown/40 ring-offset-1 scale-110'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? '✓' : stage.short}
              </div>
              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div className={`h-0.5 w-6 mx-0.5 flex-shrink-0 ${
                  isDone ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Current stage label */}
      <p className={`text-xs mt-1.5 font-medium ${
        isFailed ? 'text-red-600' : 'text-duwaz-brown'
      }`}>
        {isFailed
          ? status === 'DELIVERY_FAILED' ? 'Delivery Failed' : 'Cancelled'
          : STAGES[currentIdx]?.label ?? 'Unknown'}
      </p>
    </div>
  );
};

// ── Next step config — label + icon + description shown to driver ─────────────
const NEXT_STEP_CONFIG: Partial<Record<DeliveryStatus, { label: string; description: string; icon: string }>> = {
  DRIVER_ACCEPTED:         { label: 'Travelling to Shop',     description: 'Confirm you are heading to pick up the order',    icon: '🏎️' },
  TRAVELLING_TO_SHOP:      { label: 'Order Picked Up',         description: 'Confirm you collected the order from the shop',   icon: '📦' },
  PICKED_UP:               { label: 'On the Way to Customer',  description: 'Confirm you are heading to deliver the order',    icon: '🚗' },
  TRAVELLING_TO_CUSTOMER:  { label: 'Arrived at Customer',     description: 'Confirm you have arrived at the delivery address', icon: '📍' },
  ARRIVED:                 { label: 'Mark as Delivered',        description: 'Confirm successful delivery (OTP required)',      icon: '🎉' },
};

// ── Delivery Card ─────────────────────────────────────────────────────────────
const DeliveryCard = ({
  assignment,
  onStatusUpdate,
  onAccept,
  onOpenMaps,
}: {
  assignment: DeliveryAssignment;
  onStatusUpdate: (id: number, status: DeliveryStatus, notes?: string) => void;
  onAccept: (assignmentId: number) => void;
  onOpenMaps: (address: string) => void;
}) => {
  const [notes, setNotes] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const status = assignment.deliveryStatus;
  const nextStatuses = NEXT_DELIVERY_STATUSES[status] ?? [];
  const order = assignment.order;
  const address = order?.deliveryAddress ?? '';
  const isCompleted = status === 'DELIVERED' || status === 'DELIVERY_FAILED' || status === 'CANCELLED';
  const isFailed = status === 'DELIVERY_FAILED' || status === 'CANCELLED';

  const verifyOtpMutation = useMutation({
    mutationFn: () => deliveriesApi.verifyOtp(assignment.id, otpInput),
    onSuccess: () => {
      toast({ title: 'OTP verified! You can now mark as delivered.' });
      qc.invalidateQueries({ queryKey: ['deliveries', 'my'] });
    },
    onError: (err: any) => toast({ title: 'Invalid OTP', description: err.message, variant: 'destructive' }),
  });

  // Next primary action config
  const primaryNext = nextStatuses.find(s => s !== 'DELIVERY_FAILED');
  const nextConfig = primaryNext ? NEXT_STEP_CONFIG[status] : null;

  return (
    <Card className={`mb-4 ${status === 'ASSIGNED' ? 'border-duwaz-brown/40 shadow-md' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Order #{order?.id}</CardTitle>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${DELIVERY_STATUS_COLORS[status]}`}>
            {DELIVERY_STATUS_LABELS[status]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {order?.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
          {order?.business ? ` · ${order.business.businessName}` : ''}
        </p>

        {/* Progress bar — only for active orders */}
        {!isFailed && (
          <div className="mt-2">
            <DeliveryProgressBar status={status} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer + address */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">Customer</p>
          <p className="font-medium text-sm">{order?.student?.studentName ?? '—'}</p>
          {address && (
            <div className="flex items-start gap-2 mt-1">
              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">{address}</p>
            </div>
          )}
        </div>

        {/* Shop info */}
        {order?.business && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Pick up from</p>
            <p className="font-medium text-sm">{order.business.businessName}</p>
          </div>
        )}

        {/* Items */}
        {order?.items && order.items.length > 0 && (
          <div className="space-y-1 border rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Items ({order.items.length})
            </p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="text-gray-700">{item.product?.name ?? 'Product'} × {item.quantity}</span>
                <span className="font-medium">R{Number(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
              <span>Total</span>
              <span>R{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Navigation button */}
        {address && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenMaps(address)}>
            <Navigation className="h-4 w-4 mr-2" />
            Open in Google Maps
          </Button>
        )}

        {/* ── Accept CTA for ASSIGNED ── */}
        {status === 'ASSIGNED' && (
          <div className="bg-duwaz-brown/5 border border-duwaz-brown/30 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-duwaz-brown">New delivery assigned!</p>
            <p className="text-xs text-gray-600">
              Accept to notify Admin and the shop owner that you're on your way.
            </p>
            <Button
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90 text-white font-semibold"
              onClick={() => onAccept(assignment.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept — I'm On My Way
            </Button>
          </div>
        )}

        {/* ── OTP verification ── */}
        {status === 'ARRIVED' && !assignment.otpVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-amber-700">
              📍 You've arrived! Enter the customer's OTP:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                className="flex-1 text-center text-lg font-mono tracking-widest"
              />
              <Button
                size="sm"
                className="bg-duwaz-brown hover:bg-duwaz-brown/90"
                disabled={otpInput.length !== 6 || verifyOtpMutation.isPending}
                onClick={() => verifyOtpMutation.mutate()}
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* ── Primary next action ── */}
        {!isCompleted && nextConfig && primaryNext && status !== 'ASSIGNED' && (
          <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xl leading-none">{nextConfig.icon}</span>
              <div>
                <p className="text-sm font-semibold">{nextConfig.label}</p>
                <p className="text-xs text-gray-500">{nextConfig.description}</p>
              </div>
            </div>
            <Input
              placeholder="Add delivery notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-duwaz-brown hover:bg-duwaz-brown/90 text-white"
                disabled={primaryNext === 'DELIVERED' && !assignment.otpVerified}
                onClick={() => onStatusUpdate(assignment.id, primaryNext, notes || undefined)}
                title={primaryNext === 'DELIVERED' && !assignment.otpVerified ? 'Verify OTP first' : undefined}
              >
                {nextConfig.icon} {nextConfig.label}
              </Button>
              {/* Failure button only shown from ARRIVED onwards */}
              {nextStatuses.includes('DELIVERY_FAILED') && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => onStatusUpdate(assignment.id, 'DELIVERY_FAILED', notes || 'Could not deliver')}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Failed
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Completed / failed feedback ── */}
        {status === 'DELIVERED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-700 font-semibold text-sm">🎉 Delivered successfully!</p>
            {assignment.deliveredAt && (
              <p className="text-xs text-gray-500 mt-1">
                At {new Date(assignment.deliveredAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-red-700 font-semibold text-sm">
              {status === 'DELIVERY_FAILED' ? '❌ Delivery failed' : '🚫 Cancelled'}
            </p>
            {assignment.failureReason && (
              <p className="text-xs text-gray-500 mt-1">{assignment.failureReason}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const DriverDashboardPage = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  const { data: allDeliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries', 'my'],
    queryFn: deliveriesApi.getMyDeliveries,
    refetchInterval: 15000, // poll every 15s
  });

  const { data: profile } = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: deliveriesApi.getMyProfile,
  });

  const { data: earningsData } = useQuery({
    queryKey: ['driver', 'earnings'],
    queryFn: deliveriesApi.getMyEarnings,
    staleTime: 30000,
  });

  const totalEarnings      = Number(earningsData?.totalEarnings      ?? 0);
  const averagePerDelivery = Number(earningsData?.averagePerDelivery ?? 0);
  const earningsList       = (earningsData?.earnings ?? []) as any[];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: DeliveryStatus; notes?: string }) =>
      deliveriesApi.updateDeliveryStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries', 'my'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const acceptMutation = useMutation({
    mutationFn: (assignmentId: number) => deliveriesApi.acceptDelivery(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries', 'my'] });
      qc.invalidateQueries({ queryKey: ['driver', 'messages'] });
      toast({
        title: "Order accepted!",
        description: "Admin and the shop have been notified that you're on your way.",
      });
    },
    onError: (err: any) => toast({ title: 'Failed to accept', description: err.message, variant: 'destructive' }),
  });

  const updateDriverStatusMutation = useMutation({
    mutationFn: (status: DriverStatus) => deliveriesApi.updateMyStatus(status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver', 'profile'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  // Messages from admin
  const { data: driverMessages = [] } = useQuery({
    queryKey: ['driver', 'messages'],
    queryFn: messagesApi.getMyDriverMessages,
    refetchInterval: 15000,
  });
  const { data: driverUnreadData } = useQuery({
    queryKey: ['driver', 'messages', 'unread'],
    queryFn: messagesApi.getDriverUnreadCount,
    refetchInterval: 15000,
  });
  const driverUnreadCount = driverUnreadData?.unreadCount ?? 0;

  const [viewingDriverMsg, setViewingDriverMsg] = useState<StoreMessage | null>(null);
  const [driverReplyContent, setDriverReplyContent] = useState('');
  const [replyingToDriverMsg, setReplyingToDriverMsg] = useState<StoreMessage | null>(null);

  const driverMarkReadMutation = useMutation({
    mutationFn: (id: number) => messagesApi.driverMarkRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', 'messages'] }),
  });
  const driverReplyMutation = useMutation({
    mutationFn: ({ id, replyContent }: { id: number; replyContent: string }) =>
      messagesApi.driverReply(id, replyContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver', 'messages'] });
      setReplyingToDriverMsg(null);
      setDriverReplyContent('');
      toast({ title: 'Reply sent to Admin' });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const activeDeliveries = allDeliveries.filter(
    (a) => a.deliveryStatus !== 'DELIVERED' && a.deliveryStatus !== 'DELIVERY_FAILED' && a.deliveryStatus !== 'CANCELLED'
  );

  // ── Live GPS broadcasting ──────────────────────────────────────────────────
  // While the driver has active deliveries, push location to backend every 8s.
  useEffect(() => {
    if (activeDeliveries.length === 0) return;
    if (!navigator.geolocation) return;

    const pushLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          deliveriesApi.updateMyLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {
            // Silently ignore — non-critical
          });
        },
        () => {
          // Permission denied or unavailable — ignore silently
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    };

    pushLocation(); // push immediately
    const interval = setInterval(pushLocation, 8000);
    return () => clearInterval(interval);
  }, [activeDeliveries.length]);
  const completedDeliveries = allDeliveries.filter((a) => a.deliveryStatus === 'DELIVERED');
  const failedDeliveries = allDeliveries.filter(
    (a) => a.deliveryStatus === 'DELIVERY_FAILED' || a.deliveryStatus === 'CANCELLED'
  );

  const currentStatus = profile?.status ?? 'OFFLINE';
  const currentStatusConfig = DRIVER_STATUS_OPTIONS.find((s) => s.value === currentStatus);

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-duwaz-brown text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/70 hover:text-white transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Truck className="h-6 w-6" />
            <div>
              <p className="font-bold">{user?.studentName}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${currentStatusConfig?.color ?? 'bg-gray-100 text-gray-700'}`}>
              {currentStatusConfig?.label ?? currentStatus}
            </span>
            <Button variant="ghost" size="sm" className="text-white hover:text-white/80" onClick={logout}>
              Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Status selector */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-medium mb-2">My Status</p>
            <div className="flex flex-wrap gap-2">
              {DRIVER_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateDriverStatusMutation.mutate(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                    currentStatus === opt.value
                      ? `${opt.color} border-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-duwaz-brown">{activeDeliveries.length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{completedDeliveries.length}</p>
              <p className="text-xs text-gray-500">Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-gray-600">{profile?.deliveryCount ?? 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-lg font-bold text-emerald-600">R{totalEarnings.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="active" className="flex-1">
              Active ({activeDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex-1">
              <Banknote className="h-4 w-4 mr-1" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Msgs
              {driverUnreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{driverUnreadCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : activeDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No active deliveries.</p>
                  <p className="text-sm text-gray-400 mt-1">Set yourself as Available to receive orders.</p>
                </CardContent>
              </Card>
            ) : (
              activeDeliveries.map((a) => (
                <DeliveryCard
                  key={a.id}
                  assignment={a}
                  onAccept={(assignmentId) => acceptMutation.mutate(assignmentId)}
                  onStatusUpdate={(id, status, notes) =>
                    updateStatusMutation.mutate({ id, status, notes })
                  }
                  onOpenMaps={openMaps}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history">
            {[...completedDeliveries, ...failedDeliveries].length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No delivery history yet.</p>
                </CardContent>
              </Card>
            ) : (
              [...completedDeliveries, ...failedDeliveries].map((a) => (
                <DeliveryCard
                  key={a.id}
                  assignment={a}
                  onAccept={(assignmentId) => acceptMutation.mutate(assignmentId)}
                  onStatusUpdate={(id, status, notes) =>
                    updateStatusMutation.mutate({ id, status, notes })
                  }
                  onOpenMaps={openMaps}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="pt-4 pb-3 text-center">
                    <Banknote className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-2xl font-bold text-emerald-700">R{totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Earned</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold text-blue-600">R{averagePerDelivery.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Per Delivery</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <Truck className="h-5 w-5 mx-auto mb-1 text-duwaz-brown" />
                    <p className="text-2xl font-bold text-duwaz-brown">{profile?.deliveryCount ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Deliveries</p>
                  </CardContent>
                </Card>
              </div>

              {/* How earnings work */}
              <Card className="border-dashed border-emerald-300 bg-emerald-50/30">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-emerald-700 font-semibold">
                    💰 You earn <strong>10% of the product subtotal</strong> (excluding delivery fee) on every order you deliver.
                    Earnings are recorded automatically when you mark an order as delivered.
                  </p>
                </CardContent>
              </Card>

              {/* Earnings history */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Earnings History</CardTitle>
                </CardHeader>
                <CardContent>
                  {earningsList.length === 0 ? (
                    <div className="text-center py-8">
                      <Banknote className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No earnings yet.</p>
                      <p className="text-gray-400 text-xs mt-1">Complete your first delivery to start earning.</p>
                    </div>
                  ) : (
                    <div className="space-y-0 divide-y">
                      {earningsList.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Order #{e.order?.id ?? '—'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(e.earnedAt).toLocaleDateString('en-ZA', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                              {' · '}Product subtotal: R{Number(e.orderTotal).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-bold text-emerald-600 text-sm">
                              +R{Number(e.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">10%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages">            {driverMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No messages from Admin yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Admin instructions and delivery assignments will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(driverMessages as StoreMessage[]).map(msg => {
                  const isUnread = msg.status === 'UNREAD';
                  const isDeliveryAssignment = msg.messageType === 'DRIVER_MESSAGE';
                  return (
                    <Card key={msg.id} className={`cursor-pointer transition-shadow hover:shadow-md ${isUnread ? 'border-blue-300 bg-blue-50/30' : ''}`}
                      onClick={() => { setViewingDriverMsg(msg); driverMarkReadMutation.mutate(msg.id); }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isDeliveryAssignment && <Truck className="h-4 w-4 text-duwaz-brown flex-shrink-0" />}
                              {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                              <p className="font-semibold text-sm truncate">{msg.subject ?? 'Message from Admin'}</p>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(msg.sentAt).toLocaleString()}</p>
                            {msg.order && <p className="text-xs text-duwaz-brown mt-0.5">Order #{msg.order.id}</p>}
                            {msg.replyContent && <p className="text-xs text-green-600 mt-1">✓ You replied</p>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${isUnread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isUnread ? 'New' : msg.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            {profile && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-duwaz-brown/10 flex items-center justify-center overflow-hidden">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-duwaz-brown" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{profile.firstName} {profile.lastName}</p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Vehicle</p>
                      <p className="font-medium">{profile.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License</p>
                      <p className="font-medium">{profile.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="font-medium">{profile.contactNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rating</p>
                      <p className="font-medium">⭐ {profile.rating?.toFixed(1) ?? 'N/A'}</p>
                    </div>
                    {profile.emergencyContact && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{profile.emergencyContact}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      if (profile.contactNumber) {
                        window.open(`tel:${profile.contactNumber}`, '_self');
                      }
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency Contact
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── View Admin Message Dialog ── */}
      <Dialog open={!!viewingDriverMsg} onOpenChange={o => !o && setViewingDriverMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingDriverMsg?.messageType === 'DRIVER_MESSAGE' && <Truck className="h-5 w-5 text-duwaz-brown" />}
              {viewingDriverMsg?.subject ?? 'Message from Admin'}
            </DialogTitle>
          </DialogHeader>
          {viewingDriverMsg && (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
              <p className="text-xs text-gray-400">{new Date(viewingDriverMsg.sentAt).toLocaleString()}</p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 mb-2 uppercase">From Admin</p>
                <pre className="text-sm whitespace-pre-wrap font-sans">{viewingDriverMsg.content}</pre>
              </div>
              {viewingDriverMsg.order && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Linked Order</p>
                  <p className="text-sm font-medium">Order #{viewingDriverMsg.order.id}</p>
                  {viewingDriverMsg.order.deliveryAddress && (
                    <p className="text-xs text-gray-600 mt-1">📍 {viewingDriverMsg.order.deliveryAddress}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() => {
                      const addr = viewingDriverMsg.order?.deliveryAddress;
                      if (addr) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                    }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />Open in Maps
                  </Button>
                </div>
              )}
              {viewingDriverMsg.replyContent && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs font-semibold text-green-600 mb-1 uppercase">Your Reply</p>
                  <p className="text-sm">{viewingDriverMsg.replyContent}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {viewingDriverMsg && viewingDriverMsg.status !== 'RESOLVED' && !viewingDriverMsg.replyContent && (
              <Button
                variant="outline"
                className="border-duwaz-brown text-duwaz-brown"
                onClick={() => { setReplyingToDriverMsg(viewingDriverMsg); setViewingDriverMsg(null); setDriverReplyContent(''); }}
              >
                <Send className="h-4 w-4 mr-1" />Reply to Admin
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewingDriverMsg(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Driver Reply Dialog ── */}
      <Dialog open={!!replyingToDriverMsg} onOpenChange={o => !o && setReplyingToDriverMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reply to Admin</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 max-h-28 overflow-y-auto">
              <p className="font-semibold mb-1">{replyingToDriverMsg?.subject}</p>
              <p className="line-clamp-3">{replyingToDriverMsg?.content}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Your message to Admin:</p>
              <Textarea
                placeholder="Type your reply..."
                value={driverReplyContent}
                onChange={e => setDriverReplyContent(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingToDriverMsg(null)}>Cancel</Button>
            <Button
              className="bg-duwaz-brown hover:bg-duwaz-brown/90"
              disabled={driverReplyMutation.isPending || !driverReplyContent.trim()}
              onClick={() => replyingToDriverMsg && driverReplyMutation.mutate({ id: replyingToDriverMsg.id, replyContent: driverReplyContent })}
            >
              {driverReplyMutation.isPending ? 'Sending...' : <><Send className="h-4 w-4 mr-1" />Send Reply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboardPage;
