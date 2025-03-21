import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './System.module.css';
import Layout from '../components/Layout';

export const System: React.FC = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Stitch Fix Client Engagement System</h1>
          <p className={styles.subtitle}>
            A system for monitoring client engagement and automatically sending personalized re-engagement emails
          </p>
        </div>
        
        <div className={styles.content}>
          <div className={styles.cardsContainer}>
            <Link to="/dashboard" className={`${styles.card} ${styles.dashboardCard}`}>
              <div className={styles.cardIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Dashboard</h2>
              <p className={styles.cardDescription}>
                View summary metrics and statistics about user engagement and email performance
              </p>
            </Link>
            
            <Link to="/users" className={`${styles.card} ${styles.usersCard}`}>
              <div className={styles.cardIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Users</h2>
              <p className={styles.cardDescription}>
                Manage users, view engagement scores, and trigger actions to test the system
              </p>
            </Link>
            
            <Link to="/emails" className={`${styles.card} ${styles.emailsCard}`}>
              <div className={styles.cardIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Emails</h2>
              <p className={styles.cardDescription}>
                View all generated emails and their status in the system
              </p>
            </Link>
          </div>
          
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <h2 className={styles.infoTitle}>Purpose</h2>
              <p className={styles.infoText}>
                This system addresses a key business risk identified in Stitch Fix's annual SEC report:
                client retention and engagement. It monitors client engagement through a sophisticated
                scoring algorithm, identifies clients at risk of disengagement, and automatically sends
                personalized re-engagement emails.
              </p>
            </div>
            
            <div className={styles.infoCard}>
              <h2 className={styles.infoTitle}>Architecture</h2>
              <p className={styles.infoText}>
                The system uses an event-driven architecture with serverless components on AWS.
                Changes to user data in DynamoDB generate events that flow through the system,
                triggering email generation when a user's engagement score falls below a threshold.
              </p>
            </div>
            
            <div className={styles.infoCard}>
              <h2 className={styles.infoTitle}>Technologies</h2>
              <ul className={styles.techList}>
                <li>React & TypeScript (Frontend)</li>
                <li>Express.js (Backend API)</li>
                <li>Go (Email Processor)</li>
                <li>AWS Lambda, DynamoDB, SNS, SQS</li>
                <li>OpenRouter API (Email Content Generation)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default System;