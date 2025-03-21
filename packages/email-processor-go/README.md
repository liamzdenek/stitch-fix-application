# Email Processor (Go)

This package contains a Go implementation of the Email Processor Lambda function for the Stitch Fix Client Engagement Acceleration System.

## Overview

The Email Processor is responsible for:

1. Processing user events from SQS (originally from DynamoDB Streams via SNS)
2. Calculating engagement scores for users
3. Generating personalized emails using OpenRouter for users with low engagement scores
4. Storing generated emails in DynamoDB

## Implementation Status

**Note**: This implementation is currently incomplete. The main structure and algorithm are in place, but the following components need to be completed:

- [ ] Complete the `updateUser` function to update users in DynamoDB
- [ ] Implement the `generateEmail` function to call OpenRouter API
- [ ] Complete the `storeEmail` function to store emails in DynamoDB
- [ ] Add proper error handling and retries
- [ ] Add comprehensive logging

These components will be implemented after the other parts of the pipeline are in place.

## Dependencies

- AWS Lambda Go Runtime
- AWS SDK for Go v2
- DynamoDB
- SQS
- OpenRouter API

## Environment Variables

- `USERS_TABLE_NAME`: Name of the DynamoDB users table
- `EMAILS_TABLE_NAME`: Name of the DynamoDB emails table
- `OPENROUTER_API_KEY`: API key for OpenRouter
- `ENGAGEMENT_THRESHOLD`: Threshold for generating emails (default: 50)
- `AWS_REGION`: AWS region

## Building

```bash
go build -o dist/email-processor
```

## Testing

```bash
go test ./...
```

## Deployment

This package is integrated with the Nx monorepo and will be built and deployed as part of the CDK deployment process.