import React from 'react';
import styles from './EngagementScore.module.css';
import { formatPercentage } from '../utils/formatters';

interface EngagementScoreProps {
  score: number;
  showValue?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const EngagementScore: React.FC<EngagementScoreProps> = ({ 
  score, 
  showValue = true,
  size = 'medium'
}) => {
  // Ensure score is between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Determine color based on score
  const getColor = (score: number) => {
    if (score < 30) return '#ff4d4d'; // Red
    if (score < 50) return '#ffa64d'; // Orange
    if (score < 70) return '#ffff4d'; // Yellow
    return '#4caf50'; // Green
  };
  
  const color = getColor(normalizedScore);
  
  return (
    <div className={`${styles.container} ${styles[size]}`} title={`Engagement Score: ${normalizedScore}`}>
      <div className={styles.bar}>
        <div 
          className={styles.fill} 
          style={{ 
            width: `${normalizedScore}%`,
            backgroundColor: color
          }}
        />
      </div>
      {showValue && (
        <div className={styles.value}>
          {formatPercentage(normalizedScore)}
        </div>
      )}
    </div>
  );
};

export default EngagementScore;