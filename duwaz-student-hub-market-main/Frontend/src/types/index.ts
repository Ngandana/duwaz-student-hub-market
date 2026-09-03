// ── Backend entity types ───────────────────────────────────────────────────────
// These match the Spring Boot entity classes 1-to-1.

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Business {
  id: number;
  businessName: string;
  description: string;
  logoUrl?: string;
  shopCategory?: string;
  phoneNumber?: string;
  operatingHours?: string;
  student?: Student;
}

export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
  productStatus?: ProductStatus;
  category?: Category;
  business?: Business;
}

export interface Student {
  id: number;
  studentName: string;
  studentNumber: string;
  locationAddress?: string;
  profileImage?: string;
  businesses?: Business[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface Order {
  id: number;
  student?: Student;
  business?: Business;
  items?: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  pointsRedeemed?: number;
  orderDate: string;
  status: OrderStatus;
  deliveryAddress?: string;
  cancellationReason?: string;
}

export interface Review {
  id: number;
  studentId: number;
  productId: number;
  rating: number;
  comment: string;
  reviewDate: string;  // ISO date string from backend
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
}

export type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Transaction {
  id: number;
  student?: Student;
  product?: Product;
  amount: number;
  transactionDate: string; // ISO date string from backend
  status: TransactionStatus;
}

export interface DeliveryDriver {
  deliveryDriverId: number;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  vehicleType: string;
  licenseNumber: string;
  deliveryCount: number;
  rating: number;
  status?: DriverStatus;
  active?: boolean;
  profileImage?: string;
  emergencyContact?: string;
}

export type DriverStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'OFFLINE'
  | 'ON_BREAK';

export type DeliveryStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'DRIVER_ACCEPTED'
  | 'TRAVELLING_TO_SHOP'
  | 'PICKED_UP'
  | 'TRAVELLING_TO_CUSTOMER'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED';

export interface DeliveryAssignment {
  id: number;
  order?: Order;
  driver?: DeliveryDriver;
  deliveryStatus: DeliveryStatus;
  assignedAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  failureReason?: string;
  proofOfDelivery?: string;
  otpCode?: string;
  otpVerified?: boolean;
}

export type MessageType = 'MESSAGE' | 'DELIVERY_REQUEST' | 'ADMIN_REPLY' | 'DRIVER_MESSAGE' | 'DRIVER_REPLY';
export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'RESOLVED';

export interface StoreMessage {
  id: number;
  business?: Business;
  driver?: DeliveryDriver;
  order?: Order;
  messageType: MessageType;
  status: MessageStatus;
  subject?: string;
  content: string;
  replyContent?: string;
  sentAt: string;
  readAt?: string;
  repliedAt?: string;
  fromAdmin: boolean;
}

// ── Frontend-only types ────────────────────────────────────────────────────────
// Used for cart state and UI — not sent to the backend directly.

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  shopName: string;
  shopId?: number;
}
