/**
 * Backend API for the Stitch Fix Client Engagement Acceleration System
 *
 * This API provides endpoints for managing users and emails.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Email,
  EmailStatus,
  OrderStatus,
  calculateEngagementScore,
  createApiResponse
} from '@stitch-fix/shared';
import serverless from 'serverless-http';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// In-memory data store (for demo purposes)
// In a real application, this would be replaced with DynamoDB
const users: User[] = [];
const emails: Email[] = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(createApiResponse(true, { status: 'healthy' }));
});

// User endpoints
app.get('/api/users', (req, res) => {
  res.json(createApiResponse(true, users));
});

app.get('/api/users/:userId', (req, res) => {
  const user = users.find(u => u.userId === req.params.userId);
  if (!user) {
    return res.status(404).json(createApiResponse(false, null, 'User not found'));
  }
  res.json(createApiResponse(true, user));
});

app.post('/api/users', (req, res) => {
  const { email, name, lastOrderDate, orderCount, averageOrderValue, preferredCategories } = req.body;
  
  // Validate required fields
  if (!email || !name || !lastOrderDate || orderCount === undefined || averageOrderValue === undefined) {
    return res.status(400).json(createApiResponse(false, null, 'Missing required fields'));
  }
  
  // Create new user
  const now = new Date().toISOString();
  const user: User = {
    userId: uuidv4(),
    email,
    name,
    lastOrderDate,
    orderCount,
    averageOrderValue,
    preferredCategories: preferredCategories || [],
    createdAt: now,
    updatedAt: now
  };
  
  // Calculate engagement score
  const engagementScore = calculateEngagementScore(user);
  user.engagementScore = engagementScore;
  
  // Add user to store
  users.push(user);
  
  res.status(201).json(createApiResponse(true, user));
});

app.put('/api/users/:userId', (req, res) => {
  const userIndex = users.findIndex(u => u.userId === req.params.userId);
  if (userIndex === -1) {
    return res.status(404).json(createApiResponse(false, null, 'User not found'));
  }
  
  const user = users[userIndex];
  const { email, name, lastOrderDate, orderCount, averageOrderValue, preferredCategories } = req.body;
  
  // Update user fields
  if (email) user.email = email;
  if (name) user.name = name;
  if (lastOrderDate) user.lastOrderDate = lastOrderDate;
  if (orderCount !== undefined) user.orderCount = orderCount;
  if (averageOrderValue !== undefined) user.averageOrderValue = averageOrderValue;
  if (preferredCategories) user.preferredCategories = preferredCategories;
  
  // Update timestamps
  user.updatedAt = new Date().toISOString();
  
  // Recalculate engagement score
  user.engagementScore = calculateEngagementScore(user);
  
  // Update user in store
  users[userIndex] = user;
  
  res.json(createApiResponse(true, user));
});

app.delete('/api/users/:userId', (req, res) => {
  const userIndex = users.findIndex(u => u.userId === req.params.userId);
  if (userIndex === -1) {
    return res.status(404).json(createApiResponse(false, null, 'User not found'));
  }
  
  // Remove user from store
  users.splice(userIndex, 1);
  
  res.json(createApiResponse(true, { deleted: true }));
});

// Email endpoints
app.get('/api/emails', (req, res) => {
  res.json(createApiResponse(true, emails));
});

app.get('/api/emails/:emailId', (req, res) => {
  const email = emails.find(e => e.emailId === req.params.emailId);
  if (!email) {
    return res.status(404).json(createApiResponse(false, null, 'Email not found'));
  }
  res.json(createApiResponse(true, email));
});

app.get('/api/users/:userId/emails', (req, res) => {
  const userEmails = emails.filter(e => e.userId === req.params.userId);
  res.json(createApiResponse(true, userEmails));
});

// Order endpoints (simplified for demo)
app.post('/api/orders', (req, res) => {
  const { userId, items, totalValue } = req.body;
  
  // Validate required fields
  if (!userId || !items || !totalValue) {
    return res.status(400).json(createApiResponse(false, null, 'Missing required fields'));
  }
  
  // Find user
  const userIndex = users.findIndex(u => u.userId === userId);
  if (userIndex === -1) {
    return res.status(404).json(createApiResponse(false, null, 'User not found'));
  }
  
  // Update user order data
  const user = users[userIndex];
  user.orderCount += 1;
  user.lastOrderDate = new Date().toISOString();
  
  // Update average order value
  const totalOrders = user.orderCount;
  const previousTotal = user.averageOrderValue * (totalOrders - 1);
  user.averageOrderValue = (previousTotal + totalValue) / totalOrders;
  
  // Update timestamps
  user.updatedAt = new Date().toISOString();
  
  // Recalculate engagement score
  user.engagementScore = calculateEngagementScore(user);
  
  // Update user in store
  users[userIndex] = user;
  
  // Return success
  res.status(201).json(createApiResponse(true, {
    orderId: uuidv4(),
    userId,
    orderDate: user.lastOrderDate,
    totalValue,
    items,
    status: OrderStatus.CREATED,
    createdAt: user.lastOrderDate
  }));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
  });
}

// Export the serverless handler for AWS Lambda
export const handler = serverless(app);
