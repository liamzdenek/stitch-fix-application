# Stitch Fix Client Engagement Acceleration System - Technical Context

## Technology Stack

### Frontend

- **Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite (via Nx)
- **Styling**: CSS Modules
- **Hosting**: S3 + CloudFront

The frontend is a React application built with TypeScript. It uses CSS Modules for styling to ensure component-scoped styles without conflicts. The application is built with Vite through the Nx build system and deployed to S3 with CloudFront for content delivery.

### Backend

- **API Framework**: Express.js
- **Language**: TypeScript
- **Runtime**: Node.js
- **Deployment**: AWS Lambda

The backend API is built with Express.js and TypeScript, running on Node.js. It is deployed as an AWS Lambda function for serverless operation. The API provides RESTful endpoints for managing users and emails.

### Stream Processor

- **Language**: TypeScript
- **Runtime**: Node.js
- **Deployment**: AWS Lambda
- **Trigger**: DynamoDB Streams

The stream processor is a TypeScript Lambda function that processes DynamoDB stream events. It is triggered by changes to the Users table and publishes events to an SNS topic.

### Email Processor

- **Language**: Go
- **Runtime**: Go Runtime
- **Deployment**: AWS Lambda
- **Trigger**: SQS Queue

The email processor is a Go Lambda function that processes events from an SQS queue. It calculates engagement scores, generates personalized emails using OpenAI, and sends them via SES.

### Data Storage

- **Database**: Amazon DynamoDB
- **Tables**: Users, Emails
- **Streams**: Enabled on Users table
- **Indexes**: GSI on Emails table for userId

DynamoDB is used for data storage, with two main tables: Users and Emails. The Users table has streams enabled to capture changes, and the Emails table has a global secondary index for querying emails by user.

### Messaging

- **Event Bus**: Amazon SNS
- **Queue**: Amazon SQS
- **Topics**: Events topic

SNS is used as an event bus for publishing events, with SQS as a queue for buffering events before processing. This provides durability and rate control for event processing.

### Infrastructure

- **IaC Tool**: AWS CDK
- **Language**: TypeScript
- **Deployment**: CloudFormation

Infrastructure is defined as code using AWS CDK with TypeScript. This generates CloudFormation templates for deployment, ensuring reproducible infrastructure.

### External Services

- **Email Sending**: Amazon SES
- **Content Generation**: OpenAI API

Amazon SES is used for sending emails, and the OpenAI API is used for generating personalized email content.

## Development Environment

### Monorepo Structure

The project uses an Nx monorepo with the following packages:

- **shared**: Shared types and utilities
- **stream-processor**: Lambda for processing DynamoDB streams
- **email-processor-go**: Go Lambda for processing emails
- **backend**: Express.js API
- **frontend**: React UI
- **infrastructure**: AWS CDK infrastructure

### Build System

- **Build Tool**: Nx
- **Task Runner**: Nx
- **Package Manager**: npm

Nx is used as both the build tool and task runner, providing a consistent interface for building, testing, and deploying all packages. npm is used for package management.

### Version Control

- **System**: Git
- **Workflow**: Feature branches
- **Commit Style**: Conventional Commits

Git is used for version control, with a feature branch workflow. Commits follow the Conventional Commits style for clarity and automation.

### Code Quality

- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checking**: TypeScript

ESLint is used for linting, Prettier for formatting, and TypeScript for type checking. This ensures consistent code quality across the project.

## Deployment Pipeline

### Local Development

1. Install dependencies: `npm install`
2. Build all packages: `npx nx run-many --target=build --all`
3. Run the backend locally: `npx nx serve backend`
4. Run the frontend locally: `npx nx serve frontend`

### AWS Deployment

1. Build all packages: `npx nx run-many --target=build --all`
2. Deploy the infrastructure: `cd infrastructure && cdk deploy`

## Technical Constraints

### AWS Services

The system is designed to run on AWS, using the following services:

- **Compute**: Lambda
- **Storage**: DynamoDB, S3
- **Messaging**: SNS, SQS
- **Delivery**: CloudFront, SES
- **Deployment**: CloudFormation (via CDK)

### Serverless Architecture

The system follows a serverless architecture, with the following constraints:

- **Execution Time**: Lambda functions are limited to 15 minutes
- **Memory**: Lambda functions are limited to 10GB
- **Payload Size**: API Gateway is limited to 10MB
- **Concurrency**: Lambda functions have concurrency limits

### External API Limits

The system integrates with external APIs, with the following constraints:

- **OpenAI API**: Rate limits and token limits
- **SES**: Sending limits and reputation management

## Technical Decisions

### TypeScript for Most Components

TypeScript was chosen for most components due to:

- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better IDE support and documentation
- **Ecosystem**: Rich ecosystem of libraries and tools
- **Consistency**: Same language for frontend, backend, and infrastructure

