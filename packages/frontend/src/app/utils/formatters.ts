/**
 * Utility functions for formatting data
 */

/**
 * Format a date string to a localized date string
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date string to a localized date and time string
 * @param dateString ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid date';
  }
}

/**
 * Format a number as currency
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return '$0.00';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0.00';
  }
}

/**
 * Format a number with commas
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null) return '0';
  
  try {
    return new Intl.NumberFormat('en-US').format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}

/**
 * Format a number as a percentage
 * @param value Number to format (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  if (value === undefined || value === null) return '0%';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Format a list of strings as a comma-separated string
 * @param list List of strings
 * @returns Comma-separated string
 */
export function formatList(list: string[]): string {
  if (!list || list.length === 0) return 'None';
  
  return list.join(', ');
}