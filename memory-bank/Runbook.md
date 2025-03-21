# Stitch Fix Client Engagement Acceleration System - Runbook

This document contains detailed procedures for debugging and operating the system, including all the commands we've used during development and troubleshooting.

## Build and Deployment

### Building the Project

```bash
# Install dependencies
npm install

# Build all packages
npx nx run-many --target=build --all

# Build a specific package
npx nx build shared
npx nx build stream-processor
npx nx build email-processor-go
npx nx build backend
npx nx build frontend
npx nx build infrastructure
```

### Deploying the Infrastructure

```bash
# Deploy the infrastructure
npx nx deploy infrastructure

# Deploy with environment variables
OPENROUTER_API_KEY=your-api-key npx nx deploy infrastructure
```

## Debugging

### Checking AWS Resources

```bash
# List DynamoDB tables
aws dynamodb list-tables --profile lz-demos

# Scan a DynamoDB table
aws dynamodb scan --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --profile lz-demos
aws dynamodb scan --table-name StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10 --profile lz-demos

# Add a test user to the DynamoDB table
aws dynamodb put-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --item '{"userId":{"S":"test-user-1"},"email":{"S":"test1@example.com"},"name":{"S":"Test User 1"},"lastOrderDate":{"S":"2025-03-21T15:01:00.000Z"},"orderCount":{"N":"10"},"averageOrderValue":{"N":"200"},"preferredCategories":{"L":[{"S":"dresses"},{"S":"tops"}]},"createdAt":{"S":"2025-03-21T15:01:00.000Z"},"updatedAt":{"S":"2025-03-21T15:01:00.000Z"},"engagementScore":{"N":"50"}}' --profile lz-demos

# Add a test user with low engagement score (to trigger email generation)
aws dynamodb put-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --item '{"userId":{"S":"test-user-8"},"email":{"S":"test8@example.com"},"name":{"S":"Test User 8"},"lastOrderDate":{"S":"2024-12-21T16:18:00.000Z"},"orderCount":{"N":"5"},"averageOrderValue":{"N":"100"},"preferredCategories":{"L":[{"S":"pants"},{"S":"shirts"}]},"createdAt":{"S":"2025-03-21T16:18:00.000Z"},"updatedAt":{"S":"2025-03-21T16:18:00.000Z"},"engagementScore":{"N":"30"}}' --profile lz-demos
```

### Checking Lambda Logs

```bash
# Check stream processor Lambda logs
aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos

# Check email processor Lambda logs
aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos

# Check logs with a longer time window
aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --start-time $(date -d "5 minutes ago" +%s)000 --profile lz-demos

# Wait and then check logs (useful for asynchronous processing)
sleep 10 && aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos
```

## Common Issues and Solutions

### Lambda Deployment Issues

#### Issue: Lambda function not found or incorrect code

**Symptoms:**
- Lambda function returns 404
- Lambda function executes old code

**Solution:**
1. Check the Lambda function name in the AWS console
2. Verify the build output is correct
3. Redeploy the infrastructure

```bash
npx nx build email-processor-go
npx nx deploy infrastructure
```

#### Issue: Lambda function permissions

**Symptoms:**
- AccessDeniedException in CloudWatch logs
- Lambda function cannot access DynamoDB tables

**Solution:**
1. Check the IAM role attached to the Lambda function
2. Verify the environment variables are set correctly
3. Update the infrastructure code to grant the necessary permissions

#### Issue: Express app not working with Lambda (Runtime.HandlerNotFound)

**Symptoms:**
- API Gateway returns 502 Bad Gateway
- Lambda logs show "Runtime.HandlerNotFound: main.handler is undefined or not exported"

**Solution:**
1. Install the serverless-http package:
```bash
npm install --save serverless-http --legacy-peer-deps
```

2. Update the Express app to export a handler function:
```typescript
import serverless from 'serverless-http';

// Express app setup...

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
  });
}

// Export the serverless handler for AWS Lambda
export const handler = serverless(app);
```

3. Build and deploy:
```bash
npx nx build backend && npx nx deploy infrastructure
```

### Go Lambda Issues

#### Issue: Invalid entrypoint

**Symptoms:**
- Error: `fork/exec /var/task/bootstrap: no such file or directory`
- Runtime.InvalidEntrypoint error

**Solution:**
1. Ensure the Go Lambda is built with the correct output name (bootstrap)
2. Update the build command in project.json:

```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "commands": [
      "cd packages/email-processor-go && mkdir -p dist && env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags lambda.norpc -ldflags=\"-s -w\" -o dist/bootstrap ./src/main.go && chmod +x dist/bootstrap"
    ],
    "parallel": false
  },
  "outputs": ["{workspaceRoot}/packages/email-processor-go/dist"]
}
```

