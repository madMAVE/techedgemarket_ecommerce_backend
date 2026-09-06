export type UserRole = "admin" | "manager" | "sales" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company?: string;
  phone?: string;
  gstin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  brand: string;
  model: string;
  partNumber: string;
  sku: string;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  leadTime: string;
  keywords: string[];
  featured: boolean;
  badge?: string;
  specs: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  poReference?: string;
  shippingAddress: Address;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  location: string;
  supplier: string;
  lastRestocked: string;
  status: StockStatus;
  updatedAt: string;
}

export type ProcurementStatus =
  | "draft" | "submitted" | "approved"
  | "ordered" | "received" | "cancelled";

export interface ProcurementItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ProcurementOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: ProcurementItem[];
  status: ProcurementStatus;
  totalAmount: number;
  currency: string;
  requestedBy: string;
  requestDate: string;
  approvedDate?: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProspectStatus =
  | "new" | "contacted" | "qualified" | "proposal"
  | "negotiation" | "won" | "lost";

export interface Prospect {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: ProspectStatus;
  source: string;
  value: number;
  probability: number;
  assignedTo: string;
  requirements?: string;
  notes?: string;
  nextFollowUp?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceStatus = "open" | "in_progress" | "resolved" | "closed";
export type ServicePriority = "low" | "medium" | "high" | "critical";

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  category: string;
  customerId: string;
  customerName: string;
  company: string;
  assignedTo?: string;
  estimatedHours: number;
  actualHours?: number;
  resolvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}
