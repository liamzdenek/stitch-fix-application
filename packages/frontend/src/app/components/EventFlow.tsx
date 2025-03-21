import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './EventFlow.module.css';

export const EventFlow: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>System Event Flow</h2>
      
      <div className={styles.diagram}>
        {/* Row 1 */}
        <div className={styles.row}>
          {/* Database */}
          <div className={`${styles.component} ${styles.database}`}>
            <div className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div className={styles.label}>DynamoDB</div>
            <div className={styles.description}>Stores user and email data</div>
            <Link to="/users" className={styles.link}>View Users</Link>
          </div>
          
          {/* Arrow */}
          <div className={styles.arrowContainer}>
            <div className={`${styles.arrow} ${styles.arrowRight}`}>
              <div className={styles.arrowLabel}>Stream Events</div>
            </div>
          </div>
          
          {/* Stream Processor */}
          <div className={`${styles.component} ${styles.lambda}`}>
            <div className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className={styles.label}>Stream Processor</div>
            <div className={styles.description}>Processes database changes</div>
          </div>
          
          {/* Arrow */}
          <div className={styles.arrowContainer}>
            <div className={`${styles.arrow} ${styles.arrowRight}`}>
              <div className={styles.arrowLabel}>Publishes Events</div>
            </div>
          </div>
          
          {/* SNS */}
          <div className={`${styles.component} ${styles.sns}`}>
            <div className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className={styles.label}>SNS Topic</div>
            <div className={styles.description}>Distributes events</div>
          </div>
        </div>
        
        {/* Row 2 - Arrow Down */}
        <div className={styles.row}>
          <div className={styles.spacer}></div>
          <div className={styles.spacer}></div>
          <div className={styles.spacer}></div>
          <div className={styles.arrowContainer}>
            <div className={`${styles.arrow} ${styles.arrowDown}`}>
              <div className={styles.arrowLabel}>Delivers Messages</div>
            </div>
          </div>
        </div>
        
        {/* Row 3 */}
        <div className={styles.row}>
          <div className={styles.spacer}></div>
          <div className={styles.spacer}></div>
          <div className={styles.spacer}></div>
          
          {/* SQS */}
          <div className={`${styles.component} ${styles.sqs}`}>
            <div className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div className={styles.label}>SQS Queue</div>
            <div className={styles.description}>Buffers events</div>
          </div>
          
          {/* Arrow */}
          <div className={styles.arrowContainer}>
            <div className={`${styles.arrow} ${styles.arrowRight}`}>
              <div className={styles.arrowLabel}>Consumes Messages</div>
            </div>
          </div>
          
          {/* Email Processor */}
          <div className={`${styles.component} ${styles.lambda}`}>
            <div className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className={styles.label}>Email Processor</div>
            <div className={styles.description}>Generates and sends emails</div>
            <Link to="/emails" className={styles.link}>View Emails</Link>
          </div>
        </div>
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.databaseIcon}`}></div>
          <div className={styles.legendLabel}>Database</div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.lambdaIcon}`}></div>
          <div className={styles.legendLabel}>Lambda Function</div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.snsIcon}`}></div>
          <div className={styles.legendLabel}>SNS Topic</div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.sqsIcon}`}></div>
          <div className={styles.legendLabel}>SQS Queue</div>
        </div>
      </div>
    </div>
  );
};

export default EventFlow;