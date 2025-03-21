/**
 * Stream Processor Lambda Function
 * 
 * This Lambda function processes DynamoDB stream events and publishes them to SNS.
 * It is triggered by DynamoDB Streams and publishes events to SNS for further processing.
 */

import { DynamoDBStreamEvent, DynamoDBRecord, Context, Callback } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { 
  EventType, 
  createEvent,
  User,
  Order
} from '@stitch-fix/shared';

// Initialize clients
const dynamoDb = new DynamoDBClient({
  region: process.env.AWS_REGION
});

const sns = new SNSClient({
  region: process.env.AWS_REGION
});

// SNS Topic ARN from environment variables
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Lambda handler function
 */
export async function handler(
  event: DynamoDBStreamEvent,
  context: Context,
  callback: Callback
): Promise<void> {
  console.log('Processing DynamoDB Stream event:', JSON.stringify(event, null, 2));

  try {
    // Process each record in the stream
    const promises = event.Records.map(processRecord);
    await Promise.all(promises);
    
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully processed ${event.Records.length} records`
      })
    });
  } catch (error) {
    console.error('Error processing DynamoDB Stream event:', error);
    callback(error as Error);
  }
}

/**
 * Process a single DynamoDB record
 */
async function processRecord(record: DynamoDBRecord): Promise<void> {
  // Skip records that are not INSERT or MODIFY
  if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
    console.log(`Skipping ${record.eventName} event`);
    return;
  }

  // Get the table name from the ARN
  const tableName = record.eventSourceARN?.split('/')[1];
  
  if (!tableName) {
    console.error('Could not determine table name from ARN:', record.eventSourceARN);
    return;
  }

  // Process based on table name
  switch (tableName) {
    case process.env.USERS_TABLE_NAME:
      await processUserRecord(record);
      break;
    case process.env.ORDERS_TABLE_NAME:
      await processOrderRecord(record);
      break;
    default:
      console.log(`Ignoring event from unknown table: ${tableName}`);
  }
}

/**
 * Process a user record
 */
async function processUserRecord(record: DynamoDBRecord): Promise<void> {
  if (!record.dynamodb?.NewImage) {
    console.error('No NewImage in record:', record);
    return;
  }

  // Convert DynamoDB record to User object
  const user = unmarshallUser(record.dynamodb.NewImage);
  
  // Determine event type
  const eventType = record.eventName === 'INSERT' 
    ? EventType.USER_CREATED 
    : EventType.USER_UPDATED;
  
  // Create event
  const event = createEvent(eventType, user);
  
  // Publish to SNS
  await publishToSNS(event);
}

/**
 * Process an order record
 */
async function processOrderRecord(record: DynamoDBRecord): Promise<void> {
  if (!record.dynamodb?.NewImage) {
    console.error('No NewImage in record:', record);
    return;
  }

  // Convert DynamoDB record to Order object
  const order = unmarshallOrder(record.dynamodb.NewImage);
  
  // Determine event type
  const eventType = record.eventName === 'INSERT' 
    ? EventType.ORDER_CREATED 
    : EventType.ORDER_UPDATED;
  
  // Create event
  const event = createEvent(eventType, order);
  
  // Publish to SNS
  await publishToSNS(event);
}

/**
 * Publish an event to SNS
 */
async function publishToSNS(event: any): Promise<void> {
  if (!SNS_TOPIC_ARN) {
    throw new Error('SNS_TOPIC_ARN environment variable is not set');
  }

  const params = {
    TopicArn: SNS_TOPIC_ARN,
    Message: JSON.stringify(event),
    MessageAttributes: {
      'event-type': {
        DataType: 'String',
        StringValue: event.type
      }
    }
  };

  try {
    const command = new PublishCommand(params);
    const result = await sns.send(command);
    console.log('Successfully published to SNS:', result.MessageId);
  } catch (error) {
    console.error('Error publishing to SNS:', error);
    throw error;
  }
}

/**
 * Convert DynamoDB record to User object
 * 
 * Note: This is a simplified implementation. In a real application,
 * you would use the AWS SDK's unmarshall function.
 */
function unmarshallUser(record: any): User {
  // Simplified implementation
  return {
    userId: record.userId.S,
    email: record.email.S,
    name: record.name.S,
    lastOrderDate: record.lastOrderDate.S,
    orderCount: parseInt(record.orderCount.N),
    averageOrderValue: parseFloat(record.averageOrderValue.N),
    preferredCategories: record.preferredCategories.L.map((item: any) => item.S),
    engagementScore: record.engagementScore?.N ? parseFloat(record.engagementScore.N) : undefined,
    lastEmailDate: record.lastEmailDate?.S,
    createdAt: record.createdAt.S,
    updatedAt: record.updatedAt.S
  };
}

/**
 * Convert DynamoDB record to Order object
 * 
 * Note: This is a simplified implementation. In a real application,
 * you would use the AWS SDK's unmarshall function.
 */
function unmarshallOrder(record: any): Order {
  // Simplified implementation
  return {
    orderId: record.orderId.S,
    userId: record.userId.S,
    orderDate: record.orderDate.S,
    totalValue: parseFloat(record.totalValue.N),
    items: record.items.L.map((item: any) => ({
      itemId: item.M.itemId.S,
      productId: item.M.productId.S,
      name: item.M.name.S,
      category: item.M.category.S,
      price: parseFloat(item.M.price.N),
      quantity: parseInt(item.M.quantity.N)
    })),
    status: record.status.S,
    createdAt: record.createdAt.S
  };
}
