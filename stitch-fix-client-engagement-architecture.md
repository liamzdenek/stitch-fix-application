# Stitch Fix Client Engagement Acceleration System - Architecture

## Overview

The Stitch Fix Client Engagement Acceleration System is designed to address a key risk identified in Stitch Fix's annual SEC report: client retention and engagement. The system monitors client engagement, identifies clients at risk of disengagement, and automatically generates personalized emails to re-engage them.

## Business Problem

From Stitch Fix's SEC report, several key risks were identified:

- "We may be unable to retain clients or maintain a high level of engagement with our clients and maintain or increase their spending with us, which could harm our business, financial condition, or operating results."
- "Our growth depends on attracting new clients."
- "We rely on paid marketing to help grow our business, but these efforts may not be successful or cost effective, and such expenses and the success of our efforts may vary from period to period."

This system addresses these risks by:

1. Proactively identifying clients at risk of disengagement
2. Automatically generating personalized re-engagement emails
3. Tracking the effectiveness of engagement efforts
4. Providing a dashboard for monitoring client engagement

## Architecture Principles

The system follows these key principles:

1. **Event-Driven Architecture**: Changes to client data trigger events that flow through the system
2. **12-Factor App Design**: Configuration via environment variables, stateless processes, etc.
3. **Serverless First**: Using AWS Lambda for compute to minimize operational overhead
4. **Durability**: Using SNS/SQS for reliable message delivery
5. **Scalability**: Components scale independently based on load
6. **Observability**: Comprehensive logging and monitoring

## System Components

### Data Storage

**DynamoDB Tables**:
- **Users Table**: Stores user information with stream enabled
  - Partition Key: `userId`
  - Attributes: email, name, lastOrderDate, orderCount, averageOrderValue, preferredCategories, engagementScore, lastEmailDate, createdAt, updatedAt
  - Stream: Enabled with NEW_AND_OLD_IMAGES

- **Emails Table**: Stores generated emails
  - Partition Key: `emailId`
  - Attributes: userId, subject, content, generatedAt, engagementScoreAtTime, status, createdAt
  - GSI: userIdIndex (for querying emails by user)

### Processing Components

**Stream Processor Lambda (TypeScript)**:
- Triggered by DynamoDB Streams from the Users table
- Processes INSERT and MODIFY events
- Publishes events to SNS topic
- Environment Variables:
  - SNS_TOPIC_ARN: ARN of the SNS topic
  - USERS_TABLE_NAME: Name of the Users table
  - ORDERS_TABLE_NAME: Name of the Orders table

**Email Processor Lambda (Go)**:
- Triggered by messages from SQS queue
- Calculates engagement scores for users
- Generates personalized emails using OpenAI
- Sends emails via SES
- Updates user and email records in DynamoDB
- Environment Variables:
  - USERS_TABLE_NAME: Name of the Users table
  - EMAILS_TABLE_NAME: Name of the Emails table
  - OPENAI_API_KEY: API key for OpenAI

### Messaging Components

**SNS Topic**:
- Receives events from Stream Processor
- Delivers events to SQS queue

**SQS Queue**:
- Buffers events for Email Processor
- Provides durability and rate control
- Visibility Timeout: 300 seconds
- Retention Period: 14 days

### API and UI Components

**Backend API (Express.js)**:
- RESTful API for managing users and emails
- Endpoints:
  - GET /health: Health check
  - GET /api/users: List all users
  - GET /api/users/:userId: Get user details
  - POST /api/users: Create a new user
  - PUT /api/users/:userId: Update a user
  - DELETE /api/users/:userId: Delete a user
  - GET /api/emails: List all emails
  - GET /api/emails/:emailId: Get email details
  - GET /api/users/:userId/emails: Get emails for a user
  - POST /api/orders: Create a new order (simplified)

**Frontend UI (React)**:
- Dashboard for monitoring user engagement
- Interface for managing users and viewing emails
- Features:
  - User list with engagement scores
  - User details view
  - Email history view
  - Add new user form

### Infrastructure Components

**S3 Bucket**:
- Hosts the frontend static assets

**CloudFront Distribution**:
- Serves the frontend with HTTPS
- Caches static assets

## Event Flow

1. **User Data Change**:
   - User data is created or updated in DynamoDB
   - DynamoDB Stream generates an event

2. **Stream Processing**:
   - Stream Processor Lambda is triggered by the DynamoDB Stream
   - Lambda processes the event and publishes to SNS topic

3. **Message Delivery**:
   - SNS delivers the event to SQS queue
   - Message is buffered in SQS

4. **Email Processing**:
   - Email Processor Lambda polls SQS queue
   - Lambda calculates engagement score for the user
   - If score is below threshold, Lambda generates and sends email
   - Lambda updates user and email records in DynamoDB

5. **Frontend Display**:
   - Frontend queries Backend API for user and email data
   - Dashboard displays engagement scores and email history

## Engagement Scoring Algorithm

The engagement score is calculated based on:

- **Days since last order** (higher impact):
  - > 90 days: -40 points
  - > 60 days: -30 points
  - > 30 days: -15 points

- **Order count** (positive impact):
  - +15 points * (orderCount / 10), max 15 points

- **Average order value** (positive impact):
  - +10 points * (averageOrderValue / 200), max 10 points

- **Days since last email** (to avoid sending too many emails):
  - < 7 days: -10 points

The score starts at 100 and is adjusted based on these factors. Lower scores indicate higher risk of disengagement, with a threshold of 50 triggering re-engagement emails.

## Email Generation

Emails are generated using OpenAI's GPT model with a prompt that includes:
- User's name
- Last order date
- Number of orders
- Average order value
- Preferred categories

The prompt instructs the model to generate a personalized email that:
1. Is friendly and personalized
2. Mentions the user's previous order history
3. Suggests new items based on their preferred categories
4. Includes a clear call to action to visit the Stitch Fix website
5. Includes a subject line

## Deployment

The system is deployed using AWS CDK, which creates all the necessary AWS resources:
- DynamoDB tables
- Lambda functions
- SNS topic
- SQS queue
- S3 bucket
- CloudFront distribution
- IAM roles and policies

## Monitoring and Observability

- Lambda functions log to CloudWatch Logs
- Health check endpoint for the Backend API
- Frontend dashboard for monitoring engagement metrics

## Security Considerations

- IAM roles with least privilege
- No public access to DynamoDB tables
- HTTPS for all API requests
- API keys stored in environment variables

## Scalability

- DynamoDB scales automatically based on throughput
- Lambda functions scale automatically based on event volume
- SQS provides buffering for traffic spikes

## Future Enhancements

1. **A/B Testing**: Test different email templates for effectiveness
2. **Machine Learning**: Predict churn before it happens
3. **Multi-channel Communication**: Add SMS, push notifications, etc.
4. **Enhanced Analytics**: More detailed engagement metrics
5. **Personalization Engine**: More sophisticated personalization based on user behavior