import React, { createContext, useContext, ReactNode } from 'react';
import api, { User, Email, EmailStatus, OrderItem } from '../services/api';

// Define the API context type
interface ApiContextType {
  api: typeof api;
  isLoading: boolean;
  error: Error | null;
}

// Create the API context with a default value
const ApiContext = createContext<ApiContextType>({
  api,
  isLoading: false,
  error: null,
});

// Props for the API provider
interface ApiProviderProps {
  children: ReactNode;
}

// API provider component
export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Create a wrapped version of the API that handles loading and error states
  const wrappedApi = React.useMemo(() => {
    // Create a proxy to intercept API calls
    return {
      user: {
        getUsers: async () => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.getUsers();
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        getUser: async (userId: string) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.getUser(userId);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        createUser: async (user: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.createUser(user);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        updateUser: async (userId: string, user: Partial<User>) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.updateUser(userId, user);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        deleteUser: async (userId: string) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.deleteUser(userId);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        getUserEmails: async (userId: string) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.user.getUserEmails(userId);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
      },
      email: {
        getEmails: async () => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.email.getEmails();
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
        getEmail: async (emailId: string) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.email.getEmail(emailId);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
      },
      order: {
        createOrder: async (order: { 
          userId: string; 
          items: Array<OrderItem>; 
          totalValue: number; 
        }) => {
          setIsLoading(true);
          setError(null);
          try {
            const result = await api.order.createOrder(order);
            return result;
          } catch (err) {
            setError(err as Error);
            throw err;
          } finally {
            setIsLoading(false);
          }
        },
      },
    };
  }, []);

  return (
    <ApiContext.Provider value={{ api: wrappedApi, isLoading, error }}>
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook to use the API context
export const useApi = () => useContext(ApiContext);

export default ApiContext;