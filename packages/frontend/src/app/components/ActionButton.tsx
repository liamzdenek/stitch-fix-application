import React, { useState } from 'react';
import styles from './ActionButton.module.css';

interface ActionButtonProps {
  label: string;
  onClick: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  confirmText?: string;
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'medium',
  icon,
  confirmText,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClick = async () => {
    // If confirmation is required and not shown yet, show confirmation
    if (confirmText && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    // Reset confirmation state
    setShowConfirm(false);
    
    // If already loading or disabled, do nothing
    if (isLoading || disabled) return;
    
    try {
      setIsLoading(true);
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel confirmation
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };
  
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className} ${isLoading ? styles.loading : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className={styles.spinner} />
      ) : showConfirm ? (
        <div className={styles.confirmContainer}>
          <span>{confirmText}</span>
          <div className={styles.confirmActions}>
            <span className={styles.confirmYes} onClick={handleClick}>Yes</span>
            <span className={styles.confirmNo} onClick={handleCancel}>No</span>
          </div>
        </div>
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default ActionButton;