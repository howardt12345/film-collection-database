import { format, parseISO } from 'date-fns';

export function useDateFormatting() {
  /**
   * Format a date to a readable string
   * @param date Date to format
   * @param formatString Optional format string (default: 'yyyy-MM-dd')
   * @returns Formatted date string
   */
  const formatDate = (date: Date | string | undefined, formatString = 'yyyy-MM-dd'): string => {
    if (!date) return 'N/A';

    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  };

  /**
   * Format a date to a relative string (e.g., "2 days ago")
   * @param date Date to format
   * @returns Relative date string
   */
  const formatRelativeDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';

    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return dateObj > now ? 'Tomorrow' : 'Yesterday';
      } else if (diffDays < 7) {
        return dateObj > now ? `In ${diffDays} days` : `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return dateObj > now
          ? `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
          : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return dateObj > now
          ? `In ${months} ${months === 1 ? 'month' : 'months'}`
          : `${months} ${months === 1 ? 'month' : 'months'} ago`;
      } else {
        const years = Math.floor(diffDays / 365);
        return dateObj > now
          ? `In ${years} ${years === 1 ? 'year' : 'years'}`
          : `${years} ${years === 1 ? 'year' : 'years'} ago`;
      }
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return String(date);
    }
  };

  /**
   * Parse a string to a Date object
   * @param dateString Date string to parse
   * @returns Date object
   */
  const parseDate = (dateString: string): Date => {
    try {
      return parseISO(dateString);
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  };

  return {
    formatDate,
    formatRelativeDate,
    parseDate,
  };
}
