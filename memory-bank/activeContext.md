# Active Context: Stitch Fix Client Engagement Acceleration System

## Current Work Focus

We are currently in the planning and architecture phase of the Client Engagement Acceleration System. The primary focus is on:

1. Finalizing the system architecture
2. Defining API contracts and data models
3. Planning the implementation approach
4. Preparing for development kickoff

## Recent Decisions

1. **Architecture Approach**: Decided to use DynamoDB Streams to capture changes and trigger event processing, with an intermediate lambda publishing to SNS/SQS for durability and rate control.

2. **Frontend Consolidation**: Decided to consolidate all UI functionality into a single React application rather than separate apps for user management and email dashboard.

3. **Backend Structure**: Decided to flatten the backend services into a single application for the demo, rather than implementing true microservice boundaries.

4. **Deployment Strategy**: Decided to use actual AWS deployments for testing rather than local development mocks.

5. **LLM Integration**: Selected OpenRouter as the LLM service provider for generating personalized emails.

## Next Steps

1. **Initialize Project Structure**:
   - Create Nx workspace
   - Set up packages using `nx generate` commands
   - Configure TypeScript and linting

2. **Implement Shared Package**:
   - Define data models with Zod schemas
   - Create utility functions
   - Set up event types

3. **Implement Infrastructure**:
   - Create CDK stack for AWS resources
   - Set up DynamoDB tables with streams
   - Configure SNS, SQS, and Lambda functions

4. **Implement Backend**:
   - Create Express API endpoints
   - Implement database operations
   - Set up health checks and logging

5. **Implement Stream Processor**:
   - Create DynamoDB stream handler
   - Implement event transformation
   - Set up SNS publishing

6. **Implement Email Processor**:
   - Create SQS event handler
   - Implement engagement scoring algorithm
   - Set up OpenRouter integration
   - Implement email generation

7. **Implement Frontend**:
   - Create React application structure
   - Implement user management interface
   - Implement email dashboard
   - Set up API integration

8. **Deploy and Test**:
   - Deploy infrastructure to AWS
   - Deploy application components
   - Test end-to-end flow
   - Prepare demo script

## Active Considerations

1. **Engagement Scoring Algorithm**:
   - Currently planning a simple weighted approach based on order recency, frequency, and value
   - Need to determine appropriate thresholds for triggering email generation
   - Consider how to handle edge cases (new users, users with no orders, etc.)

2. **Email Personalization Strategy**:
   - Defining the prompt structure for OpenRouter
   - Determining what user data to include for personalization
   - Balancing personalization with privacy considerations

3. **Error Handling and Resilience**:
   - Following the "no fallback" rule - either the main path works or it fails and logs
   - Need to implement comprehensive error logging
   - Consider retry strategies for transient failures

4. **Deployment Pipeline**:
   - Planning CDK deployment strategy
   - Determining how to handle environment variables securely
   - Setting up build and deployment scripts

5. **Demo Flow**:
   - Planning the demonstration narrative
   - Creating test data for the demo
   - Preparing to showcase both technical excellence and business value

## Open Questions

1. How should we handle rate limiting for the OpenRouter API?
2. What is the appropriate engagement score threshold for triggering email generation?
3. How should we structure the React application for optimal user experience?
4. What metrics should we track to demonstrate the effectiveness of the system?
5. How can we best showcase the scalability of the architecture during the demo?

## Current Blockers

None at this time. The architecture has been defined and we are ready to begin implementation.