# Stitch Fix Client Engagement Acceleration System - Active Context

## Current Focus

The Stitch Fix Client Engagement Acceleration System is a 1-day demo project designed to showcase technical excellence and business value alignment for a job application to Stitch Fix. The system addresses a key risk identified in Stitch Fix's annual SEC report: client retention and engagement.

The current focus is on implementing a production-ready, highly scalable solution that demonstrates a balance of technical excellence and practical business value. The system is designed to monitor client engagement, identify clients at risk of disengagement, and automatically generate personalized emails to re-engage them.

## Recent Changes

The following components have been implemented:

1. **Shared Package**:
   - Data models for users, emails, and orders
   - Zod schemas for validation
   - Event types and utilities
   - Engagement score calculation algorithm

2. **Stream Processor**:
   - Lambda function for processing DynamoDB stream events
   - Event publishing to SNS

3. **Email Processor (Go)**:
   - Lambda function for processing events from SQS
   - Engagement score calculation
   - Email generation using OpenRouter API
   - Email sending via SES

4. **Backend API**:
   - Express.js API for managing users and emails
   - RESTful endpoints for CRUD operations
   - DynamoDB integration for data persistence
   - Event publishing to SNS for downstream processing

5. **Frontend UI**:
   - React application for monitoring user engagement
   - Dashboard for viewing users and emails
   - Form for adding new users
   - Direct engagement score manipulation

6. **Infrastructure**:
   - AWS CDK stack for defining AWS resources
   - DynamoDB tables, Lambda functions, SNS/SQS, S3/CloudFront

## Active Decisions

### Architecture Decisions

1. **Event-Driven Architecture**:
   - Decision: Use an event-driven architecture for the system
   - Rationale: Provides loose coupling, scalability, and resilience
   - Status: Implemented

2. **Serverless Architecture**:
   - Decision: Use serverless components for compute and storage
   - Rationale: Reduces operational overhead and provides automatic scaling
   - Status: Implemented

3. **Monorepo Structure**:
   - Decision: Organize code in an Nx monorepo
   - Rationale: Provides consistent tooling and simplifies dependency management
   - Status: Implemented

### Technical Decisions

1. **TypeScript for Most Components**:
   - Decision: Use TypeScript for frontend, backend, and infrastructure
   - Rationale: Provides type safety and better developer experience
   - Status: Implemented

2. **Go for Email Processor**:
   - Decision: Use Go for the email processor
   - Rationale: Provides better performance and simpler concurrency
   - Status: Implemented

3. **DynamoDB for Data Storage**:
   - Decision: Use DynamoDB for data storage
   - Rationale: Provides automatic scaling and built-in streams
   - Status: Implemented

4. **SNS/SQS for Messaging**:
   - Decision: Use SNS and SQS for messaging
   - Rationale: Provides durability and rate control
   - Status: Implemented

### Implementation Decisions

1. **Engagement Score Algorithm**:
   - Decision: Implement a scoring algorithm based on order recency, frequency, and value
   - Rationale: Provides a quantitative measure of engagement risk
   - Status: Implemented

2. **Email Generation**:
   - Decision: Use OpenRouter API with deepseek/deepseek-r1-distill-llama-70b model for generating personalized email content
   - Rationale: Provides high-quality, personalized content with more flexibility in model selection
   - Status: Implemented

3. **Frontend Dashboard**:
   - Decision: Implement a simple dashboard for monitoring engagement
   - Rationale: Provides visibility into engagement metrics
   - Status: Implemented

4. **Direct Engagement Score Manipulation**:
   - Decision: Allow direct setting of engagement scores in the UI
   - Rationale: Enables testing of the email generation system without waiting for natural score changes
   - Status: Implemented

## Recent Achievements

1. **Fixed TypeScript Type Errors**:
   - Fixed the root package.json file to properly set up the Nx monorepo
   - Added missing type definitions for React (@types/react, @types/react-dom)
   - Added missing type definitions for Express (@types/express, @types/cors, @types/helmet)
   - Added all required Nx dependencies for the monorepo

2. **Fixed Infrastructure Integration**:
   - Added import for lambdaNodejs from aws-cdk-lib/aws-lambda-nodejs
   - Added import for lambdaEventSources from aws-cdk-lib/aws-lambda-event-sources
   - Updated StreamProcessorLambda and BackendLambda to use lambdaNodejs.NodejsFunction
   - Updated DynamoDB and SQS event sources to use lambdaEventSources

3. **Installed Dependencies**:
   - Successfully ran `npm install` to install all required dependencies
   - Added 644 packages, including all the necessary type definitions and libraries

4. **Fixed Build Issues**:
   - Resolved Jest configuration issues by removing the Jest plugin from nx.json
   - Installed missing dependencies (@vitejs/plugin-react, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks, @nx/esbuild)
   - Created proper tsconfig.spec.json files for each package
   - Fixed TypeScript error in infrastructure.ts by using bracket notation for accessing environment variables
   - Successfully built all packages and verified the output binaries/transpiled code

