import React, { useState, useEffect } from 'react';
import styles from './Emails.module.css';
import Layout from '../components/Layout';
import EmailCard from '../components/EmailCard';
import ActionButton from '../components/ActionButton';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';

export const Emails: React.FC = () => {
  const { api, isLoading: apiIsLoading } = useApi();
  const { users } = useUser();
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch emails on component mount
  useEffect(() => {
    fetchEmails();
  }, []);
  
  // Fetch emails
  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEmails = await api.email.getEmails();
      setEmails(fetchedEmails);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user ? user.name : userId;
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Emails</h1>
          <ActionButton
            label="Refresh"
            onClick={fetchEmails}
            variant="secondary"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            }
            disabled={isLoading || apiIsLoading}
          />
        </div>
        
        {error && (
          <div className={styles.error}>
            Error loading emails: {error.message}
          </div>
        )}
        
        {isLoading ? (
          <div className={styles.loading}>Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className={styles.empty}>
            <p>No emails found.</p>
            <p>Create users and trigger events to generate emails.</p>
          </div>
        ) : (
          <div className={styles.emailsList}>
            {emails.map(email => (
              <EmailCard 
                key={email.emailId} 
                email={email} 
                userName={getUserName(email.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Emails;