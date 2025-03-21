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

### Building the Frontend

```bash
# Build the frontend with the correct API URL
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend

# Build the frontend for local development
export NX_API_URL=http://localhost:3001 && npx nx build frontend

# Serve the frontend locally
npx nx serve frontend
```

### Deploying the Infrastructure

```bash
# Deploy the infrastructure
npx nx deploy infrastructure

# Deploy with environment variables
OPENROUTER_API_KEY=your-api-key npx nx deploy infrastructure
```

### Deploying the Frontend Only

```bash
# Build and deploy the frontend only
./build-and-deploy-frontend.sh

# Manual frontend deployment
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend
aws s3 sync dist/packages/frontend s3://your-bucket-name --profile lz-demos
aws cloudfront create-invalidation --distribution-id your-distribution-id --paths "/*" --profile lz-demos
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

### Testing the API

```bash
# Test the API health endpoint
curl https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/health

# Get all users
curl https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/users

# Get a specific user
curl https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/users/user-id

# Create a new user
curl -X POST https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","name":"John Doe","lastOrderDate":"2025-02-15T12:00:00.000Z","orderCount":5,"averageOrderValue":150,"preferredCategories":["Shirts","Pants","Accessories"]}'

# Update a user's engagement score
curl -X PUT https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/users/user-id \
  -H "Content-Type: application/json" \
  -d '{"engagementScore":15}'

# Get emails for a user
curl https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/users/user-id/emails

# Create an order for a user
curl -X POST https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","items":[{"itemId":"item-1","productId":"product-1","name":"T-Shirt","category":"Shirts","price":29.99,"quantity":1}],"totalValue":29.99}'
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

### Email Processor Issues

#### Issue: Emails not being generated for users with low engagement scores

**Symptoms:**
- Users with low engagement scores are not receiving emails
- No emails are being saved to the DynamoDB table
- Email processor Lambda logs show engagement scores above the threshold

**Root Cause:**
The email processor Lambda was recalculating engagement scores instead of using the ones stored in the database. This was causing scores to be too high (above the 50.0 threshold) and preventing email generation.

**Solution:**
1. Modify the email processor Lambda to use the existing engagement score from the database:

```go
// Use the existing engagement score from the database instead of recalculating
var engagementScore float64
if user.EngagementScore != nil {
    engagementScore = *user.EngagementScore
    debugLog(DEBUG_INFO, "Using existing engagement score from database: %.2f", engagementScore)
} else {
    // If no engagement score exists, use a default low score to trigger email generation
    engagementScore = 10.0
    debugLog(DEBUG_INFO, "No existing score, using default low score: %.2f", engagementScore)
    
    // Update the user's engagement score in DynamoDB
    debugLog(DEBUG_INFO, "Updating user engagement score in DynamoDB: %s -> %.2f", user.UserID, engagementScore)
    if err := updateUserEngagementScore(ctx, user.UserID, engagementScore); err != nil {
        debugLog(DEBUG_ERROR, "Error updating user engagement score: %v", err)
        return fmt.Errorf("error updating user engagement score: %w", err)
    }
    debugLog(DEBUG_INFO, "Successfully updated engagement score in DynamoDB")
}
```

2. Build and deploy the updated Lambda:

```bash
npx nx build email-processor-go
npx nx deploy infrastructure
```

#### Issue: Emails being generated but failing to send

**Symptoms:**
- Emails are being generated and saved to DynamoDB with status "FAILED"
- Email processor Lambda logs show "Email address is not verified" errors

**Root Cause:**
In AWS SES, both the sender and recipient email addresses need to be verified before you can send emails, especially when your SES account is in the sandbox mode (which is the default for new accounts).

**Error Message:**
```
Email address is not verified. The following identities failed the check in region US-WEST-2: noreply@stitchfix.com, test-low@example.com
```

**Solution:**
1. Verify the sender email address in AWS SES:
```bash
aws ses verify-email-identity --email-address noreply@stitchfix.com --profile lz-demos
```

2. Verify recipient email addresses:
```bash
aws ses verify-email-identity --email-address test-low@example.com --profile lz-demos
```

3. For testing purposes, you could modify the Lambda to skip the actual email sending and just mark the emails as "SENT" in DynamoDB:
```go
// Skip actual email sending for testing
debugLog(DEBUG_INFO, "Skipping actual email sending for testing purposes")
if err := updateEmailStatus(ctx, email.EmailID, EmailStatusSent); err != nil {
    debugLog(DEBUG_ERROR, "Error updating email status: %v", err)
    return fmt.Errorf("error updating email status: %w", err)
}
return nil
```

4. Request production access to move out of the SES sandbox:
   - Go to the AWS SES console
   - Click on "Request Production Access"
   - Fill out the form with your use case and expected sending volume
   - Submit the request

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

### Frontend Issues

#### Issue: API URL not configured correctly

**Symptoms:**
- Network errors in the browser console
- API requests failing with CORS errors or 404

**Solution:**
1. Verify the API URL is set correctly during build:
```bash
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend
```

2. Check that the API URL is being used correctly in the API service:
```typescript
// packages/frontend/src/app/services/api.ts
const API_URL = process.env['NX_API_URL'] || 'http://localhost:3001';
```

#### Issue: React Router not working with CloudFront/S3

**Symptoms:**
- 404 errors when refreshing pages or accessing deep links
- CloudFront returns the S3 error page instead of the React app

**Solution:**
1. Configure CloudFront to redirect all 404 errors to index.html:
```typescript
// infrastructure/src/lib/infrastructure.ts
const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
  // ...
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
    },
  ],
});
```

2. Update the React Router configuration to use browser history:
```typescript
// packages/frontend/src/app/app.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  // ...
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

#### Issue: CSS Modules not working

**Symptoms:**
- Styles not being applied
- Class names not being generated correctly

**Solution:**
1. Verify the CSS module import syntax:
```typescript
import styles from './Component.module.css';