### Go for Email Processor

Go was chosen for the email processor due to:

- **Performance**: Faster startup time and lower memory usage
- **Concurrency**: Efficient handling of concurrent requests
- **Simplicity**: Straightforward error handling and memory management
- **AWS Integration**: Good support for AWS Lambda

### DynamoDB for Data Storage

DynamoDB was chosen for data storage due to:

- **Scalability**: Automatic scaling of throughput
- **Performance**: Low-latency access at any scale
- **Streams**: Built-in change data capture
- **Serverless**: No servers to manage
- **Cost**: Pay-per-request pricing model

### SNS/SQS for Messaging

SNS and SQS were chosen for messaging due to:

- **Decoupling**: Loose coupling between components
- **Durability**: Messages are stored durably
- **Scalability**: Automatic scaling of throughput
- **Filtering**: Message filtering capabilities
- **Fan-Out**: One-to-many message delivery

### React for Frontend

React was chosen for the frontend due to:

- **Component Model**: Reusable UI components
- **Virtual DOM**: Efficient updates
- **Ecosystem**: Rich ecosystem of libraries and tools
- **Community**: Large community and support
- **TypeScript**: Excellent TypeScript support

### Express.js for API

Express.js was chosen for the API due to:

- **Simplicity**: Lightweight and flexible
- **Middleware**: Rich middleware ecosystem
- **Performance**: Good performance characteristics
- **TypeScript**: Good TypeScript support
- **Lambda**: Easy to deploy to Lambda

### CDK for Infrastructure

CDK was chosen for infrastructure due to:

- **TypeScript**: Same language as application code
- **Abstraction**: Higher-level abstractions than CloudFormation
- **Constructs**: Reusable infrastructure components
- **Testing**: Infrastructure can be tested
- **Integration**: Good integration with AWS services

## Technical Risks

### DynamoDB Streams

DynamoDB Streams have the following risks:

- **Ordering**: Events may not be delivered in order
- **Duplicates**: Events may be delivered more than once
- **Latency**: Events may be delayed
- **Retention**: Events are only retained for 24 hours

Mitigation: Design for idempotency and out-of-order processing.

### Lambda Cold Starts

Lambda functions have cold start latency, which can impact performance:

- **TypeScript**: TypeScript Lambda functions have longer cold starts
- **Dependencies**: More dependencies increase cold start time
- **VPC**: VPC Lambda functions have longer cold starts

Mitigation: Optimize Lambda functions for fast startup and use provisioned concurrency for critical functions.

### OpenAI API

The OpenAI API has the following risks:

- **Availability**: The API may be unavailable
- **Rate Limits**: The API has rate limits
- **Cost**: The API has usage-based pricing
- **Content**: The API may generate inappropriate content

Mitigation: Implement retry logic, rate limiting, and content filtering.

### Email Deliverability

Email delivery has the following risks:

- **Spam Filters**: Emails may be marked as spam
- **Bounces**: Emails may bounce
- **Reputation**: Sender reputation may be affected
- **Compliance**: Email must comply with regulations

Mitigation: Follow email best practices, monitor bounces and complaints, and ensure compliance with regulations.

## Technical Monitoring

### CloudWatch Logs

All Lambda functions log to CloudWatch Logs, providing:

- **Error Tracking**: Errors are logged with context
- **Performance Monitoring**: Execution time and memory usage
- **Request Tracing**: Request IDs for tracing
- **Custom Metrics**: Custom metrics for business logic

### CloudWatch Metrics

CloudWatch Metrics are used for monitoring:

- **Lambda Invocations**: Number of Lambda invocations
- **Lambda Errors**: Number of Lambda errors
- **Lambda Duration**: Lambda execution time
- **DynamoDB Throughput**: DynamoDB read and write throughput
- **SQS Queue Length**: SQS queue length

### Health Check Endpoint

The backend API provides a health check endpoint that checks:

- **API Health**: API is responding
- **DynamoDB Health**: DynamoDB is accessible
- **SNS Health**: SNS is accessible
- **SQS Health**: SQS is accessible

## Technical Documentation

### Code Documentation

Code is documented with:

- **Comments**: Inline comments for complex logic
- **JSDoc/TSDoc**: Function and class documentation
- **README**: Package-level documentation
- **Architecture**: System-level documentation

### API Documentation

The API is documented with:

- **OpenAPI**: API specification
- **Endpoint Documentation**: Endpoint descriptions
- **Request/Response Examples**: Example requests and responses
- **Error Codes**: Error code documentation

### Infrastructure Documentation

Infrastructure is documented with:

- **CDK Code**: Self-documenting infrastructure code
- **Architecture Diagram**: Visual representation of infrastructure
- **Resource Documentation**: Documentation of AWS resources
- **Deployment Guide**: Step-by-step deployment instructions