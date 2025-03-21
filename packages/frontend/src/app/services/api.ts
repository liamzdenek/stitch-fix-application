/**
 * API service for the Stitch Fix Client Engagement Acceleration System
 * Handles all communication with the backend API
 */

// API URL from environment variable or fallback to the deployed API
const API_URL = process.env.NX_API_URL || 'https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod';

// Types
// Define the types here since we can't directly import from the shared package in the frontend
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

export enum EmailStatus {
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  FAILED = 'FAILED'
}

export interface OrderItem {
  itemId: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// API error class
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Make an API request with error handling
 */
async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new ApiError(`API error: ${response.statusText}`, response.status);
    }
    
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new ApiError(data.error || 'Unknown API error', response.status);
    }
    
    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${(error as Error).message}`, 0);
  }
}

/**
 * User API methods
 */
export const userApi = {
  // Get all users
  getUsers: () => apiRequest<User[]>('/api/users'),
  
  // Get a specific user
  getUser: (userId: string) => apiRequest<User>(`/api/users/${userId}`),
  
  // Create a new user
  createUser: (user: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => 
    apiRequest<User>('/api/users', 'POST', user),
  
  // Update a user
  updateUser: (userId: string, user: Partial<User>) => 
    apiRequest<User>(`/api/users/${userId}`, 'PUT', user),
  
  // Delete a user
  deleteUser: (userId: string) => 
    apiRequest<{ deleted: boolean }>(`/api/users/${userId}`, 'DELETE'),
    
  // Get emails for a user
  getUserEmails: (userId: string) => 
    apiRequest<Email[]>(`/api/users/${userId}/emails`),
};

/**
 * Email API methods
 */
export const emailApi = {
  // Get all emails
  getEmails: () => apiRequest<Email[]>('/api/emails'),
  
  // Get a specific email
  getEmail: (emailId: string) => apiRequest<Email>(`/api/emails/${emailId}`),
};

/**
 * Order API methods
 */
export const orderApi = {
  // Create a new order
  createOrder: (order: { 
    userId: string; 
    items: Array<{ 
      itemId: string; 
      productId: string; 
      name: string; 
      category: string; 
      price: number; 
      quantity: number; 
    }>; 
    totalValue: number; 
  }) => apiRequest('/api/orders', 'POST', order),
};

export default {
  user: userApi,
  email: emailApi,
  order: orderApi,
};