// Usage
<div className={styles.container}>...</div>
```

2. Check the Vite configuration:
```typescript
// packages/frontend/vite.config.ts
export default defineConfig({
  // ...
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
```

#### Issue: Environment variables not available in the frontend

**Symptoms:**
- `process.env` is undefined or empty in the frontend code
- API URL not being set correctly

**Solution:**
1. Use the correct Vite environment variable syntax:
```typescript
// Use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

2. Set environment variables with the VITE_ prefix:
```bash
export VITE_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend
```

3. For Nx projects, use the NX_ prefix which gets transformed to VITE_ during build:
```bash
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend
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
aws dynamodb put-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --item '{"userId":{"S":"test-user-low"},"email":{"S":"test-low@example.com"},"name":{"S":"Test User Low"},"lastOrderDate":{"S":"2024-11-21T16:18:00.000Z"},"orderCount":{"N":"2"},"averageOrderValue":{"N":"50"},"preferredCategories":{"L":[{"S":"pants"},{"S":"shirts"}]},"createdAt":{"S":"2025-03-21T16:18:00.000Z"},"updatedAt":{"S":"2025-03-21T16:18:00.000Z"},"engagementScore":{"N":"15"}}' --profile lz-demos
```

2. Update the user to trigger the stream processor:

```bash
aws dynamodb update-item --table-name StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F --key '{"userId":{"S":"test-user-low"}}' --update-expression "SET updatedAt = :updatedAt" --expression-attribute-values '{":updatedAt":{"S":"2025-03-21T14:37:00Z"}}' --profile lz-demos
```

3. Check the email processor Lambda logs:

```bash
sleep 15 && aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --start-time $(date -d "1 minute ago" +%s)000 --profile lz-demos
```

4. Check if emails were saved to the emails table:

```bash
aws dynamodb scan --table-name StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10 --profile lz-demos
```

5. Check for email sending errors:

```bash
aws logs filter-log-events --log-group-name /aws/lambda/StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --filter-pattern "Error sending email" --start-time $(date -d "5 minutes ago" +%s)000 --profile lz-demos
```

6. Directly invoke the email processor Lambda with a test event:

```bash
aws lambda invoke --function-name StitchFixClientEngagement-EmailProcessorLambdaC8F1-jKu6lCFPj6ox --payload $(echo -n '{"Records":[{"body":"{\"Type\":\"Notification\",\"MessageId\":\"test-message-id\",\"TopicArn\":\"arn:aws:sns:us-west-2:129013835758:StitchFixClientEngagementStack-EventsTopic063726A1-y1R1onnJrUvq\",\"Message\":\"{\\\"type\\\":\\\"USER_UPDATED\\\",\\\"payload\\\":{\\\"userId\\\":\\\"test-user-low\\\",\\\"email\\\":\\\"test-low@example.com\\\",\\\"name\\\":\\\"Test User Low\\\",\\\"lastOrderDate\\\":\\\"2024-11-21T16:18:00.000Z\\\",\\\"orderCount\\\":2,\\\"averageOrderValue\\\":50,\\\"preferredCategories\\\":[\\\"pants\\\",\\\"shirts\\\"],\\\"engagementScore\\\":15,\\\"createdAt\\\":\\\"2025-03-21T16:18:00.000Z\\\",\\\"updatedAt\\\":\\\"2025-03-21T14:37:00Z\\\"},\\\"timestamp\\\":\\\"2025-03-21T14:37:00Z\\\"}\",\"Timestamp\":\"2025-03-21T14:37:00Z\",\"SignatureVersion\":\"1\",\"Signature\":\"test-signature\",\"SigningCertURL\":\"https://sns.us-west-2.amazonaws.com/SimpleNotificationService-test.pem\",\"UnsubscribeURL\":\"https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=test-arn\",\"MessageAttributes\":{\"event-type\":{\"Type\":\"String\",\"Value\":\"USER_UPDATED\"}}}"}]}' | base64) /tmp/lambda-output.json --profile lz-demos
```
```

### Testing the Frontend

1. Test the frontend locally:

```bash
# Start the backend locally
cd packages/backend
node src/main.js

# In another terminal, start the frontend
cd packages/frontend
npx nx serve frontend
```

2. Test the deployed frontend:

```bash
# Open the CloudFront URL in a browser
open https://d3coned7g7fmif.cloudfront.net
```

3. Test the engagement score functionality:

- Create a new user
- Update the engagement score to 15%
- Verify the score is updated in the UI
- Check the DynamoDB table to confirm the score was updated

4. Test the order creation functionality:

- Select a user
- Click "Create Order"
- Enter an order value
- Submit the order
- Verify the order count and average order value are updated

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

### Updating the Frontend

1. Make changes to the frontend code
2. Build the frontend:

```bash
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod && npx nx build frontend
```

3. Deploy the frontend:

```bash
./build-and-deploy-frontend.sh
```

### Handling Email Verification in SES

1. Verify the sender email address:

```bash
aws ses verify-email-identity --email-address noreply@stitchfix.com --profile lz-demos
```

2. Verify recipient email addresses:

```bash
aws ses verify-email-identity --email-address test-low@example.com --profile lz-demos
```

3. Check verification status:

```bash
aws ses list-identities --profile lz-demos
aws ses get-identity-verification-attributes --identities noreply@stitchfix.com test-low@example.com --profile lz-demos
```

4. For testing purposes, modify the email processor Lambda to skip actual email sending:

```go
// Skip actual email sending for testing
debugLog(DEBUG_INFO, "Skipping actual email sending for testing purposes")
if err := updateEmailStatus(ctx, email.EmailID, EmailStatusSent); err != nil {
    debugLog(DEBUG_ERROR, "Error updating email status: %v", err)
    return fmt.Errorf("error updating email status: %w", err)
}
return nil
```

5. Request production access to move out of the SES sandbox:
   - Go to the AWS SES console
   - Click on "Request Production Access"
   - Fill out the form with your use case and expected sending volume
   - Submit the request

### Cleaning Up Resources

To delete all AWS resources created by the stack:

```bash
cd infrastructure
npx cdk destroy