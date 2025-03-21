/**
 * Data models for the Stitch Fix Client Engagement Acceleration System
 */

/**
 * User model representing a customer in the system
 */
export interface User {
  userId: string;
  email: string;
  name: string;
  lastOrderDate: string;
  orderCount: number;
  averageOrderValue: number;
  preferredCategories: string[];
  engagementScore?: number;
  lastEmailDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email model representing a generated email
 */
export interface Email {
  emailId: string;
  userId: string;
  subject: string;
  content: string;
  generatedAt: string;
  engagementScoreAtTime: number;
  status: EmailStatus;
  createdAt: string;
}

/**
 * Status of an email
 */
export enum EmailStatus {
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  FAILED = 'FAILED'
}

/**
 * Order model representing a customer order
 */
export interface Order {
  orderId: string;
  userId: string;
  orderDate: string;
  totalValue: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

/**
 * Order item model representing an item in an order
 */
export interface OrderItem {
  itemId: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

/**
 * Status of an order
 */
export enum OrderStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}