3. Update the Lambda function configuration in infrastructure.ts:

```typescript
const emailProcessorLambda = new lambda.Function(this, 'EmailProcessorLambda', {
  code: lambda.Code.fromAsset(path.join(GIT_ROOT, 'packages/email-processor-go/dist')),
  handler: 'bootstrap',
  runtime: lambda.Runtime.PROVIDED_AL2023,
  architecture: lambda.Architecture.X86_64,
  // ...
});
```

#### Issue: Environment variables not being used

**Symptoms:**
- Lambda function tries to access hardcoded table names
- AccessDeniedException for DynamoDB tables

**Solution:**
1. Change constants to variables in Go code:

```go
// DynamoDB table names (will be overridden by environment variables)
var (
  UsersTableName  = "StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F"
  EmailsTableName = "StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10"
)
```

2. Read environment variables in the init function:

```go
func init() {
  // ...
  
  // Get table names from environment variables
  if tableName := os.Getenv("USERS_TABLE_NAME"); tableName != "" {
    UsersTableName = tableName
    log.Printf("Using users table: %s", UsersTableName)
  }
  
  if tableName := os.Getenv("EMAILS_TABLE_NAME"); tableName != "" {
    EmailsTableName = tableName
    log.Printf("Using emails table: %s", EmailsTableName)
  }
}
```

### DynamoDB Issues

#### Issue: DynamoDB streams not triggering Lambda

**Symptoms:**
- No Lambda invocations after adding items to DynamoDB
- No CloudWatch logs for the Lambda function

**Solution:**
1. Verify DynamoDB streams are enabled
2. Check the event source mapping in the AWS console
3. Update the infrastructure code to create the event source mapping

```typescript
const streamProcessorLambda = new lambdaNodejs.NodejsFunction(this, 'StreamProcessorLambda', {
  // ...
});

// Add DynamoDB stream as event source
streamProcessorLambda.addEventSource(
  new lambdaEventSources.DynamoEventSource(usersTable, {
    startingPosition: lambda.StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  })
);
```

## Testing Procedures

### Testing the Stream Processor

1. Add a test user to the DynamoDB table:

```bash
aws dynamodb put-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --item '{"userId":{"S":"test-user-1"},"email":{"S":"test1@example.com"},"name":{"S":"Test User 1"},"lastOrderDate":{"S":"2025-03-21T15:01:00.000Z"},"orderCount":{"N":"10"},"averageOrderValue":{"N":"200"},"preferredCategories":{"L":[{"S":"dresses"},{"S":"tops"}]},"createdAt":{"S":"2025-03-21T15:01:00.000Z"},"updatedAt":{"S":"2025-03-21T15:01:00.000Z"},"engagementScore":{"N":"50"}}' --profile lz-demos
```

2. Check the stream processor Lambda logs:

```bash
sleep 10 && aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-StreamProcessorLambda4F9-UDOnXROK9UfY --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos
```

3. Verify the event was published to SNS in the logs.

### Testing the Email Processor

1. Add a test user with a low engagement score to trigger email generation:

```bash
aws dynamodb put-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --item '{"userId":{"S":"test-user-8"},"email":{"S":"test8@example.com"},"name":{"S":"Test User 8"},"lastOrderDate":{"S":"2024-12-21T16:18:00.000Z"},"orderCount":{"N":"5"},"averageOrderValue":{"N":"100"},"preferredCategories":{"L":[{"S":"pants"},{"S":"shirts"}]},"createdAt":{"S":"2025-03-21T16:18:00.000Z"},"updatedAt":{"S":"2025-03-21T16:18:00.000Z"},"engagementScore":{"N":"30"}}' --profile lz-demos
```

2. Check the email processor Lambda logs:

```bash
sleep 15 && aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos
```

3. Check if emails were saved to the emails table:

```bash
aws dynamodb scan --table-name StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10 --profile lz-demos
```

## Maintenance Procedures

### Updating the OpenRouter API Key

1. Update the `.env.deploy` file with the new API key
2. Redeploy the infrastructure:

```bash
npx nx deploy infrastructure
```

### Updating the Lambda Functions

1. Make changes to the Lambda function code
2. Build the package:

```bash
npx nx build stream-processor
# or
npx nx build email-processor-go
```

3. Redeploy the infrastructure:

```bash
npx nx deploy infrastructure
```

### Cleaning Up Resources

To delete all AWS resources created by the stack:

```bash
cd infrastructure
npx cdk destroy