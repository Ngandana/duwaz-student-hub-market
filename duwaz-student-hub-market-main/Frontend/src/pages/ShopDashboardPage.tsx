import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient as useQC } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Store, Upload, X, ExternalLink,
  ShoppingCart, Package, TrendingUp, AlertCircle, CheckCircle,
  Search, Filter, ChevronUp, ChevronDown, Settings, BarChart3,
  MessageSquare, Send, Truck, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUpdateBusiness } from '@/hooks/useBusinesses';
import { useBusinessProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useAdjustStock } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { shopApi, ordersApi, messagesApi, transactionsApi } from '@/services/api';
import { getStatusBadge, NEXT_STATUSES, ORDER_STATUS_LABELS } from '@/lib/orderUtils';
import { useShopContext } from '@/context/ShopContext';
import type { Product, OrderStatus, ProductStatus, StoreMessage } from '@/types';

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

// ── Product Status Badge ──────────────────────────────────────────────────────
const ProductStatusBadge = ({ status }: { status?: ProductStatus }) => {
  const map: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    OUT_OF_STOCK: 'bg-red-100 text-red-700',
    DISCONTINUED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status ?? 'AVAILABLE']}`}>
      {status?.replace('_', ' ') ?? 'AVAILABLE'}
    </span>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageBase64: string | null;
  stockQuantity: string;
  productStatus: ProductStatus;
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', categoryId: '',
  imageBase64: null, stockQuantity: '0', productStatus: 'AVAILABLE',
};

// ── Main Component ────────────────────────────────────────────────────────────
const ShopDashboardPage = () => {
  const { toast } = useToast();
  const qc = useQC();
  const { shopId } = useParams<{ shopId: string }>();
  const { myShops } = useShopContext();

  // Load shop: prefer the already-loaded context data, fallback to API fetch
  const { data: fetchedShop, isLoading: shopLoading } = useQuery({
    queryKey: ['businesses', shopId],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/businesses/${shopId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('duwaz_token')}` },
    }).then(r => r.json()),
    enabled: !!shopId,
  });

  // Use context data if available (avoids extra fetch), else use fetched
  const shop = myShops.find(s => String(s.id) === shopId) ?? fetchedShop;
  const { data: products = [], isLoading: productsLoading } = useBusinessProducts(shop?.id ?? 0);
  const { data: categories = [] } = useCategories();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['shop', 'stats'],
    queryFn: shopApi.getStats,
    enabled: !!shop,
    refetchInterval: 30000,
  });

  const { data: shopRevenue } = useQuery({
    queryKey: ['shop', 'revenue'],
    queryFn: transactionsApi.getMyShopRevenue,
    enabled: !!shop,
  });
  const { data: ordersPage } = useQuery({
    queryKey: ['orders', 'shop'],
    queryFn: () => ordersApi.getShopOrders(0, 100),
    enabled: !!shop,
  });
  const shopOrders = ordersPage?.content ?? [];

  // Mutations
  const { mutate: updateShop, isPending: isUpdatingShop } = useUpdateBusiness();
  const { mutate: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  const { mutate: adjustStock } = useAdjustStock();
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders', 'shop'] }); qc.invalidateQueries({ queryKey: ['shop', 'stats'] }); toast({ title: 'Order updated' }); },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  // Messaging queries & mutations
  const { data: myMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', 'mine'],
    queryFn: messagesApi.getMyMessages,
    enabled: !!shop,
    refetchInterval: 15000,
  });
  const sendMessageMutation = useMutation({
    mutationFn: ({ subject, content }: { subject: string; content: string }) =>
      messagesApi.send(subject, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', 'mine'] });
      setComposeOpen(false);
      setComposeSubject('');
      setComposeContent('');
      toast({ title: 'Message sent to Admin' });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });
  const requestDeliveryMutation = useMutation({
    mutationFn: (orderId: number) => messagesApi.requestDelivery(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', 'mine'] });
      qc.invalidateQueries({ queryKey: ['orders', 'shop'] });
      setRequestDeliveryOrderId(null);
      toast({ title: 'Delivery request sent!', description: 'The Admin has been notified and will assign a driver.' });
    },
    onError: (err: any) => toast({ title: 'Request failed', description: err.message, variant: 'destructive' }),
  });

  const unreadReplies = myMessages.filter(m => m.replyContent && m.status === 'REPLIED').length;

  // Track which orders already have a delivery request sent to Admin
  const forwardedOrderIds = new Set<number>(
    (myMessages as any[])
      .filter(m => m.messageType === 'DELIVERY_REQUEST' && m.order?.id)
      .map(m => Number(m.order.id))
  );

  // UI state
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [editShopOpen, setEditShopOpen] = useState(false);
  const [shopForm, setShopForm] = useState({ businessName: '', description: '', logoBase64: null as string | null });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyForm);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [stockDialogProduct, setStockDialogProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState('');

  // Messaging state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [requestDeliveryOrderId, setRequestDeliveryOrderId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<StoreMessage | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const openEditShop = () => {
    if (!shop) return;
    setShopForm({ businessName: shop.businessName, description: shop.description ?? '', logoBase64: null });
    setLogoPreview(shop.logoUrl ?? null);
    setEditShopOpen(true);
  };
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Max 2MB', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { const b64 = reader.result as string; setLogoPreview(b64); setShopForm(p => ({ ...p, logoBase64: b64 })); };
    reader.readAsDataURL(file);
  };
  const handleSaveShop = () => {
    if (!shop) return;
    updateShop({ id: shop.id, data: { businessName: shopForm.businessName, description: shopForm.description, ...(shopForm.logoBase64 ? { logoUrl: shopForm.logoBase64 } : {}) } }, {
      onSuccess: () => { toast({ title: 'Shop updated!' }); setEditShopOpen(false); },
      onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
    });
  };

  const openAddProduct = () => { setEditingProduct(null); setProductForm(emptyForm); setProductImagePreview(null); setProductDialogOpen(true); };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description ?? '', price: String(p.price), categoryId: p.category ? String(p.category.id) : '', imageBase64: null, stockQuantity: String(p.stockQuantity ?? 0), productStatus: (p.productStatus as ProductStatus) ?? 'AVAILABLE' });
    setProductImagePreview(p.imageUrl ?? null);
    setProductDialogOpen(true);
  };
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Max 2MB', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { const b64 = reader.result as string; setProductImagePreview(b64); setProductForm(p => ({ ...p, imageBase64: b64 })); };
    reader.readAsDataURL(file);
  };
  const handleSaveProduct = () => {
    if (!shop || !productForm.name.trim() || !productForm.price) { toast({ title: 'Name and price required', variant: 'destructive' }); return; }
    const payload: Omit<Product, 'id'> = {
      name: productForm.name, description: productForm.description, price: Number(productForm.price),
      business: { id: shop.id } as any,
      stockQuantity: Number(productForm.stockQuantity),
      productStatus: productForm.productStatus,
      ...(productForm.categoryId ? { category: { id: Number(productForm.categoryId) } as any } : {}),
      ...(productForm.imageBase64 ? { imageUrl: productForm.imageBase64 } : {}),
    };
    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: payload }, { onSuccess: () => { toast({ title: 'Product updated!' }); setProductDialogOpen(false); qc.invalidateQueries({ queryKey: ['shop', 'stats'] }); }, onError: (err) => toast({ title: 'Failed to update product', description: err.message, variant: 'destructive' }) });
    } else {
      createProduct(payload, { onSuccess: () => { toast({ title: 'Product added!' }); setProductDialogOpen(false); qc.invalidateQueries({ queryKey: ['shop', 'stats'] }); }, onError: (err) => toast({ title: 'Failed to add product', description: err.message, variant: 'destructive' }) });
    }
  };
  const confirmDelete = () => {
    if (!deleteProductId) return;
    deleteProduct(deleteProductId, { onSuccess: () => { toast({ title: 'Deleted' }); setDeleteProductId(null); qc.invalidateQueries({ queryKey: ['shop', 'stats'] }); }, onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }) });
  };
  const handleAdjustStock = () => {
    if (!stockDialogProduct) return;
    const delta = Number(stockDelta);
    if (isNaN(delta) || delta === 0) { toast({ title: 'Enter a valid number', variant: 'destructive' }); return; }
    adjustStock({ id: stockDialogProduct.id, delta }, { onSuccess: () => { toast({ title: `Stock ${delta > 0 ? 'increased' : 'decreased'}` }); setStockDialogProduct(null); setStockDelta(''); }, onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }) });
  };

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchFilter = productFilter === 'ALL' || p.productStatus === productFilter || (productFilter === 'LOW_STOCK' && (p.stockQuantity ?? 0) <= 5 && (p.stockQuantity ?? 0) > 0);
    return matchSearch && matchFilter;
  });
  const filteredOrders = shopOrders.filter(o => {
    const matchSearch = !orderSearch || String(o.id).includes(orderSearch) || (o.student?.studentName ?? '').toLowerCase().includes(orderSearch.toLowerCase());
    const matchFilter = orderFilter === 'ALL' || o.status === orderFilter;
    return matchSearch && matchFilter;
  });

  // ── Early returns ──────────────────────────────────────────────────────────
  if (shopLoading) return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />)}
    </div>
  );
  if (!shop) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Store className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold mb-2">You don't have a shop yet</h2>
      <p className="text-gray-500 mb-6">Create a shop to start selling.</p>
      <Button asChild className="bg-duwaz-brown hover:bg-duwaz-brown/90"><Link to="/create-shop">Create Your Shop</Link></Button>
    </div>
  );

  const pendingCount = shopOrders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-duwaz-brown bg-duwaz-brown/10 flex items-center justify-center flex-shrink-0">
            {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-duwaz-brown">{shop.businessName.charAt(0)}</span>}
          </div>
          <div>
            <h1 className="text-xl font-bold">{shop.businessName}</h1>
            <p className="text-gray-500 text-sm">{shop.description}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={openEditShop}><Pencil className="h-4 w-4 mr-1" />Edit Shop</Button>
          <Button variant="outline" size="sm" asChild><Link to={`/shop/${shop.id}`}><ExternalLink className="h-4 w-4 mr-1" />Public Page</Link></Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard title="Total Revenue" value={`R${Number(stats.totalRevenue ?? 0).toFixed(0)}`} icon={TrendingUp} color="bg-duwaz-brown" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-blue-500" />
          <StatCard title="Pending" value={stats.pendingOrders} icon={AlertCircle} color="bg-yellow-500" />
          <StatCard title="Completed" value={stats.completedOrders} icon={CheckCircle} color="bg-green-500" />
          <StatCard title="Products" value={stats.totalProducts} icon={Package} color="bg-purple-500" />
          <StatCard title="Out of Stock" value={stats.outOfStockProducts} icon={AlertCircle} color="bg-red-500" sub={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : undefined} />
          {/* Net earnings after splits */}
          <StatCard
            title="My Net Earnings"
            value={`R${Number(shopRevenue?.shopRevenue ?? 0).toFixed(2)}`}
            icon={TrendingUp}
            color="bg-emerald-600"
            sub="85% of product sales"
          />
        </div>
      )}

      {/* Revenue split info banner */}
      {shopRevenue && Number(shopRevenue.shopRevenue) > 0 && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs flex flex-wrap gap-4">
          <span className="font-semibold text-emerald-700">💰 Revenue Split per order:</span>
          <span className="text-gray-600">You (shop) <strong className="text-emerald-700">85%</strong></span>
          <span className="text-gray-600">Driver <strong className="text-amber-700">10%</strong></span>
          <span className="text-gray-600">Duwaz platform <strong className="text-blue-700">5%</strong></span>
          <span className="text-gray-400">· Delivery fee charged separately to customer</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" />Products ({products.length})</TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-1" />Orders
            {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-1" />Messages
            {unreadReplies > 0 && <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadReplies}</span>}
          </TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Settings</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
              <CardContent>
                {shopOrders.slice(0, 5).length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No orders yet</p> : shopOrders.slice(0, 5).map(o => {
                  const { label, className } = getStatusBadge(o.status);
                  return (
                    <div key={o.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">Order #{o.id}</p>
                        <p className="text-xs text-gray-500">{o.student?.studentName ?? '—'} · {new Date(o.orderDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R{Number(o.totalAmount).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${className}`}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Stock Alerts</CardTitle></CardHeader>
              <CardContent>
                {products.filter(p => (p.stockQuantity ?? 0) <= 5).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">All products have sufficient stock</p>
                ) : products.filter(p => (p.stockQuantity ?? 0) <= 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(p.stockQuantity ?? 0) === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.stockQuantity ?? 0} left</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setStockDialogProduct(p); setStockDelta(''); }}>Restock</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Products Tab ── */}
        <TabsContent value="products">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search products..." className="pl-9" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Products</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock (≤5)</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={openAddProduct}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
          </div>
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-lg" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <Card className="text-center py-12"><CardContent><p className="text-gray-500 mb-4">No products match your filter.</p><Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={openAddProduct}><Plus className="h-4 w-4 mr-1" />Add Product</Button></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-sm">No image</span>}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                        <p className="font-bold text-duwaz-brown text-sm">R{Number(product.price).toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <ProductStatusBadge status={product.productStatus as ProductStatus} />
                          <span className="text-xs text-gray-500">Stock: {product.stockQuantity ?? 0}</span>
                          {(product.stockQuantity ?? 0) <= 5 && (product.stockQuantity ?? 0) > 0 && <span className="text-xs text-yellow-600 font-medium">⚠ Low</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProduct(product)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setStockDialogProduct(product); setStockDelta(''); }} title="Adjust stock"><ChevronUp className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteProductId(product.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by order # or customer..." className="pl-9" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
            </div>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredOrders.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No orders match your filter.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const { label, className } = getStatusBadge(order.status);
                const nextStatuses = NEXT_STATUSES[order.status as OrderStatus] ?? [];
                return (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">Order #{order.id}</p>
                          <p className="text-xs text-gray-500">{order.student?.studentName ?? 'Customer'} · {new Date(order.orderDate).toLocaleDateString()}</p>
                          {order.deliveryAddress && <p className="text-xs text-gray-400 mt-0.5">📍 {order.deliveryAddress}</p>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${className}`}>{label}</span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-0.5 mb-2 text-xs">
                          {order.items.map(item => <div key={item.id} className="flex justify-between text-gray-600"><span>{item.product?.name ?? 'Product'} × {item.quantity}</span><span>R{Number(item.unitPrice * item.quantity).toFixed(2)}</span></div>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t pt-2">
                        <p className="font-bold text-sm">R{Number(order.totalAmount).toFixed(2)}</p>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {/* Show delivery pipeline state */}
                          {['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {order.status === 'DELIVERED' ? 'Delivered ✓' : 'Driver Assigned'}
                            </span>
                          )}
                          {/* Forward to Admin — only if not already forwarded and not terminal */}
                          {!['CANCELLED', 'REFUNDED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
                            forwardedOrderIds.has(order.id) ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Forwarded to Admin
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-duwaz-brown text-duwaz-brown hover:bg-duwaz-brown hover:text-white"
                                onClick={() => setRequestDeliveryOrderId(order.id)}
                              >
                                <Send className="h-3 w-3 mr-1" />Forward to Admin
                              </Button>
                            )
                          )}
                          {nextStatuses.length > 0 && (
                            <Select onValueChange={status => updateOrderMutation.mutate({ id: order.id, status })}>
                              <SelectTrigger className="w-44 h-7 text-xs"><SelectValue placeholder="Update status" /></SelectTrigger>
                              <SelectContent>{nextStatuses.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Messages Tab ── */}
        <TabsContent value="messages">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Admin Communications</h2>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={() => setComposeOpen(true)}>
              <Send className="h-4 w-4 mr-1" />New Message
            </Button>
          </div>
          {messagesLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />)}</div>
          ) : myMessages.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No messages yet.</p>
              <p className="text-sm text-gray-400 mt-1">Send a message to Admin or request delivery from the Orders tab.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {myMessages.map(msg => {
                const isDeliveryReq = msg.messageType === 'DELIVERY_REQUEST';
                const hasReply = !!msg.replyContent;
                const statusColors: Record<string, string> = {
                  UNREAD: 'bg-yellow-100 text-yellow-700',
                  READ: 'bg-gray-100 text-gray-600',
                  REPLIED: 'bg-blue-100 text-blue-700',
                  RESOLVED: 'bg-green-100 text-green-700',
                };
                return (
                  <Card key={msg.id} className={`cursor-pointer hover:shadow-md transition-shadow ${hasReply && msg.status === 'REPLIED' ? 'border-blue-300' : ''}`} onClick={() => setSelectedMessage(msg)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isDeliveryReq && <Truck className="h-4 w-4 text-duwaz-brown flex-shrink-0" />}
                            <p className="font-semibold text-sm truncate">{msg.subject ?? 'No subject'}</p>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(msg.sentAt).toLocaleString()}</p>
                          {hasReply && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">✓ Admin replied</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[msg.status] ?? 'bg-gray-100'}`}>{msg.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Store Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.businessName} className="w-20 h-20 rounded-full object-cover border-2 border-duwaz-brown" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-duwaz-brown/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-duwaz-brown">{shop.businessName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{shop.businessName}</p>
                  <p className="text-gray-500 text-sm">{shop.description}</p>
                  <p className="text-sm text-gray-400 mt-1">Owner: {shop.student?.studentName ?? '—'}</p>
                </div>
              </div>
              <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={openEditShop}><Pencil className="h-4 w-4 mr-2" />Edit Store Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Shop Dialog ── */}
      <Dialog open={editShopOpen} onOpenChange={setEditShopOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Edit Shop</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                {logoPreview ? (
                  <><img src={logoPreview} alt="logo" className="w-20 h-20 rounded-full object-cover border-2 border-duwaz-brown" /><button type="button" onClick={() => { setLogoPreview(null); setShopForm(p => ({ ...p, logoBase64: null })); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></>
                ) : (
                  <button type="button" onClick={() => logoRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center"><Upload className="h-5 w-5 text-gray-400" /><span className="text-xs text-gray-400">Logo</span></button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-sm text-gray-500">Max 2MB. JPG, PNG or WebP.</p>
            </div>
            <div className="space-y-2"><Label>Shop Name</Label><Input value={shopForm.businessName} onChange={e => setShopForm(p => ({ ...p, businessName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={shopForm.description} onChange={e => setShopForm(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditShopOpen(false)}>Cancel</Button>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={handleSaveShop} disabled={isUpdatingShop}>{isUpdatingShop ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Product Dialog ── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                {productImagePreview ? (<><img src={productImagePreview} alt="product" className="w-20 h-20 rounded-lg object-cover border" /><button type="button" onClick={() => { setProductImagePreview(null); setProductForm(p => ({ ...p, imageBase64: null })); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></>) : (<button type="button" onClick={() => productImageRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center"><Upload className="h-5 w-5 text-gray-400" /><span className="text-xs text-gray-400">Image</span></button>)}
              </div>
              <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageChange} />
              <p className="text-sm text-gray-500">Optional. Max 2MB.</p>
            </div>
            <div className="space-y-1"><Label>Name <span className="text-red-500">*</span></Label><Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cheese Chips" /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} className="min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price (R) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                {/* Live fee preview */}
                {productForm.price && Number(productForm.price) > 0 && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-2 space-y-1 text-xs">
                    <p className="font-semibold text-amber-700">💡 Price breakdown for buyers:</p>
                    <div className="flex justify-between text-gray-600">
                      <span>Your product price</span>
                      <span>R{Number(productForm.price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Duwaz platform fee (5%)</span>
                      <span className="text-red-500">−R{(Number(productForm.price) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery fee (10% to rider)</span>
                      <span className="text-amber-600">+R{(Number(productForm.price) * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-duwaz-brown border-t pt-1">
                      <span>You receive (after Duwaz 5%)</span>
                      <span>R{(Number(productForm.price) * 0.95).toFixed(2)}</span>
                    </div>
                    <p className="text-gray-400 text-xs">The delivery fee is charged separately to the customer on top of your price.</p>
                  </div>
                )}
              </div>
              <div className="space-y-1"><Label>Stock Quantity</Label><Input type="number" min="0" value={productForm.stockQuantity} onChange={e => setProductForm(p => ({ ...p, stockQuantity: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Category</Label><select className="w-full border rounded-md py-2 px-3 text-sm" value={productForm.categoryId} onChange={e => setProductForm(p => ({ ...p, categoryId: e.target.value }))}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="space-y-1"><Label>Status</Label><select className="w-full border rounded-md py-2 px-3 text-sm" value={productForm.productStatus} onChange={e => setProductForm(p => ({ ...p, productStatus: e.target.value as ProductStatus }))}><option value="AVAILABLE">Available</option><option value="OUT_OF_STOCK">Out of Stock</option><option value="DISCONTINUED">Discontinued</option></select></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={handleSaveProduct} disabled={isCreatingProduct || isUpdatingProduct}>{isCreatingProduct || isUpdatingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock Adjust Dialog ── */}
      <Dialog open={!!stockDialogProduct} onOpenChange={open => !open && setStockDialogProduct(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Adjust Stock — {stockDialogProduct?.name}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-500">Current stock: <span className="font-bold">{stockDialogProduct?.stockQuantity ?? 0}</span></p>
            <div className="space-y-1"><Label>Adjustment (+ to add, - to reduce)</Label><Input type="number" placeholder="e.g. 10 or -3" value={stockDelta} onChange={e => setStockDelta(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogProduct(null)}>Cancel</Button>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={handleAdjustStock}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteProductId} onOpenChange={open => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>This will permanently delete the product.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Compose Message Dialog ── */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>New Message to Admin</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Subject</Label><Input placeholder="e.g. Pricing query, Product issue..." value={composeSubject} onChange={e => setComposeSubject(e.target.value)} /></div>
            <div className="space-y-1"><Label>Message <span className="text-red-500">*</span></Label><Textarea placeholder="Describe your query or request..." value={composeContent} onChange={e => setComposeContent(e.target.value)} className="min-h-[120px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={() => { if (!composeContent.trim()) { toast({ title: 'Message content required', variant: 'destructive' }); return; } sendMessageMutation.mutate({ subject: composeSubject || 'General Enquiry', content: composeContent }); }} disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? 'Sending...' : <><Send className="h-4 w-4 mr-1" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Request Delivery Confirm ── */}
      <AlertDialog open={!!requestDeliveryOrderId} onOpenChange={open => !open && setRequestDeliveryOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forward Order #{requestDeliveryOrderId} to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the full order details to Admin. Admin will assign a driver and notify them.
              You cannot submit duplicate requests for the same order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-duwaz-brown hover:bg-duwaz-brown/90" onClick={() => requestDeliveryOrderId && requestDeliveryMutation.mutate(requestDeliveryOrderId)}>
              <Send className="h-4 w-4 mr-1" />Forward to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Message Detail Dialog ── */}
      <Dialog open={!!selectedMessage} onOpenChange={open => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedMessage?.subject ?? 'Message'}</DialogTitle></DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs text-gray-400 mb-2">{new Date(selectedMessage.sentAt).toLocaleString()}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">YOUR MESSAGE</p>
                  <pre className="text-sm whitespace-pre-wrap font-sans">{selectedMessage.content}</pre>
                </div>
              </div>
              {selectedMessage.replyContent && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-1">ADMIN REPLY</p>
                  <p className="text-sm">{selectedMessage.replyContent}</p>
                  {selectedMessage.repliedAt && <p className="text-xs text-gray-400 mt-1">{new Date(selectedMessage.repliedAt).toLocaleString()}</p>}
                </div>
              )}
              {!selectedMessage.replyContent && (
                <p className="text-sm text-gray-400 text-center py-2">Awaiting Admin response...</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopDashboardPage;
