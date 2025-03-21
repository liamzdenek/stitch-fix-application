#!/bin/bash

# Check if .env.deploy file exists
if [ ! -f "../.env.deploy" ] && [ ! -f ".env.deploy" ]; then
  echo "Error: .env.deploy file not found. Please create it from .env.deploy.example"
  exit 1
fi

# Load environment variables from .env.deploy
if [ -f "../.env.deploy" ]; then
  export $(grep -v '^#' ../.env.deploy | xargs)
else
  export $(grep -v '^#' .env.deploy | xargs)
fi

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "Error: OPENROUTER_API_KEY is not set in .env.deploy"
  exit 1
fi

# Build and deploy the infrastructure
echo "Deploying infrastructure with OpenRouter API key..."
cd ./dist/infrastructure && npx cdk deploy --profile lz-demos --require-approval never --app 'node src/bin/cdk-app.js' --no-color


# Unset environment variables
unset OPENROUTER_API_KEY

echo "Deployment complete!"