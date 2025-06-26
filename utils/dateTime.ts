/**
 * Date and time utility functions for SnapConnect
 * Provides consistent date/time formatting across the app
 */

/**
 * Format a date string into a relative time ago format
 * @param dateString - ISO date string
 * @returns Formatted string like "now", "5m", "2h", "3d"
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const targetTime = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - targetTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
}

/**
 * Format a date for friendship since display
 * @param dateString - ISO date string
 * @returns Formatted date string for display
 */
export function formatFriendsSinceDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Format a date for story expiration display
 * @param dateString - ISO date string
 * @returns Formatted string showing when content expires
 */
export function formatExpirationTime(dateString: string): string {
  const now = new Date();
  const expiresAt = new Date(dateString);
  const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

  if (diffInSeconds <= 0) {
    return 'Expired';
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m left`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h left`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d left`;
  }
}

/**
 * Check if a date is expired
 * @param dateString - ISO date string
 * @returns True if the date is in the past
 */
export function isExpired(dateString: string): boolean {
  return new Date(dateString).getTime() < Date.now();
}

/**
 * Format a date for message timestamp display
 * @param dateString - ISO date string
 * @returns Formatted timestamp for messages
 */
export function formatMessageTime(dateString: string): string {
  const messageTime = new Date(dateString);
  const now = new Date();
  
  // If today, show time
  if (messageTime.toDateString() === now.toDateString()) {
    return messageTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // If this week, show day
  const daysDiff = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return messageTime.toLocaleDateString([], { weekday: 'short' });
  }
  
  // Otherwise show date
  return messageTime.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get relative time with full description
 * @param dateString - ISO date string
 * @returns Full relative time description like "2 minutes ago"
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const targetTime = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - targetTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else {
    return targetTime.toLocaleDateString();
  }
}

/**
 * Format duration in seconds to readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration like "1:30" for 90 seconds
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Constants for common time periods
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  
  // Snap expiration times
  SNAP_EXPIRY_DEFAULT: 10, // seconds
  STORY_EXPIRY_DEFAULT: 24 * 60 * 60, // 24 hours in seconds
} as const;