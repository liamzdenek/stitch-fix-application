/**
 * Utility functions for the Stitch Fix Client Engagement Acceleration System
 */

import { v4 as uuidv4 } from 'uuid';
import { User } from './models';

/**
 * Generate a UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Calculate the engagement score for a user
 * 
 * The engagement score is calculated based on:
 * - Days since last order (higher impact)
 * - Order count (positive impact)
 * - Average order value (positive impact)
 * - Days since last email (to avoid sending too many emails)
 * 
 * Lower score = higher risk of disengagement
 * 
 * @param user The user to calculate the engagement score for
 * @returns A number between 0 and 100
 */
export function calculateEngagementScore(user: User): number {
  // Calculate days since last order
  const lastOrderDate = new Date(user.lastOrderDate);
  const daysSinceLastOrder = Math.floor(
    (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate order count factor (max 1.0)
  const orderCountFactor = Math.min(user.orderCount / 10, 1.0);

  // Calculate average order value factor (max 1.0)
  const aovFactor = Math.min(user.averageOrderValue / 200, 1.0);

  // Calculate days since last email
  let daysSinceLastEmail = 365; // Default to a year if no email has been sent
  if (user.lastEmailDate) {
    const lastEmailDate = new Date(user.lastEmailDate);
    daysSinceLastEmail = Math.floor(
      (Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Lower score = higher risk of disengagement
  let score = 100;

  // Reduce score based on days since last order (higher impact)
  if (daysSinceLastOrder > 90) {
    score -= 40;
  } else if (daysSinceLastOrder > 60) {
    score -= 30;
  } else if (daysSinceLastOrder > 30) {
    score -= 15;
  }

  // Increase score based on order history
  score += orderCountFactor * 15;
  score += aovFactor * 10;

  // Adjust based on email recency
  if (daysSinceLastEmail < 7) {
    score -= 10; // Don't email too frequently
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Format a date as an ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Create an API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
} {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

/**
 * Delay execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let lastError: Error | undefined;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      if (retries >= maxRetries) {
        break;
      }
      
      const delayMs = initialDelay * Math.pow(2, retries - 1);
      await delay(delayMs);
    }
  }

  throw lastError;
}