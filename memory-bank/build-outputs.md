# Stitch Fix Client Engagement Acceleration System - Build Outputs

This document provides information about the build output locations for all packages in the Stitch Fix Client Engagement Acceleration System.

## Overview

The system is built using an Nx monorepo structure with multiple packages. Each package has its own build output location and format. The main build output directory is `dist/` at the root of the project.

## Package Build Outputs

### Shared Package

**Location**: `dist/packages/shared/`

**Key Files**:
- `package.json` - Package metadata
- `README.md` - Package documentation
- `src/index.js` - Main entry point
- `src/index.d.ts` - TypeScript type definitions
- `src/lib/*.js` - Compiled JavaScript files
- `src/lib/*.d.ts` - TypeScript type definitions
- `src/lib/*.js.map` - Source maps

**Description**: The shared package contains common models, schemas, event types, and utility functions used by other packages. It is built as a TypeScript library.

### Stream Processor

**Location**: `dist/packages/stream-processor/`

**Key Files**:
- `main.js` - Lambda function entry point
- `package.json` - Package metadata
- `package-lock.json` - Dependency lock file
- `packages/` - Node modules for deployment

**Description**: The stream processor is a Lambda function that processes DynamoDB stream events and publishes them to SNS. It is built as a Node.js Lambda function.

### Backend API

**Location**: `dist/packages/backend/`

**Key Files**:
- `main.js` - Express.js API entry point
- `package.json` - Package metadata
- `package-lock.json` - Dependency lock file
- `packages/` - Node modules for deployment

**Description**: The backend API is an Express.js API for managing users and emails. It provides RESTful endpoints for CRUD operations. It is built as a Node.js Lambda function.

### Frontend UI

**Location**: `dist/packages/frontend/`

**Key Files**:
- `index.html` - HTML entry point
- `assets/index-*.js` - Bundled JavaScript
- `assets/index-*.css` - Bundled CSS
- `favicon.ico` - Favicon

**Description**: The frontend UI is a React application for monitoring user engagement. It is built using Vite and outputs static files for deployment to S3/CloudFront.

### Infrastructure

**Location**: `dist/infrastructure/`

**Key Files**:
- `package.json` - Package metadata
- `README.md` - Package documentation
- `src/index.js` - Main entry point
- `src/index.d.ts` - TypeScript type definitions
- `src/lib/infrastructure.js` - Compiled CDK stack
- `src/lib/infrastructure.d.ts` - TypeScript type definitions
- `src/lib/infrastructure.js.map` - Source maps

**Description**: The infrastructure package contains the AWS CDK stack for defining AWS resources. It is built as a TypeScript library.

### Email Processor (Go)

**Location**: `packages/email-processor-go/dist/`

**Key Files**:
- `email-processor` - Compiled Go binary

**Description**: The email processor is a Go Lambda function that processes events from SQS, calculates engagement scores, generates emails using OpenAI, and sends them via SES. It is built as a Go binary.

## Build Commands

### Building All Packages

To build all packages, run:

```bash
npx nx run-many --target=build --all
```

### Building Individual Packages

To build individual packages, run:

```bash
npx nx build <package-name>
```

For example:

```bash
npx nx build shared
npx nx build stream-processor
npx nx build backend
npx nx build frontend
npx nx build infrastructure
```

### Building Email Processor (Go)

To build the email processor (Go), run:

```bash
cd packages/email-processor-go
mkdir -p dist
go build -o dist/email-processor src/main.go
```

## Deployment Artifacts

When deploying to AWS, the following artifacts are used:

1. **Infrastructure**: The CDK stack in `dist/infrastructure/` is used to deploy all AWS resources.

2. **Lambda Functions**:
   - Stream Processor: `dist/packages/stream-processor/`
   - Backend API: `dist/packages/backend/`
   - Email Processor (Go): `packages/email-processor-go/dist/email-processor`

3. **Frontend**: The static files in `dist/packages/frontend/` are deployed to S3 and served via CloudFront.

## Verification

To verify the build outputs, you can check the existence of the key files mentioned above for each package. The build process should generate all necessary files for deployment.

For the TypeScript packages, you should see compiled JavaScript files, TypeScript type definitions, and source maps. For the Go package, you should see a compiled binary.

The build outputs have been verified and are ready for deployment to AWS.