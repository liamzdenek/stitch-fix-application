import { StrictMode } from 'react';
import {
  Router,
  Route,
  RootRoute,
  RouterProvider,
  createHashHistory,
} from '@tanstack/react-router';
import { ApiProvider } from './context/ApiContext';
import { UserProvider } from './context/UserContext';

// Pages
import System from './pages/System';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Emails from './pages/Emails';

// Create routes
const rootRoute = new RootRoute();

// System page (homepage)
const systemRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: System,
});

// Dashboard page
const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
});

// Users page
const usersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: Users,
});

// User detail page
const userDetailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserDetail,
});

// Emails page
const emailsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/emails',
  component: Emails,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  systemRoute,
  dashboardRoute,
  usersRoute,
  userDetailRoute,
  emailsRoute,
]);

// Create the router
const router = new Router({
  routeTree,
  history: createHashHistory(),
});

// App component
export function App() {
  return (
    <StrictMode>
      <ApiProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </ApiProvider>
    </StrictMode>
  );
}

export default App;
