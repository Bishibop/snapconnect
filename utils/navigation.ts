import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import {
  MainTabParamList,
  CameraStackParamList,
  InboxStackParamList,
  SentStackParamList,
  FriendsStackParamList,
  ProfileStackParamList,
} from '../types';

// Common navigation prop types
export type MainTabNavigation = BottomTabNavigationProp<MainTabParamList>;

export type CameraNavigation = CompositeNavigationProp<
  StackNavigationProp<CameraStackParamList>,
  MainTabNavigation
>;

export type InboxNavigation = CompositeNavigationProp<
  StackNavigationProp<InboxStackParamList>,
  MainTabNavigation
>;

export type SentNavigation = CompositeNavigationProp<
  StackNavigationProp<SentStackParamList>,
  MainTabNavigation
>;

export type FriendsNavigation = CompositeNavigationProp<
  StackNavigationProp<FriendsStackParamList>,
  MainTabNavigation
>;

export type ProfileNavigation = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList>,
  MainTabNavigation
>;

// Navigation utility functions
export class NavigationUtils {
  /**
   * Navigate to camera screen for story creation
   */
  static navigateToCamera(
    navigation:
      | MainTabNavigation
      | CameraNavigation
      | InboxNavigation
      | SentNavigation
      | FriendsNavigation
  ) {
    (navigation as any).navigate('Camera');
  }

  /**
   * Navigate to camera screen for creating a story
   */
  static navigateToCameraForStory(navigation: CameraNavigation) {
    navigation.navigate('CameraScreen');
  }

  /**
   * Navigate to snap viewer with snap data
   */
  static navigateToSnapViewer(
    navigation: InboxNavigation | SentNavigation | FriendsNavigation,
    snap: InboxStackParamList['SnapViewer']['snap']
  ) {
    (navigation as any).navigate('SnapViewer', { snap });
  }

  /**
   * Navigate to story viewer with story data
   */
  static navigateToStoryViewer(
    navigation: InboxNavigation | SentNavigation | FriendsNavigation,
    story: InboxStackParamList['SnapViewer']['story']
  ) {
    (navigation as any).navigate('SnapViewer', { story });
  }

  /**
   * Navigate through camera workflow: Camera -> MediaPreview
   */
  static navigateToMediaPreview(
    navigation: CameraNavigation,
    mediaUri: string,
    mediaType: 'photo' | 'video'
  ) {
    navigation.navigate('MediaPreview', { mediaUri, mediaType });
  }

  /**
   * Navigate through camera workflow: MediaPreview -> FriendSelector
   */
  static navigateToFriendSelector(
    navigation: CameraNavigation,
    params: CameraStackParamList['FriendSelector']
  ) {
    navigation.navigate('FriendSelector', params);
  }

  /**
   * Navigate to add friends screen
   */
  static navigateToAddFriends(navigation: FriendsNavigation) {
    navigation.navigate('AddFriends');
  }

  /**
   * Navigate to friend requests screen
   */
  static navigateToFriendRequests(navigation: FriendsNavigation) {
    navigation.navigate('FriendRequests');
  }

  /**
   * Navigate to Profile tab
   */
  static navigateToProfileTab(navigation: MainTabNavigation) {
    navigation.navigate('Profile');
  }

  /**
   * Navigate to a user's profile from friends tab
   */
  static navigateToUserProfile(navigation: MainTabNavigation, userId: string) {
    navigation.navigate(
      'Profile' as any,
      {
        screen: 'ProfileScreen',
        params: { userId },
      } as any
    );
  }

  /**
   * Navigate back to previous screen
   */
  static goBack(navigation: any) {
    navigation.goBack();
  }

  /**
   * Reset stack to root screen (useful for tab switching)
   */
  static resetStack(navigation: any, routeName: string) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName }],
      })
    );
  }

  /**
   * Navigate to Friends tab and reset its stack
   */
  static navigateToFriendsTab(navigation: MainTabNavigation) {
    navigation.navigate('Friends');
    this.resetStack(navigation, 'FriendsList');
  }

  /**
   * Navigate to Camera tab
   */
  static navigateToCameraTab(navigation: MainTabNavigation) {
    navigation.navigate('Camera');
  }

  /**
   * Navigate to Conversations tab and reset its stack
   */
  static navigateToConversationsTab(navigation: MainTabNavigation) {
    navigation.navigate('Conversations');
    this.resetStack(navigation, 'ConversationsList');
  }
}

// Hook-based navigation utilities for cleaner component usage
export function useNavigationHelpers(navigation: any) {
  return {
    navigateToCamera: () => NavigationUtils.navigateToCamera(navigation),
    navigateToCameraForStory: () => NavigationUtils.navigateToCameraForStory(navigation),
    navigateToSnapViewer: (snap: InboxStackParamList['SnapViewer']['snap']) =>
      NavigationUtils.navigateToSnapViewer(navigation, snap),
    navigateToStoryViewer: (story: InboxStackParamList['SnapViewer']['story']) =>
      NavigationUtils.navigateToStoryViewer(navigation, story),
    navigateToMediaPreview: (mediaUri: string, mediaType: 'photo' | 'video') =>
      NavigationUtils.navigateToMediaPreview(navigation, mediaUri, mediaType),
    navigateToFriendSelector: (params: CameraStackParamList['FriendSelector']) =>
      NavigationUtils.navigateToFriendSelector(navigation, params),
    navigateToAddFriends: () => NavigationUtils.navigateToAddFriends(navigation),
    navigateToFriendRequests: () => NavigationUtils.navigateToFriendRequests(navigation),
    navigateToUserProfile: (userId: string) =>
      NavigationUtils.navigateToUserProfile(navigation, userId),
    navigateToProfileTab: () => NavigationUtils.navigateToProfileTab(navigation),
    goBack: () => NavigationUtils.goBack(navigation),
    resetStack: (routeName: string) => NavigationUtils.resetStack(navigation, routeName),
    navigateToFriendsTab: () => NavigationUtils.navigateToFriendsTab(navigation),
    navigateToCameraTab: () => NavigationUtils.navigateToCameraTab(navigation),
    navigateToConversationsTab: () => NavigationUtils.navigateToConversationsTab(navigation),
  };
}

// Common navigation patterns as constants
export const NAVIGATION_PATTERNS = {
  CAMERA_WORKFLOW: {
    TAKE_PHOTO: 'take-photo',
    PREVIEW_MEDIA: 'preview-media',
    SELECT_FRIENDS: 'select-friends',
    SEND_SNAP: 'send-snap',
  },
  STORY_WORKFLOW: {
    CREATE_STORY: 'create-story',
    VIEW_STORY: 'view-story',
  },
  SNAP_WORKFLOW: {
    VIEW_SNAP: 'view-snap',
    SEND_SNAP: 'send-snap',
  },
} as const;

// Navigation guard functions
export class NavigationGuards {
  /**
   * Safely navigate only if navigation object exists
   */
  static safeNavigate(navigation: any, action: () => void) {
    if (navigation && typeof action === 'function') {
      try {
        action();
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  }

  /**
   * Check if navigation can go back
   */
  static canGoBack(navigation: any): boolean {
    return navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack();
  }

  /**
   * Safe go back with fallback
   */
  static safeGoBack(navigation: any, fallback?: () => void) {
    if (this.canGoBack(navigation)) {
      navigation.goBack();
    } else if (fallback) {
      fallback();
    }
  }
}
