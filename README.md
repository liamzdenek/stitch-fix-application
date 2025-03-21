# Stitch Fix Client Engagement Acceleration System

A production-ready, highly scalable solution for improving client engagement and retention at Stitch Fix.

## Overview

This system addresses a key risk identified in Stitch Fix's annual SEC report: "We may be unable to retain clients or maintain a high level of engagement with our clients and maintain or increase their spending with us, which could harm our business, financial condition, or operating results."

The Stitch Fix Client Engagement Acceleration System is designed to:

1. Monitor client engagement through a sophisticated scoring algorithm
2. Identify clients at risk of disengagement
3. Automatically generate personalized emails to re-engage clients
4. Track the effectiveness of engagement efforts

## Architecture

The system follows a 12-Factor app design and uses an event-driven architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  DynamoDB   │────▶│   Stream    │────▶│     SNS     │────▶│     SQS     │
│   Tables    │     │  Processor  │     │    Topic    │     │    Queue    │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐                                           ┌─────────────┐
│             │                                           │             │
│  Frontend   │◀─────────────────────────────────────────│    Email    │
│     UI      │                                           │  Processor  │
│             │                                           │             │
└─────────────┘                                           └─────────────┘
       ▲                                                        │
       │                                                        │
       │                                                        ▼
       │                                                 ┌─────────────┐
       │                                                 │             │
       └─────────────────────────────────────────────────│   Backend   │
                                                         │     API     │
                                                         │             │
                                                         └─────────────┘
```

### Components

1. **DynamoDB Tables**
   - Users table with stream enabled
   - Emails table with GSI for querying by user

2. **Stream Processor (TypeScript Lambda)**
   - Processes DynamoDB stream events
   - Publishes events to SNS topic

3. **Email Processor (Go Lambda)**
   - Consumes events from SQS queue
   - Calculates engagement scores
   - Generates personalized emails using OpenAI
   - Sends emails via SES

4. **Backend API (Express.js)**
   - RESTful API for managing users and emails
   - Endpoints for creating/updating users and viewing emails

5. **Frontend UI (React)**
   - Dashboard for monitoring user engagement
   - Interface for managing users and viewing emails

## Technical Details

### Engagement Scoring Algorithm

The system uses a sophisticated algorithm to calculate an engagement score for each user based on:

- Days since last order (higher impact)
- Order count (positive impact)
- Average order value (positive impact)
- Days since last email (to avoid sending too many emails)

Lower scores indicate higher risk of disengagement, with a threshold of 50 triggering re-engagement emails.

### Event Flow

1. User data changes in DynamoDB
2. DynamoDB Stream triggers Stream Processor Lambda
3. Stream Processor publishes event to SNS
4. SNS delivers event to SQS queue
5. Email Processor Lambda consumes event from SQS
6. Email Processor calculates engagement score
7. If score is below threshold, Email Processor generates and sends email
8. Email status is updated in DynamoDB

## Development

This project uses an Nx monorepo structure with the following packages:

- `shared`: Shared types and utilities
- `stream-processor`: Lambda for processing DynamoDB streams
- `email-processor-go`: Go Lambda for processing emails
- `backend`: Express.js API
- `frontend`: React UI
- `infrastructure`: AWS CDK infrastructure

### Prerequisites

- Node.js 20+
- Go 1.21+
- AWS CLI configured
- AWS CDK installed

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Build all packages:
   ```
   npx nx run-many --target=build --all
   ```

3. Run the backend locally:
   ```
   npx nx serve backend
   ```

4. Run the frontend locally:
   ```
   npx nx serve frontend
   ```

### Deployment

1. Build all packages:
   ```
   npx nx run-many --target=build --all
   ```

2. Deploy the infrastructure:
   ```
   cd infrastructure
   cdk deploy
   ```

## Key Features

- **Real-time Engagement Monitoring**: Track client engagement in real-time
- **Personalized Re-engagement**: Generate personalized emails using OpenAI
- **Scalable Architecture**: Event-driven design for high scalability
- **Comprehensive Dashboard**: Monitor engagement metrics and email effectiveness
- **Fully Automated**: No manual intervention required for re-engagement

## Future Enhancements

- A/B testing for email content
- Machine learning for predicting churn
- Integration with other communication channels
- Enhanced analytics for engagement metrics

## License

This project is proprietary and confidential.

© 2025 Stitch Fix, Inc. All rights reserved.