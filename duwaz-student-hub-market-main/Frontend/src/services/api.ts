import type {
  Category,
  Product,
  Business,
  Student,
  Order,
  Review,
  Reward,
  Transaction,
  DeliveryDriver,
  DeliveryAssignment,
  DeliveryStatus,
  DriverStatus,
  StoreMessage,
  MessageStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function getToken(): string | null {
  return localStorage.getItem('duwaz_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Redirect to login on 401
  if (response.status === 401) {
    localStorage.removeItem('duwaz_token');
    localStorage.removeItem('duwaz_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  userId: number;
  studentName: string;
  email: string;
}

export const authApi = {
  register: (data: {
    studentName: string;
    studentNumber: string;
    email: string;
    password: string;
    locationAddress?: string;
  }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => request<Category[]>('/api/categories'),
  getById: (id: number) => request<Category>(`/api/categories/${id}`),
  create: (data: Omit<Category, 'id'>) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Category>) =>
    request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/categories/${id}`, { method: 'DELETE' }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: () => request<Product[]>('/api/products'),
  getById: (id: number) => request<Product>(`/api/products/${id}`),
  getByBusiness: (businessId: number) => request<Product[]>(`/api/products/business/${businessId}`),
  create: (data: Omit<Product, 'id'>) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id: number, delta: number) =>
    request<Product>(`/api/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ delta }),
    }),
};

