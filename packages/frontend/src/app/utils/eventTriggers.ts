/**
 * Utility functions for triggering events on users
 */

import { User, OrderItem } from '../services/api';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';

/**
 * Hook to get event trigger functions
 */
export function useEventTriggers() {
  const { api } = useApi();
  const { updateUser } = useUser();

  /**
   * Create a new order for a user
   * @param userId User ID
   * @param items Order items
   * @param totalValue Total order value
   * @returns The created order
   */
  const createOrder = async (
    userId: string,
    items: OrderItem[],
    totalValue: number
  ) => {
    return api.order.createOrder({
      userId,
      items,
      totalValue,
    });
  };

  /**
   * Update a user's last order date to now
   * @param userId User ID
   * @param orderValue Order value
   * @returns The updated user
   */
  const updateLastOrderDate = async (
    userId: string,
    orderValue: number = 100
  ) => {
    // First, get the current user
    const user = await api.user.getUser(userId);
    
    // Calculate new values
    const newOrderCount = (user.orderCount || 0) + 1;
    const previousTotal = (user.averageOrderValue || 0) * (user.orderCount || 0);
    const newAverageOrderValue = (previousTotal + orderValue) / newOrderCount;
    
    // Update the user with the new values
    return updateUser(userId, {
      lastOrderDate: new Date().toISOString(),
      orderCount: newOrderCount,
      averageOrderValue: newAverageOrderValue,
    });
  };

  /**
   * Force generate an email for a user by temporarily lowering their engagement score
   * @param userId User ID
   * @returns The updated user
   */
  const forceGenerateEmail = async (userId: string) => {
    // First, get the current user
    const user = await api.user.getUser(userId);
    
    // Store the original engagement score
    const originalScore = user.engagementScore;
    
    // Temporarily set the engagement score to a low value to trigger email generation
    await updateUser(userId, {
      engagementScore: 10, // Very low score to ensure email generation
    });
    
    // Wait a bit for the email to be generated
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restore the original engagement score
    return updateUser(userId, {
      engagementScore: originalScore,
    });
  };

  return {
    createOrder,
    updateLastOrderDate,
    forceGenerateEmail,
  };
}