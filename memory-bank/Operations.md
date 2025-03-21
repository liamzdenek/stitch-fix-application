# Stitch Fix Client Engagement Acceleration System - Operations

This document contains details of where all the resources can be located and how to operate the system.

## AWS Resources

### DynamoDB Tables

1. **Users Table**:
   - Name: `StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F`
   - Purpose: Stores user information including engagement scores
   - Primary Key: `userId`

2. **Emails Table**:
   - Name: `StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10`
   - Purpose: Stores generated emails
   - Primary Key: `emailId`
   - GSI: `userIdIndex` (for querying emails by userId)

### Lambda Functions

1. **Stream Processor Lambda**:
   - Name: `StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY`
   - Purpose: Processes DynamoDB stream events and publishes to SNS
   - Runtime: Node.js 20
   - Log Group: `/aws/lambda/StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY`

2. **Email Processor Lambda**:
   - Name: `StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox`
   - Purpose: Processes events from SQS, generates and sends emails
   - Runtime: PROVIDED_AL2023 (Go)
   - Log Group: `/aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox`

3. **Backend Lambda**:
   - Purpose: Serves the backend API
   - Runtime: Node.js 20
   - API Gateway: Integrated with API Gateway for HTTP access

### Messaging Resources

1. **SNS Topic**:
   - ARN: `arn:aws:sns:us-west-2:129013835758:StitchFixClientEngagementStack-EventsTopic063726A1-y1R1onnJrUvq`
   - Purpose: Publishes events for processing

2. **SQS Queue**:
   - URL: `https://sqs.us-west-2.amazonaws.com/129013835758/StitchFixClientEngagementStack-EmailQueue9C1DA90F-3rvacbQJvOQO`
   - Purpose: Queues events for the email processor

### Frontend Hosting

1. **CloudFront Distribution**:
   - URL: `https://d3coned7g7fmif.cloudfront.net`
   - Purpose: Hosts the frontend application

2. **S3 Bucket**:
   - Purpose: Stores frontend static assets
   - CloudFront Origin: Configured as the origin for CloudFront

### API Gateway

1. **Backend API**:
   - URL: `https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/`
   - Purpose: Provides RESTful API endpoints for the frontend
   - Integration: Integrated with the Backend Lambda

## Local Development Resources

### Project Structure

1. **Shared Package**:
   - Path: `packages/shared`
   - Purpose: Contains shared models, schemas, and utilities

2. **Stream Processor**:
   - Path: `packages/stream-processor`
   - Purpose: Processes DynamoDB stream events

3. **Email Processor (Go)**:
   - Path: `packages/email-processor-go`
   - Purpose: Generates and sends emails

4. **Backend API**:
   - Path: `packages/backend`
   - Purpose: Serves the REST API

5. **Frontend UI**:
   - Path: `packages/frontend`
   - Purpose: Provides the user interface
   - Framework: React with TypeScript
   - Routing: React Router
   - Styling: CSS Modules

6. **Infrastructure**:
   - Path: `infrastructure`
   - Purpose: Defines AWS resources using CDK

### Frontend Structure

1. **Components**:
   - Path: `packages/frontend/src/app/components`
   - Purpose: Reusable UI components
   - Key Components:
     - `Layout`: Main layout component with navigation
     - `UserCard`: Card component for displaying user information
     - `EmailCard`: Card component for displaying email information
     - `ActionButton`: Reusable button component with various styles
     - `EngagementScore`: Visual representation of engagement scores

2. **Pages**:
   - Path: `packages/frontend/src/app/pages`
   - Purpose: Page components for different routes
   - Key Pages:
     - `Dashboard`: Main dashboard showing users and engagement metrics
     - `UserDetail`: Detailed view of a user with actions
     - `EmailList`: List of emails for a user
     - `System`: System information and health status

3. **Context**:
   - Path: `packages/frontend/src/app/context`
   - Purpose: React context providers for state management
   - Key Contexts:
     - `ApiContext`: Provides API client to components
     - `UserContext`: Manages user state and operations

4. **Services**:
   - Path: `packages/frontend/src/app/services`
   - Purpose: API client and service functions
   - Key Services:
     - `api.ts`: API client for communicating with the backend

5. **Utils**:
   - Path: `packages/frontend/src/app/utils`
   - Purpose: Utility functions
   - Key Utils:
     - `formatters.ts`: Formatting functions for dates, currency, etc.
     - `eventTriggers.ts`: Functions for triggering events

### Build Outputs

1. **Stream Processor**:
   - Output: `dist/packages/stream-processor`

2. **Email Processor (Go)**:
   - Output: `packages/email-processor-go/dist`

3. **Backend API**:
   - Output: `dist/packages/backend`

4. **Frontend UI**:
   - Output: `dist/packages/frontend`
   - Assets: HTML, CSS, and JavaScript files

5. **Infrastructure**:
   - Output: `dist/infrastructure`

## Environment Variables

### Required Environment Variables

1. **OpenRouter API Key**:
   - Variable: `OPENROUTER_API_KEY`
   - Purpose: Authentication for OpenRouter API
   - Location: `.env.deploy` file

2. **API URL**:
   - Variable: `NX_API_URL`
   - Purpose: Backend API URL for frontend
   - Value: `https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod`
   - Usage: Set during build with `export NX_API_URL=... && npx nx build frontend`

### Lambda Environment Variables

1. **Email Processor Lambda**:
   - `USERS_TABLE_NAME`: Name of the users table
   - `EMAILS_TABLE_NAME`: Name of the emails table
   - `OPENROUTER_API_KEY`: API key for OpenRouter

2. **Stream Processor Lambda**:
   - `SNS_TOPIC_ARN`: ARN of the SNS topic
   - `USERS_TABLE_NAME`: Name of the users table

3. **Backend Lambda**:
   - `USERS_TABLE_NAME`: Name of the users table
   - `EMAILS_TABLE_NAME`: Name of the emails table
   - `SNS_TOPIC_ARN`: ARN of the SNS topic

## Deployment Process

1. **Build and Deploy**:
   - Command: `npx nx deploy infrastructure`
   - Description: Builds all packages and deploys the infrastructure to AWS

2. **Frontend-Only Build**:
   - Command: `export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend`
   - Description: Builds the frontend with the correct API URL

3. **Frontend-Only Deploy**:
   - Command: `./build-and-deploy-frontend.sh`
   - Description: Builds and deploys only the frontend to S3/CloudFront

4. **Secure Deployment**:
   - Process: Create a `.env.deploy` file with the required environment variables
   - Command: `npx nx deploy infrastructure`
   - Description: Loads environment variables from `.env.deploy` and deploys the infrastructure

## Monitoring

1. **CloudWatch Logs**:
   - Stream Processor: `/aws/lambda/StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY`
   - Email Processor: `/aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox`

2. **DynamoDB Tables**:
   - Users Table: `StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F`
   - Emails Table: `StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10`

3. **Frontend Monitoring**:
   - CloudFront Access Logs: Available in the CloudFront console
   - S3 Access Logs: Available in the S3 console