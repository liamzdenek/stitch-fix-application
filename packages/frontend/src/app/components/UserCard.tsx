import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './UserCard.module.css';
import { User } from '../services/api';
import { formatDate, formatCurrency, formatList } from '../utils/formatters';
import EngagementScore from './EngagementScore';

interface UserCardProps {
  user: User;
  showActions?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, showActions = true }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{user.name}</h3>
        <div className={styles.score}>
          <EngagementScore score={user.engagementScore || 0} size="small" />
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{user.email}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Last Order:</span>
            <span className={styles.value}>{formatDate(user.lastOrderDate)}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Orders:</span>
            <span className={styles.value}>{user.orderCount}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Avg. Order Value:</span>
            <span className={styles.value}>{formatCurrency(user.averageOrderValue)}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Categories:</span>
            <span className={styles.value}>{formatList(user.preferredCategories)}</span>
          </div>
          
          {user.lastEmailDate && (
            <div className={styles.infoItem}>
              <span className={styles.label}>Last Email:</span>
              <span className={styles.value}>{formatDate(user.lastEmailDate)}</span>
            </div>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className={styles.actions}>
          <Link 
            to="/users/$userId" 
            params={{ userId: user.userId }}
            className={styles.viewButton}
          >
            View Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserCard;