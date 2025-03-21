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
  createApiResponse,
  EventType,
  createEvent
} from '@stitch-fix/shared';
import serverless from 'serverless-http';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand, 
  DeleteCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

// Get table names from environment variables
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME || '';
const EMAILS_TABLE_NAME = process.env.EMAILS_TABLE_NAME || '';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';

// Validate environment variables
if (!USERS_TABLE_NAME || !EMAILS_TABLE_NAME || !SNS_TOPIC_ARN) {
  console.error('Required environment variables are missing');
  process.exit(1);
}

// Helper function to publish events to SNS
async function publishEvent(eventType: EventType, payload: any) {
  const event = createEvent(eventType, payload);
  
  try {
    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: JSON.stringify(event),
      MessageAttributes: {
        'event-type': {
          DataType: 'String',
          StringValue: eventType
        }
      }
    });
    
    const result = await snsClient.send(command);
    console.log(`Published event to SNS: ${result.MessageId}`);
  } catch (error) {
    console.error('Error publishing event to SNS:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(createApiResponse(true, { status: 'healthy' }));
});

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: USERS_TABLE_NAME
    });
    
    const result = await docClient.send(command);
    const users = result.Items as User[];
    
    res.json(createApiResponse(true, users));
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json(createApiResponse(false, null, 'Error getting users'));
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const command = new GetCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId: req.params.userId
      }
    });
    
    const result = await docClient.send(command);
    const user = result.Item as User;
    
    if (!user) {
      return res.status(404).json(createApiResponse(false, null, 'User not found'));
    }
    
    res.json(createApiResponse(true, user));
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json(createApiResponse(false, null, 'Error getting user'));
  }
});

app.post('/api/users', async (req, res) => {
  const { email, name, lastOrderDate, orderCount, averageOrderValue, preferredCategories } = req.body;
  
  // Validate required fields
  if (!email || !name || !lastOrderDate || orderCount === undefined || averageOrderValue === undefined) {
    return res.status(400).json(createApiResponse(false, null, 'Missing required fields'));
  }
  
  try {
    // Create new user
    const now = new Date().toISOString();
    const userId = uuidv4();
    const user: User = {
      userId,
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
    
    // Save user to DynamoDB
    const command = new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: user
    });
    
    await docClient.send(command);
    
    // Publish user created event
    await publishEvent(EventType.USER_CREATED, user);
    
    res.status(201).json(createApiResponse(true, user));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json(createApiResponse(false, null, 'Error creating user'));
  }
});

app.put('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { email, name, lastOrderDate, orderCount, averageOrderValue, preferredCategories, engagementScore } = req.body;
  
  try {
    // Get the current user
    const getCommand = new GetCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId
      }
    });
    
    const result = await docClient.send(getCommand);
    const user = result.Item as User;
    
    if (!user) {
      return res.status(404).json(createApiResponse(false, null, 'User not found'));
    }
    
    // Update user fields
    if (email) user.email = email;
    if (name) user.name = name;
    if (lastOrderDate) user.lastOrderDate = lastOrderDate;
    if (orderCount !== undefined) user.orderCount = orderCount;
    if (averageOrderValue !== undefined) user.averageOrderValue = averageOrderValue;
    if (preferredCategories) user.preferredCategories = preferredCategories;
    
    // Update timestamps
    user.updatedAt = new Date().toISOString();
    
    // If engagementScore is provided, use it directly; otherwise recalculate
    if (engagementScore !== undefined) {
      user.engagementScore = engagementScore;
      console.log(`Using provided engagement score: ${engagementScore}`);
    } else {
      user.engagementScore = calculateEngagementScore(user);
      console.log(`Calculated engagement score: ${user.engagementScore}`);
    }
    
    // Update user in DynamoDB
    const updateCommand = new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: user
    });
    
    await docClient.send(updateCommand);
    
    // Publish user updated event
    await publishEvent(EventType.USER_UPDATED, user);
    
    res.json(createApiResponse(true, user));
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json(createApiResponse(false, null, 'Error updating user'));
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Delete user from DynamoDB
    const command = new DeleteCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId
      },
      ReturnValues: 'ALL_OLD'
    });
    
    const result = await docClient.send(command);
    
    if (!result.Attributes) {
      return res.status(404).json(createApiResponse(false, null, 'User not found'));
    }
    
    // Publish user deleted event
    await publishEvent(EventType.USER_DELETED, { userId });
    
    res.json(createApiResponse(true, { deleted: true }));
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json(createApiResponse(false, null, 'Error deleting user'));
  }
});

// Email endpoints
app.get('/api/emails', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: EMAILS_TABLE_NAME
    });
    
    const result = await docClient.send(command);
    const emails = result.Items as Email[];
    
    res.json(createApiResponse(true, emails));
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json(createApiResponse(false, null, 'Error getting emails'));
  }
});

app.get('/api/emails/:emailId', async (req, res) => {
  try {
    const command = new GetCommand({
      TableName: EMAILS_TABLE_NAME,
      Key: {
        emailId: req.params.emailId
      }
    });
    
    const result = await docClient.send(command);
    const email = result.Item as Email;
    
    if (!email) {
      return res.status(404).json(createApiResponse(false, null, 'Email not found'));
    }
    
    res.json(createApiResponse(true, email));
  } catch (error) {
    console.error('Error getting email:', error);
    res.status(500).json(createApiResponse(false, null, 'Error getting email'));
  }
});

app.get('/api/users/:userId/emails', async (req, res) => {
  try {
    const command = new QueryCommand({
      TableName: EMAILS_TABLE_NAME,
      IndexName: 'userIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': req.params.userId
      }
    });
    
    const result = await docClient.send(command);
    const emails = result.Items as Email[];
    
    res.json(createApiResponse(true, emails));
  } catch (error) {
    console.error('Error getting user emails:', error);
    res.status(500).json(createApiResponse(false, null, 'Error getting user emails'));
  }
});

// Order endpoints (simplified for demo)
app.post('/api/orders', async (req, res) => {
  const { userId, items, totalValue } = req.body;
  
  // Validate required fields
  if (!userId || !items || !totalValue) {
    return res.status(400).json(createApiResponse(false, null, 'Missing required fields'));
  }
  
  try {
    // Get the current user
    const getUserCommand = new GetCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId
      }
    });
    
    const userResult = await docClient.send(getUserCommand);
    const user = userResult.Item as User;
    
    if (!user) {
      return res.status(404).json(createApiResponse(false, null, 'User not found'));
    }
    
    // Update user order data
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
    
    // Update user in DynamoDB
    const updateUserCommand = new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: user
    });
    
    await docClient.send(updateUserCommand);
    
    // Create order
    const orderId = uuidv4();
    const order = {
      orderId,
      userId,
      orderDate: user.lastOrderDate,
      totalValue,
      items,
      status: OrderStatus.CREATED,
      createdAt: user.lastOrderDate
    };
    
    // Publish order created event
    await publishEvent(EventType.ORDER_CREATED, order);
    
    // Publish user updated event
    await publishEvent(EventType.USER_UPDATED, user);
    
    // Return success
    res.status(201).json(createApiResponse(true, order));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json(createApiResponse(false, null, 'Error creating order'));
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
  });
}

// Export the serverless handler for AWS Lambda
export const handler = serverless(app);
