import { theme } from '../constants/theme';

/**
 * Status and icon utility functions for SnapConnect
 * Provides consistent status handling and icons across the app
 */

// Type definitions for better type safety
export type VibeCheckStatus = 'sent' | 'delivered' | 'opened' | 'expired';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type VibeCheckType = 'photo' | 'video';

// Backward compatibility type aliases
export type SnapStatus = VibeCheckStatus;
export type SnapType = VibeCheckType;

/**
 * Icon constants for consistent usage across the app
 */
export const ICONS = {
  // Status icons
  SENT: '📤',
  DELIVERED: '📬',
  OPENED: '👁️',
  EXPIRED: '💨',

  // VibeCheck type icons
  PHOTO: '📸',
  VIDEO: '🎥',

  // Tab icons
  FRIENDS: '👥',
  CAMERA: '📸',
  INBOX: '📥',
  SENT_TAB: '📤',

  // Empty state icons
  INBOX_EMPTY: '📥',
  SENT_EMPTY: '📤',
  FRIENDS_EMPTY: '👥',
  STORIES_EMPTY: '🎬',

  // General purpose icons
  ADD: '➕',
  CLOSE: '✕',
  SETTINGS: '⚙️',
  SEARCH: '🔍',
  FILTER: '🎨',
  HEART: '❤️',
  STAR: '⭐',
} as const;

/**
 * Get icon for VibeCheck status
 * @param status - The VibeCheck status
 * @returns Emoji icon for the status
 */
export function getStatusIcon(status: VibeCheckStatus): string {
  switch (status) {
    case 'sent':
      return ICONS.SENT;
    case 'delivered':
      return ICONS.DELIVERED;
    case 'opened':
      return ICONS.OPENED;
    case 'expired':
      return ICONS.EXPIRED;
    default:
      return ICONS.SENT;
  }
}

/**
 * Get color for VibeCheck status
 * @param status - The VibeCheck status
 * @returns Theme color for the status
 */
export function getStatusColor(status: VibeCheckStatus): string {
  switch (status) {
    case 'sent':
      return theme.colors.textSecondary;
    case 'delivered':
      return theme.colors.primary;
    case 'opened':
      return theme.colors.success;
    case 'expired':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
}

/**
 * Get icon for VibeCheck type
 * @param vibeCheckType - The type of VibeCheck (photo or video)
 * @returns Emoji icon for the VibeCheck type
 */
export function getVibeCheckTypeIcon(vibeCheckType: VibeCheckType): string {
  return vibeCheckType === 'photo' ? ICONS.PHOTO : ICONS.VIDEO;
}

// Backward compatibility alias
export const getSnapTypeIcon = getVibeCheckTypeIcon;

/**
 * Get human-readable status text
 * @param status - The VibeCheck status
 * @returns Formatted status text
 */
export function getStatusText(status: VibeCheckStatus): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'opened':
      return 'Opened';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Get color for friendship status
 * @param status - The friendship status
 * @returns Theme color for the friendship status
 */
export function getFriendshipStatusColor(status: FriendshipStatus): string {
  switch (status) {
    case 'pending':
      return theme.colors.primary;
    case 'accepted':
      return theme.colors.success;
    case 'blocked':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
}

/**
 * Get text for friendship status
 * @param status - The friendship status
 * @returns Human-readable friendship status
 */
export function getFriendshipStatusText(status: FriendshipStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Friends';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a VibeCheck status indicates it can be viewed
 * @param status - The VibeCheck status
 * @returns True if the VibeCheck can be viewed
 */
export function isVibeCheckViewable(status: VibeCheckStatus): boolean {
  return status === 'delivered' || status === 'sent';
}

// Backward compatibility alias
export const isSnapViewable = isVibeCheckViewable;

/**
 * Check if a VibeCheck status indicates it has been interacted with
 * @param status - The VibeCheck status
 * @returns True if the VibeCheck has been opened or expired
 */
export function isVibeCheckInteracted(status: VibeCheckStatus): boolean {
  return status === 'opened' || status === 'expired';
}

// Backward compatibility alias
export const isSnapInteracted = isVibeCheckInteracted;

/**
 * Get appropriate emoji for empty states
 * @param type - The type of empty state
 * @returns Emoji icon for the empty state
 */
export function getEmptyStateIcon(type: 'inbox' | 'sent' | 'friends' | 'stories'): string {
  switch (type) {
    case 'inbox':
      return ICONS.INBOX_EMPTY;
    case 'sent':
      return ICONS.SENT_EMPTY;
    case 'friends':
      return ICONS.FRIENDS_EMPTY;
    case 'stories':
      return ICONS.STORIES_EMPTY;
    default:
      return ICONS.INBOX_EMPTY;
  }
}

/**
 * Status utility class for more complex operations
 */
export class StatusUtils {
  /**
   * Get complete status info for display
   * @param status - The VibeCheck status
   * @returns Object with icon, color, and text
   */
  static getStatusInfo(status: VibeCheckStatus) {
    return {
      icon: getStatusIcon(status),
      color: getStatusColor(status),
      text: getStatusText(status),
      isViewable: isVibeCheckViewable(status),
      isInteracted: isVibeCheckInteracted(status),
    };
  }

  /**
   * Get complete VibeCheck type info for display
   * @param vibeCheckType - The VibeCheck type
   * @returns Object with icon and text
   */
  static getVibeCheckTypeInfo(vibeCheckType: VibeCheckType) {
    return {
      icon: getVibeCheckTypeIcon(vibeCheckType),
      text: vibeCheckType.charAt(0).toUpperCase() + vibeCheckType.slice(1),
    };
  }

  // Backward compatibility alias
  static getSnapTypeInfo = StatusUtils.getVibeCheckTypeInfo;

  /**
   * Get complete friendship status info
   * @param status - The friendship status
   * @returns Object with color and text
   */
  static getFriendshipInfo(status: FriendshipStatus) {
    return {
      color: getFriendshipStatusColor(status),
      text: getFriendshipStatusText(status),
    };
  }
}
