import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './EmailCard.module.css';
import { Email, EmailStatus } from '../services/api';
import { formatDateTime, truncateString } from '../utils/formatters';
import EngagementScore from './EngagementScore';

interface EmailCardProps {
  email: Email;
  userName?: string;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email, userName }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get status color
  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case EmailStatus.GENERATED:
        return '#ffa64d'; // Orange
      case EmailStatus.SENT:
        return '#4caf50'; // Green
      case EmailStatus.OPENED:
        return '#2196f3'; // Blue
      case EmailStatus.CLICKED:
        return '#9c27b0'; // Purple
      case EmailStatus.FAILED:
        return '#ff4d4d'; // Red
      default:
        return '#999'; // Gray
    }
  };
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.subject}>{email.subject}</h3>
        <div className={styles.score}>
          <EngagementScore score={email.engagementScoreAtTime} size="small" />
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Generated:</span>
            <span className={styles.value}>{formatDateTime(email.generatedAt)}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Status:</span>
            <span 
              className={styles.status} 
              style={{ backgroundColor: getStatusColor(email.status) }}
            >
              {email.status}
            </span>
          </div>
          
          {userName && (
            <div className={styles.infoItem}>
              <span className={styles.label}>User:</span>
              <Link 
                to="/users/$userId" 
                params={{ userId: email.userId }}
                className={styles.userLink}
              >
                {userName}
              </Link>
            </div>
          )}
        </div>
        
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <h4>Email Content</h4>
            <button 
              className={styles.expandButton} 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className={styles.previewContent}>
            {expanded ? (
              <div dangerouslySetInnerHTML={{ __html: email.content }} />
            ) : (
              <p>{truncateString(email.content.replace(/<[^>]*>/g, ' '), 150)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCard;