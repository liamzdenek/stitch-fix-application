import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User } from '../services/api';
import { useApi } from './ApiContext';

// Define the user context type
interface UserContextType {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: Error | null;
  fetchUsers: () => Promise<void>;
  selectUser: (userId: string) => Promise<void>;
  clearSelectedUser: () => void;
  createUser: (user: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUser: (userId: string, user: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
}

// Create the user context with a default value
const UserContext = createContext<UserContextType>({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  fetchUsers: async () => {},
  selectUser: async () => {},
  clearSelectedUser: () => {},
  createUser: async () => ({} as User),
  updateUser: async () => ({} as User),
  deleteUser: async () => {},
});

// Props for the user provider
interface UserProviderProps {
  children: ReactNode;
}

// User provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { api, isLoading: apiIsLoading } = useApi();
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await api.user.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [api.user]);

  // Select a user by ID
  const selectUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // First check if the user is already in the users array
      let user = users.find(u => u.userId === userId);
      
      // If not, fetch the user from the API
      if (!user) {
        user = await api.user.getUser(userId);
      }
      
      setSelectedUser(user);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [api.user, users]);

  // Clear the selected user
  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // Create a new user
  const createUser = useCallback(async (user: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await api.user.createUser(user);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api.user]);

  // Update a user
  const updateUser = useCallback(async (userId: string, user: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await api.user.updateUser(userId, user);
      setUsers(prevUsers => 
        prevUsers.map(u => u.userId === userId ? updatedUser : u)
      );
      
      // Update selected user if it's the one being updated
      if (selectedUser && selectedUser.userId === userId) {
        setSelectedUser(updatedUser);
      }
      
      return updatedUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api.user, selectedUser]);

  // Delete a user
  const deleteUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.user.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(u => u.userId !== userId));
      
      // Clear selected user if it's the one being deleted
      if (selectedUser && selectedUser.userId === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api.user, selectedUser]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <UserContext.Provider
      value={{
        users,
        selectedUser,
        isLoading: isLoading || apiIsLoading,
        error,
        fetchUsers,
        selectUser,
        clearSelectedUser,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

export default UserContext;