import React, { useState } from 'react';
import styles from './UserForm.module.css';
import { User } from '../services/api';
import ActionButton from './ActionButton';

interface UserFormProps {
  onSubmit: (userData: Omit<User, 'userId' | 'engagementScore' | 'lastEmailDate' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Partial<User>;
  submitLabel?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  initialData = {},
  submitLabel = 'Create User',
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    lastOrderDate: initialData.lastOrderDate || new Date().toISOString().split('T')[0],
    orderCount: initialData.orderCount !== undefined ? initialData.orderCount : 0,
    averageOrderValue: initialData.averageOrderValue !== undefined ? initialData.averageOrderValue : 0,
    preferredCategories: initialData.preferredCategories ? initialData.preferredCategories.join(', ') : '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.lastOrderDate) {
      newErrors.lastOrderDate = 'Last order date is required';
    }
    
    if (formData.orderCount < 0) {
      newErrors.orderCount = 'Order count must be a positive number';
    }
    
    if (formData.averageOrderValue < 0) {
      newErrors.averageOrderValue = 'Average order value must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    // Parse numeric values and categories
    const userData = {
      ...formData,
      orderCount: parseInt(formData.orderCount.toString(), 10),
      averageOrderValue: parseFloat(formData.averageOrderValue.toString()),
      preferredCategories: formData.preferredCategories
        ? formData.preferredCategories.split(',').map(cat => cat.trim()).filter(Boolean)
        : [],
    };
    
    try {
      await onSubmit(userData);
      
      // Reset form if it's a create form (no initialData)
      if (!initialData.userId) {
        setFormData({
          name: '',
          email: '',
          lastOrderDate: new Date().toISOString().split('T')[0],
          orderCount: 0,
          averageOrderValue: 0,
          preferredCategories: '',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
        />
        {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
        />
        {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="lastOrderDate" className={styles.label}>Last Order Date</label>
        <input
          type="date"
          id="lastOrderDate"
          name="lastOrderDate"
          value={formData.lastOrderDate.split('T')[0]}
          onChange={handleChange}
          className={`${styles.input} ${errors.lastOrderDate ? styles.inputError : ''}`}
        />
        {errors.lastOrderDate && <div className={styles.errorMessage}>{errors.lastOrderDate}</div>}
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="orderCount" className={styles.label}>Order Count</label>
          <input
            type="number"
            id="orderCount"
            name="orderCount"
            value={formData.orderCount}
            onChange={handleChange}
            min="0"
            step="1"
            className={`${styles.input} ${errors.orderCount ? styles.inputError : ''}`}
          />
          {errors.orderCount && <div className={styles.errorMessage}>{errors.orderCount}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="averageOrderValue" className={styles.label}>Average Order Value ($)</label>
          <input
            type="number"
            id="averageOrderValue"
            name="averageOrderValue"
            value={formData.averageOrderValue}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`${styles.input} ${errors.averageOrderValue ? styles.inputError : ''}`}
          />
          {errors.averageOrderValue && <div className={styles.errorMessage}>{errors.averageOrderValue}</div>}
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="preferredCategories" className={styles.label}>Preferred Categories (comma-separated)</label>
        <input
          type="text"
          id="preferredCategories"
          name="preferredCategories"
          value={formData.preferredCategories}
          onChange={handleChange}
          className={styles.input}
          placeholder="e.g. Shirts, Pants, Dresses"
        />
      </div>
      
      <div className={styles.formActions}>
        <ActionButton
          label={submitLabel}
          onClick={() => handleSubmit(new Event('click') as unknown as React.FormEvent)}
          variant="primary"
        />
      </div>
    </form>
  );
};

export default UserForm;