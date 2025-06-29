import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Centralized icon configuration for SnapConnect
 * Using flat icon sets from @expo/vector-icons
 */

export const IconSets = {
  Ionicons,
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
} as const;

// Icon names and their corresponding icon set
export const Icons = {
  // Status icons
  SENT: { name: 'send', component: Ionicons },
  DELIVERED: { name: 'mail', component: Ionicons },
  OPENED: { name: 'eye', component: Ionicons },
  CLOSED: { name: 'eye-off', component: Ionicons },
  EXPIRED: { name: 'timer-off', component: MaterialIcons },

  // VibeCheck/Media type icons
  PHOTO: { name: 'camera', component: Ionicons },
  VIDEO: { name: 'videocam', component: Ionicons },

  // Tab/Navigation icons
  FRIENDS: { name: 'people', component: Ionicons },
  CAMERA: { name: 'camera', component: Feather },
  INBOX: { name: 'inbox', component: MaterialIcons },
  SENT_TAB: { name: 'send', component: Feather },
  VIBE_REEL: { name: 'play-circle', component: Ionicons },
  MENU: { name: 'menu', component: Ionicons },

  // Action icons
  ADD: { name: 'add-circle', component: Ionicons },
  ADD_SIMPLE: { name: 'add', component: Ionicons },
  CLOSE: { name: 'close', component: Ionicons },
  SETTINGS: { name: 'settings', component: Ionicons },
  SEARCH: { name: 'search', component: Ionicons },
  FILTER: { name: 'color-palette', component: Ionicons },
  HEART: { name: 'heart', component: Ionicons },
  STAR: { name: 'star', component: Ionicons },
  CHECK: { name: 'checkmark-circle', component: Ionicons },
  BACK: { name: 'arrow-back', component: Ionicons },
  MORE: { name: 'ellipsis-vertical', component: Ionicons },

  // User/Profile icons
  USER: { name: 'person', component: Ionicons },
  USER_ADD: { name: 'person-add', component: Ionicons },
  USER_REMOVE: { name: 'person-remove', component: Ionicons },
  GROUP: { name: 'people', component: Ionicons },

  // Media control icons
  PLAY: { name: 'play', component: Ionicons },
  PAUSE: { name: 'pause', component: Ionicons },
  FLIP_CAMERA: { name: 'camera-reverse', component: Ionicons },
  FLASH_ON: { name: 'flash', component: Ionicons },
  FLASH_OFF: { name: 'flash-off', component: Ionicons },
  DOWNLOAD: { name: 'download', component: Ionicons },

  // Empty state icons
  INBOX_EMPTY: { name: 'inbox', component: MaterialCommunityIcons },
  SENT_EMPTY: { name: 'send-circle', component: MaterialCommunityIcons },
  FRIENDS_EMPTY: { name: 'account-group', component: MaterialCommunityIcons },
  VIBE_REELS_EMPTY: { name: 'movie-open', component: MaterialCommunityIcons },

  // Status/State icons
  ERROR: { name: 'alert-circle', component: Ionicons },
  WARNING: { name: 'warning', component: Ionicons },
  SUCCESS: { name: 'checkmark-circle', component: Ionicons },
  INFO: { name: 'information-circle', component: Ionicons },
  LOADING: { name: 'reload', component: Ionicons },

  // Social icons
  SHARE: { name: 'share-social', component: Ionicons },
  LIKE: { name: 'heart', component: Ionicons },
  LIKE_OUTLINE: { name: 'heart-outline', component: Ionicons },
  COMMENT: { name: 'chatbubble', component: Ionicons },

  // Misc icons
  NOTIFICATION: { name: 'notifications', component: Ionicons },
  NOTIFICATION_OFF: { name: 'notifications-off', component: Ionicons },
  LOCK: { name: 'lock-closed', component: Ionicons },
  UNLOCK: { name: 'lock-open', component: Ionicons },
  TRASH: { name: 'trash', component: Ionicons },
  EDIT: { name: 'create', component: Ionicons },
} as const;

// Helper to get icon props
export function getIconProps(iconKey: keyof typeof Icons, size: number = 24, color?: string) {
  const icon = Icons[iconKey];
  return {
    name: icon.name,
    size,
    color: color || '#000',
  };
}

// Type for icon keys
export type IconKey = keyof typeof Icons;

// Get the component for rendering
export function getIconComponent(iconKey: IconKey) {
  return Icons[iconKey].component;
}
