export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content?: string;
  media_url?: string;
  expires_at: string;
  viewed_at?: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  caption?: string;
  expires_at: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Friends: undefined;
  Camera: undefined;
  Inbox: undefined;
  Sent: undefined;
  Profile: undefined;
};

export type InboxStackParamList = {
  SnapInbox: undefined;
  SnapViewer: {
    snap?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      status: 'sent' | 'delivered' | 'opened' | 'expired';
      created_at: string;
      delivered_at?: string;
      opened_at?: string;
      sender_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
    };
    story?: {
      id: string;
      user_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      is_active: boolean;
      created_at: string;
      expires_at: string;
      user_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
      is_viewed?: boolean;
    };
  };
};

export type SentStackParamList = {
  SentSnaps: undefined;
  SnapViewer: {
    snap?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      status: 'sent' | 'delivered' | 'opened' | 'expired';
      created_at: string;
      delivered_at?: string;
      opened_at?: string;
      recipient_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
    };
    story?: {
      id: string;
      user_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      is_active: boolean;
      created_at: string;
      expires_at: string;
      user_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
      is_viewed?: boolean;
    };
  };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriends: undefined;
  FriendRequests: undefined;
  SnapViewer: {
    snap?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      status: 'sent' | 'delivered' | 'opened' | 'expired';
      created_at: string;
      delivered_at?: string;
      opened_at?: string;
      sender_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
    };
    story?: {
      id: string;
      user_id: string;
      media_url: string;
      snap_type: 'photo' | 'video';
      filter_type?: string;
      duration?: number;
      is_active: boolean;
      created_at: string;
      expires_at: string;
      user_profile?: {
        id: string;
        username: string;
        avatar_url?: string;
      };
      is_viewed?: boolean;
    };
  };
};

export type CameraStackParamList = {
  CameraScreen: undefined;
  MediaPreview: {
    mediaUri: string;
    mediaType: 'photo' | 'video';
  };
  FriendSelector: {
    mediaUri: string;
    mediaType: 'photo' | 'video';
    filter?: {
      id: string;
      name: string;
      tintColor?: string;
      opacity?: number;
      saturation?: number;
      brightness?: number;
      contrast?: number;
      blendMode?: 'multiply' | 'overlay' | 'saturation';
    };
  };
};

export type ProfileStackParamList = {
  ProfileScreen: { userId?: string };
  EditProfile: undefined;
};
