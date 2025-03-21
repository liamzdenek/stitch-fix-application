/**
 * Zod schemas for validation in the Stitch Fix Client Engagement Acceleration System
 */

import { z } from 'zod';
import { EmailStatus, OrderStatus } from './models';

/**
 * User schema for validation
 */
export const UserSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  lastOrderDate: z.string().datetime(),
  orderCount: z.number().int().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  preferredCategories: z.array(z.string()),
  engagementScore: z.number().nonnegative().optional(),
  lastEmailDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Email schema for validation
 */
export const EmailSchema = z.object({
  emailId: z.string().uuid(),
  userId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  generatedAt: z.string().datetime(),
  engagementScoreAtTime: z.number().nonnegative(),
  status: z.nativeEnum(EmailStatus),
  createdAt: z.string().datetime()
});

/**
 * Order item schema for validation
 */
export const OrderItemSchema = z.object({
  itemId: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive()
});

/**
 * Order schema for validation
 */
export const OrderSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  orderDate: z.string().datetime(),
  totalValue: z.number().nonnegative(),
  items: z.array(OrderItemSchema),
  status: z.nativeEnum(OrderStatus),
  createdAt: z.string().datetime()
});

/**
 * Create user request schema
 */
export const CreateUserRequestSchema = UserSchema.omit({
  userId: true,
  engagementScore: true,
  lastEmailDate: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Update user request schema
 */
export const UpdateUserRequestSchema = UserSchema.partial().omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

/**
 * API response schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime()
  });

// Type inference helpers - renamed to avoid conflicts with models.ts
export type UserSchema = z.infer<typeof UserSchema>;
export type EmailSchema = z.infer<typeof EmailSchema>;
export type OrderSchema = z.infer<typeof OrderSchema>;
export type OrderItemSchema = z.infer<typeof OrderItemSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type ApiResponseSchema<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};