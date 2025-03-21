import React, { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import styles from './UserDetail.module.css';
import Layout from '../components/Layout';
import EngagementScore from '../components/EngagementScore';
import ActionButton from '../components/ActionButton';
import EmailCard from '../components/EmailCard';
import { useUser } from '../context/UserContext';
import { useApi } from '../context/ApiContext';
import { useEventTriggers } from '../utils/eventTriggers';
import { formatDate, formatCurrency, formatList } from '../utils/formatters';

export const UserDetail: React.FC = () => {
  const { userId } = useParams({ from: '/users/$userId' });
  const { users, selectedUser, selectUser, updateUser, isLoading: userIsLoading } = useUser();
  const { api, isLoading: apiIsLoading } = useApi();
  const { updateLastOrderDate, forceGenerateEmail } = useEventTriggers();
  
  const [userEmails, setUserEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderValue, setOrderValue] = useState(100);
  
  // Fetch user and emails on component mount
  useEffect(() => {
    const fetchUserAndEmails = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        await selectUser(userId);
        const emails = await api.user.getUserEmails(userId);
        setUserEmails(emails);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndEmails();
  }, [userId, selectUser, api.user]);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await selectUser(userId);
      const emails = await api.user.getUserEmails(userId);
      setUserEmails(emails);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle create order
  const handleCreateOrder = async () => {
    if (!selectedUser || !userId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await updateLastOrderDate(userId, orderValue);
      setOrderModalOpen(false);
      await handleRefresh();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle update engagement score
  const handleUpdateEngagementScore = async (score: number) => {
    if (!selectedUser || !userId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Now we can directly send the engagement score to the backend
      // since we've updated the API to respect this field
      await updateUser(userId, {
        engagementScore: score
      });
      
      await handleRefresh();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!selectedUser && !isLoading && !userIsLoading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link to="/users" className={styles.backLink}>
              &larr; Back to Users
            </Link>
            <h1 className={styles.title}>User Not Found</h1>
          </div>
          <div className={styles.error}>
            The user with ID {userId} could not be found.
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/users" className={styles.backLink}>
              &larr; Back to Users
            </Link>
            <h1 className={styles.title}>
              {selectedUser ? selectedUser.name : 'Loading...'}
            </h1>
          </div>
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
              disabled={isLoading || userIsLoading || apiIsLoading}
            />
          </div>
        </div>
        
        {error && (
          <div className={styles.error}>
            Error: {error.message}
          </div>
        )}
        
        {isLoading || userIsLoading ? (
          <div className={styles.loading}>Loading user details...</div>
        ) : selectedUser && (
          <>
            <div className={styles.userInfo}>
              <div className={styles.userCard}>
                <div className={styles.userHeader}>
                  <h2 className={styles.userTitle}>User Information</h2>
                  <div className={styles.userScore}>
                    <span className={styles.scoreLabel}>Engagement Score:</span>
                    <EngagementScore score={selectedUser.engagementScore || 0} />
                  </div>
                </div>
                
                <div className={styles.userDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{selectedUser.email}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Last Order Date:</span>
                    <span className={styles.detailValue}>{formatDate(selectedUser.lastOrderDate)}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Order Count:</span>
                    <span className={styles.detailValue}>{selectedUser.orderCount}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Average Order Value:</span>
                    <span className={styles.detailValue}>{formatCurrency(selectedUser.averageOrderValue)}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Preferred Categories:</span>
                    <span className={styles.detailValue}>{formatList(selectedUser.preferredCategories)}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Last Email Date:</span>
                    <span className={styles.detailValue}>
                      {selectedUser.lastEmailDate ? formatDate(selectedUser.lastEmailDate) : 'Never'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created At:</span>
                    <span className={styles.detailValue}>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Updated At:</span>
                    <span className={styles.detailValue}>{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.userActions}>
                <h2 className={styles.actionsTitle}>Actions</h2>
                
                <div className={styles.actionButtons}>
                  <ActionButton
                    label="Create Order"
                    onClick={() => setOrderModalOpen(true)}
                    variant="primary"
                    disabled={isLoading}
                  />
                  
                  <div className={styles.scoreButtons}>
                    <h3 className={styles.scoreButtonsTitle}>Set Engagement Score</h3>
                    <div className={styles.scoreButtonsGroup}>
                      <ActionButton
                        label="15%"
                        onClick={() => handleUpdateEngagementScore(15)}
                        variant="danger"
                        disabled={isLoading}
                      />
                      
                      <ActionButton
                        label="90%"
                        onClick={() => handleUpdateEngagementScore(90)}
                        variant="success"
                        disabled={isLoading}
                      />
                      
                      <ActionButton
                        label="100%"
                        onClick={() => handleUpdateEngagementScore(100)}
                        variant="success"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                
                {orderModalOpen && (
                  <div className={styles.orderModal}>
                    <h3 className={styles.modalTitle}>Create New Order</h3>
                    
                    <div className={styles.modalForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="orderValue" className={styles.formLabel}>Order Value ($)</label>
                        <input
                          type="number"
                          id="orderValue"
                          value={orderValue}
                          onChange={(e) => setOrderValue(Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className={styles.formInput}
                        />
                      </div>
                      
                      <div className={styles.modalActions}>
                        <ActionButton
                          label="Cancel"
                          onClick={() => setOrderModalOpen(false)}
                          variant="secondary"
                        />
                        
                        <ActionButton
                          label="Create Order"
                          onClick={handleCreateOrder}
                          variant="primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.emailsSection}>
              <h2 className={styles.emailsTitle}>User Re-Engagement Emails</h2>
              
              {userEmails.length === 0 ? (
                <div className={styles.noEmails}>
                  <p>No emails have been generated for this user yet.</p>
                  <p>Set a low engagement score to trigger email generation.</p>
                </div>
              ) : (
                <div className={styles.emailsList}>
                  {userEmails.map(email => (
                    <EmailCard key={email.emailId} email={email} userName={selectedUser.name} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserDetail;