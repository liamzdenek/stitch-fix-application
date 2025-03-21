# Stitch Fix Client Engagement Acceleration System - Frontend Redesign Plan

## Overview

The redesigned frontend application will provide a multi-page user interface for managing users, triggering events, and monitoring the email generation process. This will allow for better visualization of the event-driven architecture and provide a more intuitive user experience.

## Architecture

### Technology Stack
- **React**: Core UI library
- **TanStack Router**: For multi-page navigation
- **CSS Modules**: For component-scoped styling (as per project requirements)
- **Context API**: For state management
- **Fetch API**: For backend communication

### File Structure
```
packages/frontend/src/
├── app/
│   ├── app.tsx                 # Main application component with routing
│   ├── app.module.css          # Main application styles
│   ├── context/
│   │   ├── ApiContext.tsx      # API context for backend communication
│   │   └── UserContext.tsx     # User context for user state management
│   ├── components/
│   │   ├── Layout.tsx          # Layout component with header, nav, footer
│   │   ├── Layout.module.css
│   │   ├── UserForm.tsx        # Form for creating/editing users
│   │   ├── UserForm.module.css
│   │   ├── UserCard.tsx        # Card component for user display
│   │   ├── UserCard.module.css
│   │   ├── EmailCard.tsx       # Card component for email display
│   │   ├── EmailCard.module.css
│   │   ├── EngagementScore.tsx # Visualization for engagement scores
│   │   ├── EngagementScore.module.css
│   │   ├── EventFlow.tsx       # Visualization of the event flow
│   │   ├── EventFlow.module.css
│   │   ├── ActionButton.tsx    # Button for triggering actions
│   │   └── ActionButton.module.css
│   ├── pages/
│   │   ├── Dashboard.tsx       # Dashboard page
│   │   ├── Dashboard.module.css
│   │   ├── Users.tsx           # Users listing page
│   │   ├── Users.module.css
│   │   ├── UserDetail.tsx      # User detail page
│   │   ├── UserDetail.module.css
│   │   ├── Emails.tsx          # Emails listing page
│   │   ├── Emails.module.css
│   │   ├── System.tsx          # System visualization page (homepage)
│   │   └── System.module.css
│   ├── services/
│   │   └── api.ts              # API service for backend communication
│   └── utils/
│       ├── formatters.ts       # Utility functions for formatting
│       └── eventTriggers.ts    # Functions for triggering events
└── main.tsx                    # Entry point
```

## Page Designs

### 1. System Page (Homepage)
- **Purpose**: Visualize the event flow and system architecture, serve as the main entry point
- **Features**:
  - Static diagram of the event-driven architecture
  - Links to other pages (Users, Emails, Dashboard)
  - Brief explanation of system components
  - Documentation links
- **Data Requirements**:
  - None (static content)

### 2. Dashboard Page
- **Purpose**: Provide an overview of the system's status and activity
- **Features**:
  - Summary metrics (total users, emails sent, avg. engagement score)
  - Quick action buttons (create user, view all users, view all emails)
  - Engagement score distribution chart
  - Refresh button to update data
- **Data Requirements**:
  - User count and summary statistics
  - Email count and summary statistics

### 3. Users Page
- **Purpose**: List all users and provide user creation functionality
- **Features**:
  - User listing
  - User creation form
  - Quick view of engagement scores
  - Links to user detail pages
  - Refresh button to update data
- **Data Requirements**:
  - Complete user list
  - User creation API endpoint

### 4. User Detail Page
- **Purpose**: View and manage a specific user
- **Features**:
  - User information display
  - Engagement score visualization
  - Action buttons to trigger events:
    - Update user information
    - Create a new order
    - Force email generation (override engagement score)
  - List of emails sent to the user
  - Refresh button to update data
- **Data Requirements**:
  - User details
  - User's email history
  - API endpoints for user actions

### 5. Emails Page
- **Purpose**: View all generated emails
- **Features**:
  - Email listing
  - Email content preview
  - Status indicators (generated, sent, failed)
  - Links to associated users
  - Refresh button to update data
- **Data Requirements**:
  - Complete email list
  - Email status information

## Component Designs