// ── Businesses (Shops) ────────────────────────────────────────────────────────
export const businessesApi = {
  getAll: () => request<Business[]>('/api/businesses'),
  getById: (id: number) => request<Business>(`/api/businesses/${id}`),
  getMyShop: () => request<Business>('/api/businesses/mine'),
  create: (data: Omit<Business, 'id'>) =>
    request<Business>('/api/businesses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Business>) =>
    request<Business>(`/api/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/businesses/${id}`, { method: 'DELETE' }),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  getAll: () => request<Student[]>('/Student/getall'),
  getById: (id: number) => request<Student>(`/Student/read/${id}`),
  create: (data: Omit<Student, 'id'>) =>
    request<Student>('/Student/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Student) =>
    request<Student>('/Student/update', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/Student/delete/${id}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  // Customer
  getMyOrders: () => request<Order[]>('/api/orders/my'),
  cancelOrder: (id: number, reason?: string) =>
    request<Order>(`/api/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  create: (data: Omit<Order, 'id'>) =>
    request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Shop owner
  getShopOrders: (page = 0, size = 20) =>
    request<{ content: Order[]; totalElements: number; totalPages: number }>(
      `/api/orders/shop?page=${page}&size=${size}`
    ),

  // Admin
  getAll: (page = 0, size = 20) =>
    request<{ content: Order[]; totalElements: number; totalPages: number }>(
      `/api/orders?page=${page}&size=${size}`
    ),
  getById: (id: number) => request<Order>(`/api/orders/${id}`),
  getByStudent: (studentId: number) => request<Order[]>(`/api/orders/student/${studentId}`),
  getByStatus: (status: string) => request<Order[]>(`/api/orders/status/${status}`),
  updateStatus: (id: number, status: string, reason?: string) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),
  delete: (id: number) => request<null>(`/api/orders/${id}`, { method: 'DELETE' }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    request<{
      totalUsers: number;
      totalShops: number;
      totalProducts: number;
      totalOrders: number;
      pendingOrders: number;
      confirmedOrders: number;
      preparingOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
      totalDrivers: number;
      availableDrivers: number;
      busyDrivers: number;
      outForDelivery: number;
      readyForPickup: number;
    }>('/api/admin/stats'),
  getUsers: () => request<Student[]>('/api/admin/users'),
  updateUserRole: (id: number, role: string) =>
    request<Student>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// ── Shop Stats ────────────────────────────────────────────────────────────────
export interface ShopStats {
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  discontinuedProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  totalRevenue: number;
}

export const shopApi = {
  getStats: () => request<ShopStats>('/api/shops/stats'),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesApi = {
  // Shop owner
  send: (subject: string, content: string) =>
    request<StoreMessage>('/api/messages/send', { method: 'POST', body: JSON.stringify({ subject, content }) }),
  requestDelivery: (orderId: number) =>
    request<StoreMessage>(`/api/messages/request-delivery/${orderId}`, { method: 'POST' }),
  getMyMessages: () => request<StoreMessage[]>('/api/messages/mine'),

  // Driver
  getMyDriverMessages: () => request<StoreMessage[]>('/api/messages/driver/mine'),
  getDriverUnreadCount: () => request<{ unreadCount: number }>('/api/messages/driver/unread-count'),
  driverReply: (id: number, replyContent: string) =>
    request<StoreMessage>(`/api/messages/driver/${id}/reply`, { method: 'PUT', body: JSON.stringify({ replyContent }) }),
  driverMarkRead: (id: number) =>
    request<StoreMessage>(`/api/messages/driver/${id}/read`, { method: 'PUT' }),

  // Admin
  getAll: (status?: string) =>
    request<StoreMessage[]>(`/api/messages${status && status !== 'ALL' ? `?status=${status}` : ''}`),
  getUnreadCount: () => request<{ unreadCount: number }>('/api/messages/unread-count'),
  markRead: (id: number) => request<StoreMessage>(`/api/messages/${id}/read`, { method: 'PUT' }),
  reply: (id: number, replyContent: string) =>
    request<StoreMessage>(`/api/messages/${id}/reply`, { method: 'PUT', body: JSON.stringify({ replyContent }) }),
  resolve: (id: number) => request<StoreMessage>(`/api/messages/${id}/resolve`, { method: 'PUT' }),
  sendToDriver: (driverId: number, subject: string, content: string, orderId?: number) =>
    request<StoreMessage>('/api/messages/send-to-driver', {
      method: 'POST',
      body: JSON.stringify({ driverId, subject, content, ...(orderId ? { orderId } : {}) }),
    }),
  forwardToDriver: (messageId: number, driverId: number) =>
    request<StoreMessage>(`/api/messages/${messageId}/forward-to-driver/${driverId}`, { method: 'POST' }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getAll: () => request<Review[]>('/api/reviews'),
  getById: (id: number) => request<Review>(`/api/reviews/${id}`),
  getByProduct: (productId: number) => request<Review[]>(`/api/reviews/product/${productId}`),
  getByStudent: (studentId: number) => request<Review[]>(`/api/reviews/student/${studentId}`),
  create: (data: Omit<Review, 'id'>) =>
    request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/reviews/${id}`, { method: 'DELETE' }),
};

// ── Rewards ───────────────────────────────────────────────────────────────────
export const rewardsApi = {
  getAll: () => request<Reward[]>('/api/rewards'),
  getById: (id: number) => request<Reward>(`/api/rewards/${id}`),
  create: (data: Omit<Reward, 'id'>) =>
    request<Reward>('/api/rewards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Reward>) =>
    request<Reward>(`/api/rewards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/rewards/${id}`, { method: 'DELETE' }),
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  getAll: () => request<Transaction[]>('/api/transactions'),
  getById: (id: number) => request<Transaction>(`/api/transactions/${id}`),
  getByStudent: (studentId: number) =>
    request<Transaction[]>(`/api/transactions/student/${studentId}`),
  getMySummary: () => request<any>('/api/transactions/my/summary'),
  getByStatus: (status: string) => request<Transaction[]>(`/api/transactions/status/${status}`),
  create: (data: Omit<Transaction, 'id'>) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<null>(`/api/transactions/${id}`, { method: 'DELETE' }),
};

// ── Driver Auth ───────────────────────────────────────────────────────────────
export interface DriverAuthResponse {
  token: string;
  driverId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

export const driverAuthApi = {
  login: (data: { email: string; password: string }) =>
    request<DriverAuthResponse>('/api/auth/driver/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    contactNumber: string;
    vehicleType: string;
    licenseNumber: string;
    emergencyContact?: string;
  }) =>
    request<DriverAuthResponse>('/api/auth/driver/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Deliveries ────────────────────────────────────────────────────────────────
export const deliveriesApi = {
  // Admin
  getAllDrivers: () => request<DeliveryDriver[]>('/api/deliveries/drivers'),
  getAvailableDrivers: () => request<DeliveryDriver[]>('/api/deliveries/drivers/available'),
  assignDriver: (orderId: number, driverId: number) =>
    request<DeliveryAssignment>('/api/deliveries/assign', {
      method: 'POST',
      body: JSON.stringify({ orderId, driverId }),
    }),
  getAllAssignments: () => request<DeliveryAssignment[]>('/api/deliveries'),
  getAssignmentByOrder: (orderId: number) =>
    request<DeliveryAssignment>(`/api/deliveries/order/${orderId}`),

  // Driver
  getMyDeliveries: () => request<DeliveryAssignment[]>('/api/deliveries/my'),
  getMyActiveDeliveries: () => request<DeliveryAssignment[]>('/api/deliveries/my/active'),
  acceptDelivery: (assignmentId: number) =>
    request<DeliveryAssignment>(`/api/deliveries/${assignmentId}/accept`, { method: 'POST' }),
  getMyEarnings: () => request<any>('/api/deliveries/my/earnings'),
  updateDeliveryStatus: (id: number, status: DeliveryStatus, notes?: string, proofOfDelivery?: string) =>
    request<DeliveryAssignment>(`/api/deliveries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, proofOfDelivery }),
    }),
  verifyOtp: (id: number, otp: string) =>
    request<DeliveryAssignment>(`/api/deliveries/${id}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),
  updateMyStatus: (status: DriverStatus) =>
    request<DeliveryDriver>('/api/deliveries/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  updateMyLocation: (latitude: number, longitude: number) =>
    request<DeliveryDriver>('/api/deliveries/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude }),
    }),
  getMyProfile: () => request<DeliveryDriver>('/api/deliveries/profile'),
  updateMyProfile: (data: Partial<DeliveryDriver> & { profileImage?: string }) =>
    request<DeliveryDriver>('/api/deliveries/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Tracking (customer-facing) ────────────────────────────────────────────────
export interface TrackingResponse {
  // Order
  orderId: number;
  orderStatus: string;
  totalAmount: number;
  orderDate: string;
  deliveryAddress?: string;
  shopName?: string;
  shopPhone?: string;
  // Delivery assignment
  assignmentId?: number;
  deliveryStatus?: string;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  failureReason?: string;
  otpVerified?: boolean;
  otpCode?: string;       // shown to customer to give to driver
  // Driver
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  driverRating?: number;
  // Live location
  driverLatitude?: number;
  driverLongitude?: number;
  locationUpdatedAt?: string;
  // Stage info
  currentStage: number;       // 1-5
  currentStageLabel: string;
  estimatedArrivalMinutes?: number; // null/undefined when not yet calculable
}

export const trackingApi = {
  getOrderTracking: (orderId: number) =>
    request<TrackingResponse>(`/api/tracking/order/${orderId}`),
};

// ── Delivery Drivers (legacy CRUD) ────────────────────────────────────────────
export const driversApi = {
  getAll: () => request<DeliveryDriver[]>('/api/delivery-drivers'),
  getById: (id: number) => request<DeliveryDriver>(`/api/delivery-drivers/${id}`),
  create: (data: Omit<DeliveryDriver, 'deliveryDriverId'>) =>
    request<DeliveryDriver>('/api/delivery-drivers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<DeliveryDriver>) =>
    request<DeliveryDriver>(`/api/delivery-drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<null>(`/api/delivery-drivers/${id}`, { method: 'DELETE' }),
};
