# Technical Context: Stitch Fix Client Engagement Acceleration System

## Technologies Used

### Frontend
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **CSS Modules**: Scoped CSS styling without frameworks
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for API endpoints
- **TypeScript**: Type-safe JavaScript for backend code
- **Zod**: Schema validation library

### Infrastructure
- **AWS CDK**: Infrastructure as code for AWS resources
- **AWS Lambda**: Serverless compute for backend services
- **Amazon DynamoDB**: NoSQL database for data storage
- **DynamoDB Streams**: Event source for data changes
- **Amazon SNS**: Pub/sub messaging for event distribution
- **Amazon SQS**: Message queuing for durable processing
- **Amazon S3**: Storage for frontend assets
- **Amazon CloudFront**: CDN for frontend delivery
- **AWS API Gateway**: API management and routing

### External Services
- **OpenRouter**: API for accessing LLM models

### Development Tools
- **Nx**: Build system and extensible dev tools for monorepos
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Development Setup

### Project Structure
The project follows an Nx monorepo structure with packages organized as follows:

```
stitch-fix-application/
├── packages/
│   ├── shared/                   # Shared types and utilities
│   ├── frontend/                 # React application
│   ├── backend/                  # Express API server
│   ├── stream-processor/         # DynamoDB Stream processor
│   ├── email-processor/          # Email generation processor
├── infrastructure/               # CDK infrastructure code
```

### Development Workflow
1. Initialize the Nx workspace
2. Create packages using `nx generate` commands
3. Implement shared types and utilities
4. Implement backend services
5. Implement frontend application
6. Deploy infrastructure using CDK
7. Test the end-to-end flow

## Technical Constraints

### 12-Factor App Principles
The application follows the 12-Factor App methodology:

1. **Codebase**: Single monorepo in Git
2. **Dependencies**: Explicitly declared and isolated
3. **Config**: Stored in environment variables
4. **Backing Services**: Treated as attached resources
5. **Build, Release, Run**: Strict separation between stages
6. **Processes**: Stateless processes with data in backing services
7. **Port Binding**: Services export via port binding
8. **Concurrency**: Scale via the process model
9. **Disposability**: Fast startup and graceful shutdown
10. **Dev/Prod Parity**: Same AWS services in all environments
11. **Logs**: Treated as event streams
12. **Admin Processes**: Run as one-off processes via CDK

### Project Rules
1. Implement a 12-Factor app, to the extent it can be done cloud natively
2. Pass location/ARN of AWS resources into programs through environment variables
3. Do not implement fallback, ever - either the main path works, or it fails and logs the failure
4. Never write one-off scripts, always attach them to an `nx run` command
5. Use an Nx monorepo
6. Use React
7. Use `nx generate` commands for project initialization
8. Use TypeScript by default
9. Use CSS modules, no Tailwind CSS, no CSS framework
10. Always --save or --save-dev dependencies
11. Design infrastructure for AWS
12. Deploy using CDK with NodejsFunction primitive
13. Put all monorepo packages inside a `packages` directory
14. No e2e testing with Playwright
15. Use actual AWS deployments for testing, no local development mocks
16. Do not use CDK to compile JavaScript, compile outside of CDK and import compiled artifacts
17. Put shared types in a shared package
18. Use Zod for schema validation
19. Include debug logging, including requests and responses
20. Include health check endpoints with dependency checks

## Dependencies

### Shared Package
```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.7"
  }
}
```

### Frontend Package
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "axios": "^1.6.2",
    "@stitch-fix/shared": "*"
  }
}
```

### Backend Package
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "aws-sdk": "^2.1525.0",
    "@stitch-fix/shared": "*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17"
  }
}
```

### Stream Processor Package
```json
{
  "dependencies": {
    "aws-sdk": "^2.1525.0",
    "@stitch-fix/shared": "*"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.130"
  }
}
```

### Email Processor Package
```json
{
  "dependencies": {
    "aws-sdk": "^2.1525.0",
    "openrouter": "^2.0.0",
    "@stitch-fix/shared": "*"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.130"
  }
}
```

### Infrastructure Package
```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.115.0",
    "constructs": "^10.3.0"
  }
}
```

## Environment Variables

### Frontend Environment Variables
- `REACT_APP_API_URL`: URL of the API Gateway
- `REACT_APP_REGION`: AWS region

### Backend Lambda Environment Variables
- `USERS_TABLE_NAME`: Name of the DynamoDB users table
- `EMAILS_TABLE_NAME`: Name of the DynamoDB emails table
- `AWS_REGION`: AWS region
- `CORS_ORIGIN`: Allowed CORS origin
- `LOG_LEVEL`: Logging level

### Stream Processor Lambda Environment Variables
- `SNS_TOPIC_ARN`: ARN of the SNS topic
- `AWS_REGION`: AWS region
- `LOG_LEVEL`: Logging level

### Email Processor Lambda Environment Variables
- `USERS_TABLE_NAME`: Name of the DynamoDB users table
- `EMAILS_TABLE_NAME`: Name of the DynamoDB emails table
- `OPENROUTER_API_KEY`: API key for OpenRouter
- `ENGAGEMENT_THRESHOLD`: Threshold for generating emails (default: 50)
- `AWS_REGION`: AWS region
- `LOG_LEVEL`: Logging level

## API Contracts

### User API

#### GET /api/users

**Response:**
```typescript
interface GetUsersResponse {
  users: User[];
}
```

#### GET /api/users/:userId

**Response:**
```typescript
interface GetUserResponse {
  user: User;
}
```

#### POST /api/users

**Request:**
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
  lastOrderDate: string;
  orderCount: number;
  averageOrderValue: number;
  preferredCategories: string[];
}
```

**Response:**
```typescript
interface CreateUserResponse {
  user: User;
}
```

#### PUT /api/users/:userId

**Request:**
```typescript
interface UpdateUserRequest {
  name?: string;
  email?: string;
  lastOrderDate?: string;
  orderCount?: number;
  averageOrderValue?: number;
  preferredCategories?: string[];
}
```

**Response:**
```typescript
interface UpdateUserResponse {
  user: User;
}
```

#### DELETE /api/users/:userId

**Response:**
```typescript
// Empty response with 204 status code
```

### Email API

#### GET /api/emails

**Query Parameters:**
```typescript
interface GetEmailsQuery {
  userId?: string;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
interface GetEmailsResponse {
  emails: Email[];
  total: number;
}
```

#### GET /api/emails/:emailId

**Response:**
```typescript
interface GetEmailResponse {
  email: Email;
}
```

### Health Check API

#### GET /api/health

**Response:**
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  dependencies: {
    dynamoDB: 'connected' | 'error';
    sns?: 'connected' | 'error';
    sqs?: 'connected' | 'error';
    openRouter?: 'connected' | 'error';
  };
  details?: Record<string, any>;
}
```

## Data Models

### User Model

```typescript
export interface User {
  userId: string;
  email: string;
  name: string;
  lastOrderDate: string;
  orderCount: number;
  averageOrderValue: number;
  preferredCategories: string[];
  engagementScore: number;
  lastEmailDate: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Email Model

```typescript
export interface Email {
  emailId: string;
  userId: string;
  subject: string;
  content: string;
  generatedAt: string;
  engagementScoreAtTime: number;
  status: 'generated' | 'would_send';
  createdAt: string;
}
```

### Event Model

```typescript
export enum EventType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SCORED = 'USER_SCORED',
  EMAIL_GENERATED = 'EMAIL_GENERATED'
}

export interface Event<T = any> {
  type: EventType;
  payload: T;
  timestamp: string;
}