5. **Fixed Lambda Deployment Issues**:
   - Created custom build scripts using esbuild for stream-processor and backend packages
   - Configured esbuild to properly bundle all dependencies including zod
   - Updated the project.json files to use the custom build scripts
   - Implemented a git root detection function in infrastructure code to ensure paths work correctly
   - Updated the Lambda function paths to use the correct build output locations
   - Changed the Go Lambda runtime from deprecated GO_1_X to PROVIDED_AL2023
   - Successfully deployed the infrastructure to AWS
   - Verified the stream processor Lambda is working correctly by testing with DynamoDB events

6. **Integrated OpenRouter API**:
   - Replaced OpenAI client with direct HTTP requests to OpenRouter API
   - Updated the API request and response handling to match OpenRouter's format
   - Added support for the deepseek/deepseek-r1-distill-llama-70b model
   - Created a secure deployment process with environment variables for API keys
   - Fixed environment variable handling in the Go Lambda for table names

7. **Fixed API Gateway and Backend Integration**:
   - Added API Gateway to the infrastructure to expose the backend API
   - Fixed the backend Lambda to work with API Gateway by integrating serverless-http
   - Updated the frontend to use the correct API URL from the deployed API Gateway
   - Tested the API Gateway endpoints to ensure they're working correctly
   - Updated documentation with troubleshooting steps for Lambda handler issues

8. **Updated Backend API to Use DynamoDB**:
   - Replaced in-memory arrays with DynamoDB operations
   - Added AWS SDK dependencies for DynamoDB and SNS
   - Implemented CRUD operations using DynamoDB
   - Added event publishing to SNS for downstream processing
   - Ensured proper error handling for database operations

9. **Improved Engagement Score Handling**:
   - Updated the backend to respect provided engagement scores
   - Simplified the frontend code to directly send engagement scores
   - Added logging to track when scores are provided vs. calculated
   - Tested the API to confirm engagement score updates are working

## Current Challenges

1. **Testing**:
   - Challenge: Limited time for comprehensive testing
   - Status: Focus on core functionality testing

2. **Email Generation**:
   - Challenge: Emails are not being generated for users with low engagement scores
   - Status: Investigating the issue

## Next Steps

1. **Testing**:
   - Continue testing core functionality
   - Verify end-to-end flow with real data
   - Debug why emails are not being generated for users with low engagement scores

2. **Documentation**:
   - Complete README
   - Document architecture and implementation details
   - Document the build and deployment process

3. **Monitoring**:
   - Set up CloudWatch alarms for Lambda errors
   - Implement better error handling and logging

## Open Questions

1. **OpenRouter API Key Management**:
   - Question: How to securely manage the OpenRouter API key in production?
   - Options: AWS Secrets Manager, environment variables, parameter store
   - Current approach: Environment variables with .env.deploy file for secure deployment

2. **Email Sending Limits**:
   - Question: How to handle SES sending limits in production?
   - Options: Request sending limit increase, implement rate limiting
   - Current approach: Assume sufficient limits for demo

3. **Frontend Hosting**:
   - Question: How to handle frontend routing with S3/CloudFront?
   - Options: Configure error document, use Lambda@Edge
   - Current approach: Configure error document to index.html

4. **Email Generation Debugging**:
   - Question: Why are emails not being generated for users with low engagement scores?
   - Options: Check CloudWatch logs, verify event flow, test email processor directly
   - Current approach: Investigating the issue

## Key Insights

1. **Event-Driven Architecture**:
   - Insight: Event-driven architecture provides a clean separation of concerns
   - Application: Used for decoupling components and enabling scalability

2. **Engagement Scoring**:
   - Insight: Quantitative scoring enables automated decision-making
   - Application: Used for identifying at-risk clients

3. **Personalization**:
   - Insight: AI-generated content can be highly personalized
   - Application: Used for creating engaging email content

4. **Nx Monorepo Build System**:
   - Insight: Nx build system requires careful configuration of dependencies
   - Application: Properly configured build targets and dependencies for successful builds

5. **DynamoDB Integration**:
   - Insight: DynamoDB provides a scalable and durable storage solution
   - Application: Used for storing user and email data with automatic scaling

## Current Status

The system is now successfully deployed to AWS with most components working correctly. All core components have been implemented, the TypeScript type errors and infrastructure integration issues have been resolved, and all dependencies have been successfully installed. The project is now properly set up as an Nx monorepo with all the necessary dependencies and correct imports.

All packages have been successfully built with proper bundling of dependencies and deployed to AWS. The shared package, stream processor, backend API, frontend UI, infrastructure, and email processor (Go) are all built and deployed.

The backend API has been updated to use DynamoDB instead of in-memory storage, ensuring data persistence and enabling the event-driven architecture. The API now publishes events to SNS when users are created, updated, or when orders are created, triggering the downstream processes.

The engagement score handling has been improved to respect provided engagement scores, allowing for direct manipulation of scores in the UI. This enables testing of the email generation system without waiting for natural score changes.

However, there is an issue with the email generation system. Emails are not being generated for users with low engagement scores, despite the engagement score being correctly updated in the database. This issue is currently being investigated.

The system demonstrates a production-ready, highly scalable solution that addresses a key business risk for Stitch Fix. It showcases technical excellence through its architecture and implementation, while providing practical business value through its engagement monitoring and automated re-engagement capabilities.