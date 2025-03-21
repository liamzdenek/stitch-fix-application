#!/bin/bash

# Set the API URL environment variable
export NX_API_URL=https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod

# Build the frontend
npx nx build frontend

# Deploy the infrastructure (which will deploy the frontend to S3/CloudFront)
npx nx deploy infrastructure