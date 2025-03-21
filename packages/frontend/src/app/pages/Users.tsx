import React, { useState } from 'react';
import styles from './Users.module.css';
import Layout from '../components/Layout';
import UserCard from '../components/UserCard';
import UserForm from '../components/UserForm';
import ActionButton from '../components/ActionButton';
import { useUser } from '../context/UserContext';
import { User } from '../services/api';

export const Users: React.FC = () => {
  const { users, isLoading, error, fetchUsers, createUser } = useUser();
  const [showForm, setShowForm] = useState(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    await fetchUsers();
  };
  
  // Handle create user
  const handleCreateUser = async (userData: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => {
    await createUser(userData);
    setShowForm(false);
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Users</h1>
          <div className={styles.actions}>
            <ActionButton
              label="Refresh"
              onClick={handleRefresh}
              variant="secondary"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              }
              disabled={isLoading}
            />
            <ActionButton
              label={showForm ? 'Cancel' : 'Add User'}
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? 'secondary' : 'primary'}
              icon={
                showForm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )
              }
            />
          </div>
        </div>
        
        {error && (
          <div className={styles.error}>
            Error loading users: {error.message}
          </div>
        )}
        
        {showForm && (
          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Create New User</h2>
            <UserForm onSubmit={handleCreateUser} />
          </div>
        )}
        
        {isLoading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>
            <p>No users found. Create a new user to get started.</p>
          </div>
        ) : (
          <div className={styles.userGrid}>
            {users.map(user => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;