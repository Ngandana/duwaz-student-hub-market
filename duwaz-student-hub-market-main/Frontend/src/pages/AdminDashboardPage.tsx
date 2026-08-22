import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Store, Package, ShoppingCart, TrendingUp, AlertCircle,
  Truck, MessageSquare, Send, Search, Pencil, Trash2, Plus,
  Upload, X, Eye, CheckCircle, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ordersApi, deliveriesApi, messagesApi, productsApi, businessesApi, transactionsApi } from '@/services/api';
import { ALL_STATUSES, getStatusBadge, ORDER_STATUS_LABELS } from '@/lib/orderUtils';
import { useCategories } from '@/hooks/useCategories';
import type { Order, OrderStatus, DeliveryDriver, StoreMessage, Product, Business, ProductStatus } from '@/types';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub }: {
  title: string; value: string | number; icon: any; color: string; sub?: string;
}) => (
  <Card>
    <CardContent className="flex items-center p-4">
      <div className={`rounded-full p-2 mr-3 flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// ── Order Detail Dialog ───────────────────────────────────────────────────────
const OrderDetailDialog = ({ order, open, onClose, availableDrivers, onAssignDriver, onStatusChange }: {
  order: Order | null; open: boolean; onClose: () => void;
  availableDrivers: DeliveryDriver[];
  onAssignDriver: (orderId: number, driverId: number) => void;
  onStatusChange: (id: number, status: string) => void;
}) => {
  if (!order) return null;
  const { label, className } = getStatusBadge(order.status);
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Order #{order.id} — Full Details</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[75vh] overflow-y-auto">
          {/* Status + actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>{label}</span>
            <Select onValueChange={v => { onStatusChange(order.id, v); onClose(); }}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Change status" /></SelectTrigger>
              <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={v => { onAssignDriver(order.id, Number(v)); onClose(); }}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Assign driver" /></SelectTrigger>
              <SelectContent>
                {availableDrivers.filter(d => d.status === 'AVAILABLE' && d.active).map(d => (
                  <SelectItem key={d.deliveryDriverId} value={String(d.deliveryDriverId)}>{d.firstName} {d.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Customer */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Customer</p>
            <p className="font-medium">{order.student?.studentName ?? '—'}</p>
            <p className="text-sm text-gray-600">{order.student?.studentNumber ?? '—'}</p>
            {order.deliveryAddress && <p className="text-sm text-gray-600 mt-1">📍 {order.deliveryAddress}</p>}
          </div>
          {/* Shop */}
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Shop</p>
            <p className="font-medium">{order.business?.businessName ?? '—'}</p>
            {order.business?.student && <p className="text-sm text-gray-600">Owner: {order.business.student.studentName}</p>}
          </div>
          {/* Products */}
          {order.items && order.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Products ({order.items.length})</p>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name ?? 'Product'}</p>
                      <p className="text-xs text-gray-500">× {item.quantity} @ R{Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0">R{Number(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span>R{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">Ordered: {new Date(order.orderDate).toLocaleString()}</p>
          {order.cancellationReason && <p className="text-sm text-red-600">Reason: {order.cancellationReason}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Product Form types ────────────────────────────────────────────────────────
interface ProdForm { name: string; description: string; price: string; categoryId: string; imageBase64: string | null; stockQuantity: string; productStatus: ProductStatus; businessId: string; }
const emptyProdForm: ProdForm = { name: '', description: '', price: '', categoryId: '', imageBase64: null, stockQuantity: '0', productStatus: 'AVAILABLE', businessId: '' };

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  // Messages state
  const [messageFilter, setMessageFilter] = useState('ALL');
  const [replyingTo, setReplyingTo] = useState<StoreMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [viewingMessage, setViewingMessage] = useState<StoreMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<StoreMessage | null>(null);

  // Products state
  const [productSearch, setProductSearch] = useState('');
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<ProdForm>(emptyProdForm);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const prodImageRef = useRef<HTMLInputElement>(null);
  const [deleteProdId, setDeleteProdId] = useState<number | null>(null);

  // Data queries
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats, refetchInterval: 30000 });
  const { data: duwazRevenue } = useQuery({ queryKey: ['admin', 'duwaz-revenue'], queryFn: transactionsApi.getAdminRevenue, refetchInterval: 60000 });
  const { data: ordersPage, isLoading: ordersLoading } = useQuery({ queryKey: ['admin', 'orders', page], queryFn: () => ordersApi.getAll(page, 20) });
  const { data: users = [] } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.getUsers });
  const { data: allDrivers = [] } = useQuery({ queryKey: ['admin', 'drivers'], queryFn: deliveriesApi.getAllDrivers, refetchInterval: 15000 });
  const { data: allAssignments = [] } = useQuery({ queryKey: ['admin', 'deliveries'], queryFn: deliveriesApi.getAllAssignments, refetchInterval: 15000 });
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({ queryKey: ['admin', 'products'], queryFn: productsApi.getAll });
  const { data: allShops = [] } = useQuery({ queryKey: ['admin', 'shops'], queryFn: businessesApi.getAll });
  const { data: categories = [] } = useCategories();
  const { data: messages = [], isLoading: messagesLoading } = useQuery({ queryKey: ['admin', 'messages', messageFilter], queryFn: () => messagesApi.getAll(messageFilter), refetchInterval: 15000 });
  const { data: unreadData } = useQuery({ queryKey: ['admin', 'messages', 'unread-count'], queryFn: messagesApi.getUnreadCount, refetchInterval: 15000 });
  const unreadCount = unreadData?.unreadCount ?? 0;

  const orders: Order[] = ordersPage?.content ?? [];
  const totalPages = ordersPage?.totalPages ?? 1;

  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch || String(o.id).includes(orderSearch) || (o.student?.studentName ?? '').toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });
  const filteredProducts = allProducts.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()));

  // Mutations
  const updateStatusMutation = useMutation({ mutationFn: ({ id, status }: { id: number; status: string }) => ordersApi.updateStatus(id, status), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast({ title: 'Status updated' }); }, onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }) });
  const assignDriverMutation = useMutation({ mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) => deliveriesApi.assignDriver(orderId, driverId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] }); toast({ title: 'Driver assigned' }); }, onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }) });
  const deleteOrderMutation = useMutation({ mutationFn: (id: number) => ordersApi.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); setDeleteOrderId(null); toast({ title: 'Order deleted' }); } });
  const updateRoleMutation = useMutation({ mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.updateUserRole(id, role), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast({ title: 'Role updated' }); } });
  const markReadMutation = useMutation({ mutationFn: (id: number) => messagesApi.markRead(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }) });
  const replyMutation = useMutation({ mutationFn: ({ id, replyContent }: { id: number; replyContent: string }) => messagesApi.reply(id, replyContent), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }); setReplyingTo(null); setReplyContent(''); toast({ title: 'Reply sent' }); }, onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }) });
  const resolveMutation = useMutation({ mutationFn: (id: number) => messagesApi.resolve(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }); setViewingMessage(null); toast({ title: 'Resolved' }); } });
  const forwardToDriverMutation = useMutation({
    mutationFn: ({ messageId, driverId }: { messageId: number; driverId: number }) =>
      messagesApi.forwardToDriver(messageId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
      toast({ title: 'Forwarded to driver', description: 'Driver has been notified with full delivery details.' });
    },
    onError: (e: any) => toast({ title: 'Forward failed', description: e.message, variant: 'destructive' }),
  });
  const createProdMutation = useMutation({ mutationFn: (data: Omit<Product, 'id'>) => productsApi.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); setProdDialogOpen(false); toast({ title: 'Product created' }); }, onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }) });
  const updateProdMutation = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => productsApi.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); setProdDialogOpen(false); toast({ title: 'Product updated' }); }, onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }) });
  const deleteProdMutation = useMutation({ mutationFn: (id: number) => productsApi.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); setDeleteProdId(null); toast({ title: 'Deleted' }); } });

  // Product handlers
  const openAddProd = () => { setEditingProd(null); setProdForm(emptyProdForm); setProdImagePreview(null); setProdDialogOpen(true); };
  const openEditProd = (p: Product) => { setEditingProd(p); setProdForm({ name: p.name, description: p.description ?? '', price: String(p.price), categoryId: p.category ? String(p.category.id) : '', imageBase64: null, stockQuantity: String(p.stockQuantity ?? 0), productStatus: (p.productStatus as ProductStatus) ?? 'AVAILABLE', businessId: p.business ? String(p.business.id) : '' }); setProdImagePreview(p.imageUrl ?? null); setProdDialogOpen(true); };
  const handleProdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast({ title: 'Max 2MB', variant: 'destructive' }); return; } const r = new FileReader(); r.onloadend = () => { setProdImagePreview(r.result as string); setProdForm(p => ({ ...p, imageBase64: r.result as string })); }; r.readAsDataURL(f); };
  const handleSaveProd = () => {
    if (!prodForm.name.trim() || !prodForm.price) { toast({ title: 'Name and price required', variant: 'destructive' }); return; }
    const payload: Omit<Product, 'id'> = {
      name: prodForm.name,
      description: prodForm.description,
      price: Number(prodForm.price),
      stockQuantity: Number(prodForm.stockQuantity),
      productStatus: prodForm.productStatus,
      ...(prodForm.categoryId ? { category: { id: Number(prodForm.categoryId) } as any } : {}),
      ...(prodForm.businessId ? { business: { id: Number(prodForm.businessId) } as any } : {}),
      ...(prodForm.imageBase64 ? { imageUrl: prodForm.imageBase64 } : {}),
    };
    if (editingProd) {
      updateProdMutation.mutate({ id: editingProd.id, data: payload });
    } else {
      createProdMutation.mutate(payload);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard title="Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
          <StatCard title="Shops" value={stats.totalShops} icon={Store} color="bg-purple-500" />
          <StatCard title="Products" value={stats.totalProducts} icon={Package} color="bg-orange-500" />
          <StatCard title="Revenue (Gross)" value={`R${Number(stats.totalRevenue ?? 0).toFixed(0)}`} icon={TrendingUp} color="bg-duwaz-brown" />
          <StatCard title="Duwaz 5% Fee" value={`R${Number(duwazRevenue?.duwazRevenue ?? 0).toFixed(2)}`} icon={TrendingUp} color="bg-emerald-600" sub="platform earnings" />
          <StatCard title="Pending" value={stats.pendingOrders} icon={AlertCircle} color="bg-yellow-500" sub={`${stats.readyForPickup ?? 0} ready for pickup`} />
          <StatCard title="Drivers" value={`${stats.availableDrivers ?? 0}/${stats.totalDrivers ?? 0}`} icon={Truck} color="bg-green-500" sub={`${stats.busyDrivers ?? 0} busy`} />
        </div>
      )}

      <Tabs defaultValue="orders">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="orders"><ShoppingCart className="h-4 w-4 mr-1" />Orders</TabsTrigger>
          <TabsTrigger value="deliveries"><Truck className="h-4 w-4 mr-1" />Deliveries</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" />Products</TabsTrigger>
          <TabsTrigger value="shops"><Store className="h-4 w-4 mr-1" />Shops</TabsTrigger>
          <TabsTrigger value="drivers"><Users className="h-4 w-4 mr-1" />Drivers</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-1" />Messages
            {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <CardTitle>All Orders</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." className="pl-8 h-8 w-48 text-xs" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} /></div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="ALL">All Status</SelectItem>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />)}</div>
              : filteredOrders.length === 0 ? <p className="text-center py-8 text-gray-500">No orders found.</p>
              : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-gray-50 text-left"><th className="py-2 px-3">Order</th><th className="py-2 px-3">Customer</th><th className="py-2 px-3">Shop</th><th className="py-2 px-3">Date</th><th className="py-2 px-3">Total</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Actions</th></tr></thead>
                      <tbody>
                        {filteredOrders.map(order => {
                          const { label, className } = getStatusBadge(order.status);
                          return (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">#{order.id}</td>
                              <td className="py-2 px-3 text-xs">{order.student?.studentName ?? '—'}</td>
                              <td className="py-2 px-3 text-xs">{order.business?.businessName ?? '—'}</td>
                              <td className="py-2 px-3 text-xs">{new Date(order.orderDate).toLocaleDateString()}</td>
                              <td className="py-2 px-3 font-medium text-xs">R{Number(order.totalAmount).toFixed(2)}</td>
                              <td className="py-2 px-3"><span className={`px-2 py-0.5 text-xs rounded-full ${className}`}>{label}</span></td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedOrder(order)}><Eye className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteOrderId(order.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">Page {page + 1} of {totalPages} ({ordersPage?.totalElements ?? 0} total)</p>
                    <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Deliveries Tab ── */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader><CardTitle>All Delivery Assignments</CardTitle></CardHeader>
            <CardContent>
              {allAssignments.length === 0 ? <p className="text-center py-8 text-gray-500">No deliveries yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50 text-left"><th className="py-2 px-3">Order</th><th className="py-2 px-3">Customer</th><th className="py-2 px-3">Driver</th><th className="py-2 px-3">Assigned</th><th className="py-2 px-3">Delivery Status</th><th className="py-2 px-3">Reassign</th></tr></thead>
                    <tbody>
                      {allAssignments.map((a: any) => {
                        const dColors: Record<string, string> = { ASSIGNED: 'bg-blue-100 text-blue-700', DRIVER_ACCEPTED: 'bg-indigo-100 text-indigo-700', TRAVELLING_TO_SHOP: 'bg-purple-100 text-purple-700', PICKED_UP: 'bg-orange-100 text-orange-700', TRAVELLING_TO_CUSTOMER: 'bg-yellow-100 text-yellow-700', ARRIVED: 'bg-cyan-100 text-cyan-700', DELIVERED: 'bg-green-100 text-green-700', DELIVERY_FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-500' };
                        return (
                          <tr key={a.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium">#{a.order?.id ?? '—'}</td>
                            <td className="py-2 px-3 text-xs">{a.order?.student?.studentName ?? '—'}</td>
                            <td className="py-2 px-3 text-xs">{a.driver ? `${a.driver.firstName} ${a.driver.lastName}` : '—'}</td>
                            <td className="py-2 px-3 text-xs">{new Date(a.assignedAt).toLocaleDateString()}</td>
                            <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${dColors[a.deliveryStatus] ?? 'bg-gray-100'}`}>{a.deliveryStatus?.replace(/_/g, ' ')}</span></td>
                            <td className="py-2 px-3">
                              <Select onValueChange={driverId => assignDriverMutation.mutate({ orderId: a.order?.id, driverId: Number(driverId) })}>
                                <SelectTrigger className="w-40 h-7 text-xs"><SelectValue placeholder="Reassign" /></SelectTrigger>
                                <SelectContent>{(allDrivers as DeliveryDriver[]).filter(d => d.status === 'AVAILABLE' && d.active).map(d => <SelectItem key={d.deliveryDriverId} value={String(d.deliveryDriverId)}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Products Tab ── */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>All Products</CardTitle>
                <div className="flex gap-2">
                  <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." className="pl-8 h-8 w-40 text-xs" value={productSearch} onChange={e => setProductSearch(e.target.value)} /></div>
                  <Button size="sm" className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={openAddProd}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />)}</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50 text-left"><th className="py-2 px-3">Image</th><th className="py-2 px-3">Name</th><th className="py-2 px-3">Shop</th><th className="py-2 px-3">Category</th><th className="py-2 px-3">Price</th><th className="py-2 px-3">Stock</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Actions</th></tr></thead>
                    <tbody>
                      {filteredProducts.map(p => {
                        const sColors: Record<string, string> = { AVAILABLE: 'bg-green-100 text-green-700', OUT_OF_STOCK: 'bg-red-100 text-red-700', DISCONTINUED: 'bg-gray-100 text-gray-500' };
                        return (
                          <tr key={p.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-200" />}</td>
                            <td className="py-2 px-3 font-medium max-w-[150px] truncate">{p.name}</td>
                            <td className="py-2 px-3 text-xs">{p.business?.businessName ?? '—'}</td>
                            <td className="py-2 px-3 text-xs">{p.category?.name ?? '—'}</td>
                            <td className="py-2 px-3 text-xs font-medium">R{Number(p.price).toFixed(2)}</td>
                            <td className="py-2 px-3 text-xs">{p.stockQuantity ?? 0}</td>
                            <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sColors[p.productStatus ?? 'AVAILABLE'] ?? ''}`}>{(p.productStatus ?? 'AVAILABLE').replace('_', ' ')}</span></td>
                            <td className="py-2 px-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditProd(p)}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteProdId(p.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Shops Tab ── */}
        <TabsContent value="shops">
          <Card>
            <CardHeader><CardTitle>All Shops ({allShops.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(allShops as Business[]).map(shop => (
                  <div key={shop.id} className="border rounded-lg p-4 hover:shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-duwaz-brown/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" /> : <span className="font-bold text-duwaz-brown">{shop.businessName.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{shop.businessName}</p>
                        <p className="text-xs text-gray-500">{shop.student?.studentName ?? '—'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{shop.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Drivers Tab ── */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader><CardTitle>All Drivers ({allDrivers.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-left"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Email</th><th className="py-2 px-3">Vehicle</th><th className="py-2 px-3">Contact</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Deliveries</th><th className="py-2 px-3">Account</th></tr></thead>
                  <tbody>
                    {(allDrivers as DeliveryDriver[]).map(d => (
                      <tr key={d.deliveryDriverId} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{d.firstName} {d.lastName}</td>
                        <td className="py-2 px-3 text-xs">{d.email}</td>
                        <td className="py-2 px-3 text-xs">{d.vehicleType}</td>
                        <td className="py-2 px-3 text-xs">{d.contactNumber}</td>
                        <td className="py-2 px-3"><Badge variant={d.status === 'AVAILABLE' ? 'default' : d.status === 'BUSY' ? 'secondary' : 'outline'}>{d.status ?? 'OFFLINE'}</Badge></td>
                        <td className="py-2 px-3 text-xs">{d.deliveryCount ?? 0}</td>
                        <td className="py-2 px-3"><Badge variant={d.active ? 'default' : 'destructive'}>{d.active ? 'Active' : 'Suspended'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50 text-left"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Email</th><th className="py-2 px-3">Student No.</th><th className="py-2 px-3">Role</th><th className="py-2 px-3">Set Role</th></tr></thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{u.studentName}</td>
                        <td className="py-2 px-3 text-xs">{u.email}</td>
                        <td className="py-2 px-3 text-xs">{u.studentNumber}</td>
                        <td className="py-2 px-3"><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role ?? 'CUSTOMER'}</Badge></td>
                        <td className="py-2 px-3">
                          <Select onValueChange={role => updateRoleMutation.mutate({ id: u.id, role })}>
                            <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Set role" /></SelectTrigger>
                            <SelectContent><SelectItem value="CUSTOMER">Customer</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Messages Tab ── */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Store Messages & Delivery Requests</CardTitle>
                <Select value={messageFilter} onValueChange={setMessageFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ALL">All</SelectItem><SelectItem value="UNREAD">Unread</SelectItem><SelectItem value="READ">Read</SelectItem><SelectItem value="REPLIED">Replied</SelectItem><SelectItem value="RESOLVED">Resolved</SelectItem></SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />)}</div>
              : messages.length === 0 ? <p className="text-center py-8 text-gray-500">No messages.</p>
              : (
                <div className="space-y-3">
                  {(messages as StoreMessage[]).map(msg => {
                    const isDelivery = msg.messageType === 'DELIVERY_REQUEST';
                    const sColors: Record<string, string> = { UNREAD: 'bg-yellow-100 text-yellow-700', READ: 'bg-gray-100 text-gray-600', REPLIED: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700' };
                    return (
                      <div key={msg.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">{isDelivery && <Truck className="h-4 w-4 text-duwaz-brown" />}<p className="font-semibold text-sm">{msg.subject ?? 'No subject'}</p></div>
                            <p className="text-xs text-gray-500">{msg.business?.businessName ?? '—'} · {new Date(msg.sentAt).toLocaleString()}</p>
                            {msg.order && <p className="text-xs text-duwaz-brown mt-0.5">Order #{msg.order.id} · R{Number(msg.order.totalAmount).toFixed(2)}</p>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sColors[msg.status] ?? ''}`}>{msg.status}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setViewingMessage(msg); markReadMutation.mutate(msg.id); }}>View</Button>
                          {msg.status !== 'RESOLVED' && <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-600" onClick={() => { setReplyingTo(msg); setReplyContent(''); markReadMutation.mutate(msg.id); }}><Send className="h-3 w-3 mr-1" />Reply</Button>}
                          {isDelivery && msg.order && (
                            msg.status === 'RESOLVED' ? (
                              <span className="h-7 flex items-center text-xs px-2 rounded-full bg-green-100 text-green-700 font-medium">
                                <CheckCircle className="h-3 w-3 mr-1" />Driver Assigned
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-duwaz-brown hover:bg-duwaz-brown/90 text-white"
                                onClick={() => setForwardingMessage(msg)}
                              >
                                <Truck className="h-3 w-3 mr-1" />Assign & Forward to Driver
                              </Button>
                            )
                          )}
                          {!isDelivery && msg.status !== 'RESOLVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-orange-400 text-orange-700 hover:bg-orange-50"
                              onClick={() => setForwardingMessage(msg)}
                            >
                              <Truck className="h-3 w-3 mr-1" />Forward to Driver
                            </Button>
                          )}
                          {msg.status !== 'RESOLVED' && <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => resolveMutation.mutate(msg.id)}>✓ Resolve</Button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Order Detail Dialog ── */}
      <OrderDetailDialog order={selectedOrder} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} availableDrivers={allDrivers as DeliveryDriver[]} onAssignDriver={(oId, dId) => assignDriverMutation.mutate({ orderId: oId, driverId: dId })} onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })} />

      {/* ── Delete Order Confirm ── */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={o => !o && setDeleteOrderId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Order #{deleteOrderId}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteOrderId && deleteOrderMutation.mutate(deleteOrderId)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* ── Add/Edit Product Dialog ── */}
      <Dialog open={prodDialogOpen} onOpenChange={o => !o && setProdDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingProd ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                {prodImagePreview ? (<><img src={prodImagePreview} alt="product" className="w-16 h-16 rounded-lg object-cover border" /><button type="button" onClick={() => { setProdImagePreview(null); setProdForm(p => ({ ...p, imageBase64: null })); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></>) : (<button type="button" onClick={() => prodImageRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center"><Upload className="h-4 w-4 text-gray-400" /></button>)}
              </div>
              <input ref={prodImageRef} type="file" accept="image/*" className="hidden" onChange={handleProdImageChange} />
              <p className="text-xs text-gray-500">Optional image. Max 2MB.</p>
            </div>
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={prodForm.name} onChange={e => setProdForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={prodForm.description} onChange={e => setProdForm(p => ({ ...p, description: e.target.value }))} className="min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Price (R) *</Label><Input type="number" min="0" step="0.01" value={prodForm.price} onChange={e => setProdForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Stock</Label><Input type="number" min="0" value={prodForm.stockQuantity} onChange={e => setProdForm(p => ({ ...p, stockQuantity: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Category</Label><select className="w-full border rounded-md py-1.5 px-2 text-sm" value={prodForm.categoryId} onChange={e => setProdForm(p => ({ ...p, categoryId: e.target.value }))}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label><select className="w-full border rounded-md py-1.5 px-2 text-sm" value={prodForm.productStatus} onChange={e => setProdForm(p => ({ ...p, productStatus: e.target.value as ProductStatus }))}><option value="AVAILABLE">Available</option><option value="OUT_OF_STOCK">Out of Stock</option><option value="DISCONTINUED">Discontinued</option></select></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Shop (Business)</Label><select className="w-full border rounded-md py-1.5 px-2 text-sm" value={prodForm.businessId} onChange={e => setProdForm(p => ({ ...p, businessId: e.target.value }))}><option value="">None</option>{(allShops as Business[]).map(b => <option key={b.id} value={b.id}>{b.businessName}</option>)}</select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setProdDialogOpen(false)}>Cancel</Button><Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={handleSaveProd} disabled={createProdMutation.isPending || updateProdMutation.isPending}>{createProdMutation.isPending || updateProdMutation.isPending ? 'Saving...' : editingProd ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Product Confirm ── */}
      <AlertDialog open={!!deleteProdId} onOpenChange={o => !o && setDeleteProdId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Product?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteProdId && deleteProdMutation.mutate(deleteProdId)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      {/* ── View Message Dialog ── */}
      <Dialog open={!!viewingMessage} onOpenChange={o => !o && setViewingMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewingMessage?.subject ?? 'Message'}</DialogTitle></DialogHeader>
          {viewingMessage && (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
              <p className="text-xs text-gray-400">From: <span className="font-medium">{viewingMessage.business?.businessName}</span> · {new Date(viewingMessage.sentAt).toLocaleString()}</p>
              <div className="bg-gray-50 rounded-lg p-3"><pre className="text-sm whitespace-pre-wrap font-sans">{viewingMessage.content}</pre></div>
              {viewingMessage.replyContent && <div className="bg-blue-50 rounded-lg p-3 border border-blue-200"><p className="text-xs font-semibold text-blue-600 mb-1">YOUR REPLY</p><p className="text-sm">{viewingMessage.replyContent}</p></div>}
            </div>
          )}
          <DialogFooter className="gap-2">
            {viewingMessage?.status !== 'RESOLVED' && (
              <><Button variant="outline" onClick={() => { setReplyingTo(viewingMessage); setViewingMessage(null); setReplyContent(''); }}><Send className="h-4 w-4 mr-1" />Reply</Button><Button variant="outline" className="text-green-600" onClick={() => viewingMessage && resolveMutation.mutate(viewingMessage.id)}>✓ Resolve</Button></>
            )}
            <Button variant="outline" onClick={() => setViewingMessage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Forward to Driver Dialog ── */}
      <Dialog open={!!forwardingMessage} onOpenChange={o => !o && setForwardingMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-duwaz-brown" />
              {forwardingMessage?.messageType === 'DELIVERY_REQUEST' ? 'Assign & Forward to Driver' : 'Forward Message to Driver'}
            </DialogTitle>
          </DialogHeader>
          {forwardingMessage && (
            <div className="space-y-4 py-2">
              {/* Order / message summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-700 uppercase">Order Details</p>
                <p className="text-sm font-medium">{forwardingMessage.subject ?? 'No subject'}</p>
                <p className="text-xs text-gray-500">{forwardingMessage.business?.businessName ?? '—'}</p>
                {forwardingMessage.order && (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-medium text-duwaz-brown">Order #{forwardingMessage.order.id}</span>
                    <span className="text-xs text-gray-600">R{Number(forwardingMessage.order.totalAmount).toFixed(2)}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      ⏱ ETA: up to 10 min after assignment
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600">
                {forwardingMessage.messageType === 'DELIVERY_REQUEST'
                  ? 'Select a driver. They will be assigned to the order and receive full delivery details automatically.'
                  : 'Select a driver to forward this message to.'}
              </p>

              {/* Driver list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(allDrivers as DeliveryDriver[]).filter(d => d.active).length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">No active drivers registered.</p>
                ) : (
                  (allDrivers as DeliveryDriver[]).filter(d => d.active).map(d => {
                    const isAvailable = d.status === 'AVAILABLE';
                    const statusColors: Record<string, string> = {
                      AVAILABLE: 'bg-green-100 text-green-700',
                      BUSY: 'bg-orange-100 text-orange-700',
                      OFFLINE: 'bg-gray-100 text-gray-500',
                      ON_BREAK: 'bg-yellow-100 text-yellow-700',
                    };
                    return (
                      <div key={d.deliveryDriverId} className={`flex items-center justify-between border rounded-lg p-3 transition-colors ${isAvailable ? 'hover:bg-green-50' : 'opacity-60'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-duwaz-brown/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {d.profileImage
                              ? <img src={d.profileImage} alt={d.firstName} className="w-full h-full object-cover" />
                              : <span className="text-sm font-bold text-duwaz-brown">{d.firstName.charAt(0)}</span>
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">{d.firstName} {d.lastName}</p>
                            <p className="text-xs text-gray-500">{d.vehicleType} · {d.contactNumber}</p>
                            <p className="text-xs text-gray-400">{d.deliveryCount ?? 0} deliveries · ★ {d.rating?.toFixed(1) ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status ?? 'OFFLINE'] ?? 'bg-gray-100'}`}>
                            {d.status ?? 'OFFLINE'}
                          </span>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-duwaz-brown hover:bg-duwaz-brown/90 disabled:opacity-40"
                            disabled={forwardToDriverMutation.isPending || assignDriverMutation.isPending || !isAvailable}
                            title={!isAvailable ? 'Driver is not available' : ''}
                            onClick={() => {
                              const doForward = () => forwardToDriverMutation.mutate(
                                { messageId: forwardingMessage.id, driverId: d.deliveryDriverId },
                                { onSuccess: () => setForwardingMessage(null) }
                              );
                              // For delivery requests also assign the driver to the order
                              if (forwardingMessage.messageType === 'DELIVERY_REQUEST' && forwardingMessage.order) {
                                assignDriverMutation.mutate(
                                  { orderId: forwardingMessage.order.id, driverId: d.deliveryDriverId },
                                  { onSuccess: doForward, onError: doForward } // forward even if already assigned
                                );
                              } else {
                                doForward();
                              }
                            }}
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            {forwardingMessage.messageType === 'DELIVERY_REQUEST' ? 'Assign & Send' : 'Forward'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardingMessage(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reply Dialog ── */}
      <Dialog open={!!replyingTo} onOpenChange={o => !o && setReplyingTo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reply to: {replyingTo?.business?.businessName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 max-h-28 overflow-y-auto"><p className="font-semibold mb-1">{replyingTo?.subject}</p><p className="line-clamp-3">{replyingTo?.content}</p></div>
            <div className="space-y-1"><Label>Reply *</Label><Textarea placeholder="Type your reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="min-h-[100px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" disabled={replyMutation.isPending || !replyContent.trim()} onClick={() => replyingTo && replyMutation.mutate({ id: replyingTo.id, replyContent })}>
              {replyMutation.isPending ? 'Sending...' : <><Send className="h-4 w-4 mr-1" />Send Reply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
