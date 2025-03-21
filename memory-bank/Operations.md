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

6. **Infrastructure**:
   - Path: `infrastructure`
   - Purpose: Defines AWS resources using CDK

### Build Outputs

1. **Stream Processor**:
   - Output: `dist/packages/stream-processor`

2. **Email Processor (Go)**:
   - Output: `packages/email-processor-go/dist`

3. **Backend API**:
   - Output: `dist/packages/backend`

4. **Frontend UI**:
   - Output: `dist/packages/frontend`

5. **Infrastructure**:
   - Output: `dist/infrastructure`

## Environment Variables

### Required Environment Variables

1. **OpenRouter API Key**:
   - Variable: `OPENROUTER_API_KEY`
   - Purpose: Authentication for OpenRouter API
   - Location: `.env.deploy` file

### Lambda Environment Variables

1. **Email Processor Lambda**:
   - `USERS_TABLE_NAME`: Name of the users table
   - `EMAILS_TABLE_NAME`: Name of the emails table
   - `OPENROUTER_API_KEY`: API key for OpenRouter

2. **Stream Processor Lambda**:
   - `SNS_TOPIC_ARN`: ARN of the SNS topic
   - `USERS_TABLE_NAME`: Name of the users table

## Deployment Process

1. **Build and Deploy**:
   - Command: `npx nx deploy infrastructure`
   - Description: Builds all packages and deploys the infrastructure to AWS

2. **Secure Deployment**:
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