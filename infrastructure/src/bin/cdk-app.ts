#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StitchFixClientEngagementStack } from '../lib/infrastructure';

const app = new cdk.App();
new StitchFixClientEngagementStack(app, 'StitchFixClientEngagementStack', {
  env: {
    account: process.env['CDK_DEFAULT_ACCOUNT'],
    region: process.env['CDK_DEFAULT_REGION'] || 'us-east-1',
  },
  description: 'Stitch Fix Client Engagement Acceleration System',
});