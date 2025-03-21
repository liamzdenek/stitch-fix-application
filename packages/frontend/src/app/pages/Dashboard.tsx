import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Dashboard.module.css';
import Layout from '../components/Layout';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import { formatNumber, formatPercentage } from '../utils/formatters';
import ActionButton from '../components/ActionButton';
import EngagementScore from '../components/EngagementScore';

export const Dashboard: React.FC = () => {
  const { api, isLoading: apiIsLoading } = useApi();
  const { users, fetchUsers, isLoading: usersIsLoading } = useUser();
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch emails on component mount
  useEffect(() => {
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
    
    fetchEmails();
  }, [api.email]);
  
  // Calculate metrics
  const totalUsers = users.length;
  const totalEmails = emails.length;
  
  // Calculate average engagement score
  const avgEngagementScore = users.length > 0
    ? users.reduce((sum, user) => sum + (user.engagementScore || 0), 0) / users.length
    : 0;
  
  // Count users by engagement score range
  const engagementRanges = {
    critical: users.filter(user => (user.engagementScore || 0) < 30).length,
    atRisk: users.filter(user => (user.engagementScore || 0) >= 30 && (user.engagementScore || 0) < 50).length,
    moderate: users.filter(user => (user.engagementScore || 0) >= 50 && (user.engagementScore || 0) < 70).length,
    good: users.filter(user => (user.engagementScore || 0) >= 70).length,
  };
  
  // Count emails by status
  const emailsByStatus = emails.reduce((acc: Record<string, number>, email) => {
    acc[email.status] = (acc[email.status] || 0) + 1;
    return acc;
  }, {});
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchUsers();
      const fetchedEmails = await api.email.getEmails();
      setEmails(fetchedEmails);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <ActionButton
            label="Refresh Data"
            onClick={handleRefresh}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            }
            disabled={isLoading || apiIsLoading || usersIsLoading}
          />
        </div>
        
        {error && (
          <div className={styles.error}>
            Error loading data: {error.message}
          </div>
        )}
        
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{formatNumber(totalUsers)}</div>
            <div className={styles.metricLabel}>Total Users</div>
            <Link to="/users" className={styles.metricLink}>View All Users</Link>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{formatNumber(totalEmails)}</div>
            <div className={styles.metricLabel}>Total Emails</div>
            <Link to="/emails" className={styles.metricLink}>View All Emails</Link>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              <EngagementScore score={avgEngagementScore} showValue={false} size="large" />
              <span className={styles.scoreValue}>{formatPercentage(avgEngagementScore)}</span>
            </div>
            <div className={styles.metricLabel}>Average Engagement Score</div>
          </div>
        </div>
        
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Engagement Score Distribution</h2>
            <div className={styles.engagementChart}>
              <div className={styles.chartBar}>
                <div 
                  className={`${styles.chartBarSegment} ${styles.critical}`} 
                  style={{ width: `${(engagementRanges.critical / totalUsers) * 100}%` }}
                  title={`Critical: ${engagementRanges.critical} users`}
                />
                <div 
                  className={`${styles.chartBarSegment} ${styles.atRisk}`} 
                  style={{ width: `${(engagementRanges.atRisk / totalUsers) * 100}%` }}
                  title={`At Risk: ${engagementRanges.atRisk} users`}
                />
                <div 
                  className={`${styles.chartBarSegment} ${styles.moderate}`} 
                  style={{ width: `${(engagementRanges.moderate / totalUsers) * 100}%` }}
                  title={`Moderate: ${engagementRanges.moderate} users`}
                />
                <div 
                  className={`${styles.chartBarSegment} ${styles.good}`} 
                  style={{ width: `${(engagementRanges.good / totalUsers) * 100}%` }}
                  title={`Good: ${engagementRanges.good} users`}
                />
              </div>
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.critical}`} />
                  <div className={styles.legendLabel}>Critical (&lt;30%)</div>
                  <div className={styles.legendValue}>{engagementRanges.critical}</div>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.atRisk}`} />
                  <div className={styles.legendLabel}>At Risk (30-50%)</div>
                  <div className={styles.legendValue}>{engagementRanges.atRisk}</div>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.moderate}`} />
                  <div className={styles.legendLabel}>Moderate (50-70%)</div>
                  <div className={styles.legendValue}>{engagementRanges.moderate}</div>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.good}`} />
                  <div className={styles.legendLabel}>Good (&gt;70%)</div>
                  <div className={styles.legendValue}>{engagementRanges.good}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Email Status</h2>
            <div className={styles.emailStatusList}>
              {Object.entries(emailsByStatus).map(([status, count]) => (
                <div key={status} className={styles.statusItem}>
                  <div className={styles.statusLabel}>{status}</div>
                  <div className={styles.statusCount}>{count}</div>
                  <div className={styles.statusBar}>
                    <div 
                      className={styles.statusBarFill} 
                      style={{ width: `${(count / totalEmails) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <Link to="/users" className={styles.actionLink}>Manage Users</Link>
          <Link to="/emails" className={styles.actionLink}>View Emails</Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;