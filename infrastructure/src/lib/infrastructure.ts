import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';

// Find the git root directory
function findGitRoot(): string {
  let currentDir = process.cwd();
  while (!fs.existsSync(path.join(currentDir, '.git'))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error('Could not find git root directory');
    }
    currentDir = parentDir;
  }
  return currentDir;
}

const GIT_ROOT = findGitRoot();

export class StitchFixClientEngagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes only
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const emailsTable = new dynamodb.Table(this, 'EmailsTable', {
      partitionKey: { name: 'emailId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes only
    });

    // Add GSI for emails by userId
    emailsTable.addGlobalSecondaryIndex({
      indexName: 'userIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SNS Topic for events
    const eventsTopic = new sns.Topic(this, 'EventsTopic', {
      displayName: 'Client Engagement Events',
    });

    // SQS Queue for email processing
    const emailQueue = new sqs.Queue(this, 'EmailQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Subscribe the email queue to the events topic
    eventsTopic.addSubscription(new subscriptions.SqsSubscription(emailQueue));

    // Stream Processor Lambda
    const streamProcessorLambda = new lambda.Function(this, 'StreamProcessorLambda', {
      code: lambda.Code.fromAsset(path.join(GIT_ROOT, 'dist/packages/stream-processor')),
      handler: 'main.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SNS_TOPIC_ARN: eventsTopic.topicArn,
        USERS_TABLE_NAME: usersTable.tableName,
        ORDERS_TABLE_NAME: usersTable.tableName, // Reusing users table for demo
      },
    });

    // Grant the stream processor permissions
    usersTable.grantStreamRead(streamProcessorLambda);
    eventsTopic.grantPublish(streamProcessorLambda);

    // Configure the Lambda to be triggered by the DynamoDB stream
    streamProcessorLambda.addEventSource(new lambdaEventSources.DynamoEventSource(usersTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      retryAttempts: 3,
    }));

    // Email Processor Lambda (Go)
    const emailProcessorLambda = new lambda.Function(this, 'EmailProcessorLambda', {
      code: lambda.Code.fromAsset(path.join(GIT_ROOT, 'packages/email-processor-go/dist')),
      handler: 'bootstrap',
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        EMAILS_TABLE_NAME: emailsTable.tableName,
        ['OPENROUTER_API_KEY']: process.env['OPENROUTER_API_KEY'] || 'dummy-key', // Should be set in deployment
      },
    });

    // Grant the email processor permissions
    usersTable.grantReadWriteData(emailProcessorLambda);
    emailsTable.grantReadWriteData(emailProcessorLambda);
    emailProcessorLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // Configure the Lambda to be triggered by the SQS queue
    emailProcessorLambda.addEventSource(new lambdaEventSources.SqsEventSource(emailQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(30),
    }));

    // Backend API Lambda
    const backendLambda = new lambda.Function(this, 'BackendLambda', {
      code: lambda.Code.fromAsset(path.join(GIT_ROOT, 'dist/packages/backend')),
      handler: 'main.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        EMAILS_TABLE_NAME: emailsTable.tableName,
        SNS_TOPIC_ARN: eventsTopic.topicArn,
      },
    });

    // Grant the backend API permissions
    usersTable.grantReadWriteData(backendLambda);
    emailsTable.grantReadWriteData(backendLambda);
    eventsTopic.grantPublish(backendLambda);

    // Frontend hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes only
      autoDeleteObjects: true, // For demo purposes only
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy frontend assets
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.join(GIT_ROOT, 'dist/packages/frontend'))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'The name of the users table',
    });

    new cdk.CfnOutput(this, 'EmailsTableName', {
      value: emailsTable.tableName,
      description: 'The name of the emails table',
    });

    new cdk.CfnOutput(this, 'EventsTopicArn', {
      value: eventsTopic.topicArn,
      description: 'The ARN of the events topic',
    });

    new cdk.CfnOutput(this, 'EmailQueueUrl', {
      value: emailQueue.queueUrl,
      description: 'The URL of the email queue',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'The URL of the frontend',
    });
  }
}
