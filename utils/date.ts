/**
 * Date utility functions for formatting Unix timestamps
 * Handles timestamps in seconds (Unix) and converts them to various date/time formats
 */

/**
 * Converts Unix timestamp (in seconds) to JavaScript Date object
 * @param timestamp - Unix timestamp in seconds
 * @returns Date object
 */
function timestampToDate(timestamp: number): Date {
  // If timestamp is less than 1e12, it's in seconds, multiply by 1000
  // Otherwise, assume it's already in milliseconds
  const milliseconds = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds);
}

/**
 * Formats a Unix timestamp to date only (e.g., "January 15, 2024")
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(timestamp: number, locale: string = 'en-US'): string {
  const date = timestampToDate(timestamp);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a Unix timestamp to date and time (e.g., "January 15, 2024, 10:30 AM")
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @param includeSeconds - Whether to include seconds in the time (default: false)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  timestamp: number,
  locale: string = 'en-US',
  includeSeconds: boolean = false
): string {
  const date = timestampToDate(timestamp);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Formats a Unix timestamp to time only (e.g., "10:30 AM")
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @param includeSeconds - Whether to include seconds in the time (default: false)
 * @returns Formatted time string
 */
export function formatTime(
  timestamp: number,
  locale: string = 'en-US',
  includeSeconds: boolean = false
): string {
  const date = timestampToDate(timestamp);
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Custom date format function that accepts a format string
 * Supports common format tokens:
 * - YYYY: 4-digit year
 * - YY: 2-digit year
 * - MM: 2-digit month (01-12)
 * - MMM: Short month name (Jan, Feb, etc.)
 * - MMMM: Full month name (January, February, etc.)
 * - DD: 2-digit day (01-31)
 * - D: Day without leading zero (1-31)
 * - HH: 2-digit hour in 24-hour format (00-23)
 * - H: Hour in 24-hour format without leading zero (0-23)
 * - hh: 2-digit hour in 12-hour format (01-12)
 * - h: Hour in 12-hour format without leading zero (1-12)
 * - mm: 2-digit minutes (00-59)
 * - ss: 2-digit seconds (00-59)
 * - A: AM/PM
 * - a: am/pm
 * 
 * @param timestamp - Unix timestamp in seconds
 * @param format - Format string (e.g., "YYYY-MM-DD", "MM/DD/YYYY HH:mm A")
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string according to the format pattern
 * 
 * @example
 * formatDateCustom(1766754882, "YYYY-MM-DD") // "2024-01-15"
 * formatDateCustom(1766754882, "MM/DD/YYYY HH:mm A") // "01/15/2024 10:30 AM"
 * formatDateCustom(1766754882, "MMMM DD, YYYY") // "January 15, 2024"
 */
export function formatDateCustom(
  timestamp: number,
  format: string,
  locale: string = 'en-US'
): string {
  const date = timestampToDate(timestamp);
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const ampmLower = ampm.toLowerCase();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  let formatted = format;

  // Replace format tokens
  formatted = formatted.replace(/YYYY/g, String(year));
  formatted = formatted.replace(/YY/g, String(year).slice(-2));
  formatted = formatted.replace(/MMMM/g, monthNames[month]);
  formatted = formatted.replace(/MMM/g, monthNamesShort[month]);
  formatted = formatted.replace(/MM/g, String(month + 1).padStart(2, '0'));
  formatted = formatted.replace(/DD/g, String(day).padStart(2, '0'));
  formatted = formatted.replace(/D(?!D)/g, String(day));
  formatted = formatted.replace(/HH/g, String(hours24).padStart(2, '0'));
  formatted = formatted.replace(/H(?!H)/g, String(hours24));
  formatted = formatted.replace(/hh/g, String(hours12).padStart(2, '0'));
  formatted = formatted.replace(/h(?!h)/g, String(hours12));
  formatted = formatted.replace(/mm/g, String(minutes).padStart(2, '0'));
  formatted = formatted.replace(/ss/g, String(seconds).padStart(2, '0'));
  formatted = formatted.replace(/A/g, ampm);
  formatted = formatted.replace(/a/g, ampmLower);

  return formatted;
}

/**
 * Gets a relative time string (e.g., "2 hours ago", "3 days ago", "just now")
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number, locale: string = 'en-US'): string {
  const date = timestampToDate(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

/**
 * Checks if a timestamp is today
 * @param timestamp - Unix timestamp in seconds
 * @returns True if the timestamp is today
 */
export function isToday(timestamp: number): boolean {
  const date = timestampToDate(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a timestamp is yesterday
 * @param timestamp - Unix timestamp in seconds
 * @returns True if the timestamp is yesterday
 */
export function isYesterday(timestamp: number): boolean {
  const date = timestampToDate(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Gets a human-readable date string with smart formatting
 * - "Today" if the date is today
 * - "Yesterday" if the date is yesterday
 * - Relative time if within a week
 * - Full date otherwise
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Human-readable date string
 */
export function formatSmartDate(timestamp: number, locale: string = 'en-US'): string {
  if (isToday(timestamp)) {
    return 'Today';
  }
  
  if (isYesterday(timestamp)) {
    return 'Yesterday';
  }

  const date = timestampToDate(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 7) {
    return formatRelativeTime(timestamp, locale);
  }

  return formatDate(timestamp, locale);
}