### Layout Component
- Header with logo and title
- Navigation menu with links to all pages
- Footer with copyright information
- Responsive design for different screen sizes

### UserForm Component
- Form for creating/editing users
- Fields:
  - Name
  - Email
  - Order count
  - Average order value
  - Preferred categories (comma-separated)
  - Last order date (date picker)
- Validation for required fields
- Submit button

### UserCard Component
- Card displaying user information
- Engagement score visualization
- Quick action buttons
- Link to user detail page

### EmailCard Component
- Card displaying email information
- Subject and preview of content
- Status indicator
- Timestamp
- Link to associated user

### EngagementScore Component
- Visual representation of engagement score
- Color-coded (red for low, green for high)
- Numerical display
- Tooltip with score breakdown

### EventFlow Component
- Static visual representation of the event flow
- Educational tooltips explaining each component
- Links to relevant pages

### ActionButton Component
- Button for triggering actions
- Loading state
- Success/error feedback
- Confirmation dialog for destructive actions

## User Flows

### Creating a New User
1. Navigate to Users page
2. Fill out the user creation form
3. Submit the form
4. View the newly created user in the list
5. (Optional) Navigate to the user detail page

### Triggering an Order Event
1. Navigate to User Detail page
2. Click "Create Order" button
3. Fill out order details (items, value)
4. Submit the form
5. Click refresh to see the user's engagement score update
6. Monitor for email generation if score drops below threshold

### Forcing Email Generation
1. Navigate to User Detail page
2. Click "Generate Email" button
3. Confirm the action
4. Click refresh to update the view
5. View the generated email in the user's email list

### Monitoring System Activity
1. Navigate to Dashboard page
2. View metrics and statistics
3. Check engagement score distribution
4. Click refresh to update the data
5. Navigate to specific users or emails of interest

## API Review

After reviewing the backend code, I've determined that the existing API endpoints are sufficient for our needs:

### Existing API Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get a specific user
- `POST /api/users` - Create a new user
- `PUT /api/users/:userId` - Update a user
- `DELETE /api/users/:userId` - Delete a user
- `GET /api/emails` - Get all emails
- `GET /api/emails/:emailId` - Get a specific email
- `GET /api/users/:userId/emails` - Get emails for a specific user
- `POST /api/orders` - Create a new order

These endpoints provide all the functionality needed for our frontend application. No new API endpoints are required.

### API Context
- Provide API access to all components
- Handle loading and error states
- Cache responses when appropriate
- Provide methods for all API operations

## State Management

### User Context
- Store current user list
- Store selected user
- Provide methods for user operations

### Application State
- Current page/route
- UI state (sidebar open/closed, modals, etc.)
- Loading states
- Error messages

## Responsive Design

- Mobile-first approach
- Breakpoints:
  - Small: 0-576px (mobile)
  - Medium: 577px-992px (tablet)
  - Large: 993px+ (desktop)
- Responsive navigation (hamburger menu on mobile)
- Flexible layouts using CSS Grid and Flexbox
- Optimized visualizations for different screen sizes

## Accessibility Considerations

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly content
- Focus management

## Performance Optimizations

- Code splitting by route
- Lazy loading of components
- Memoization of expensive calculations
- Efficient re-rendering with React.memo and useMemo
- Optimized API calls with caching

## Implementation Strategy

### Phase 1: Core Structure
1. Set up TanStack Router
2. Create Layout component
3. Implement System page (homepage)
4. Set up API service

### Phase 2: User Management
1. Implement Users page
2. Create UserForm component
3. Implement user creation functionality
4. Develop UserDetail page

### Phase 3: Email Visualization
1. Implement Emails page
2. Create EmailCard component
3. Connect to user detail page

### Phase 4: Event Triggering
1. Implement order creation functionality
2. Add force email generation feature
3. Create event visualization components

### Phase 5: Dashboard
1. Implement Dashboard page with metrics
2. Add refresh functionality to all pages

## Testing Strategy

- Component testing with React Testing Library
- Integration testing of user flows
- API mocking for consistent test results
- Accessibility testing
- Cross-browser testing
- Responsive design testing

## Deployment

- Build with `npx nx build frontend`
- Deploy to S3/CloudFront using existing deployment script
- Configure environment variables for API URL