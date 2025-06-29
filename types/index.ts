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

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  participant1?: Profile;
  participant2?: Profile;
  last_message?: ConversationMessage;
  unread_count?: number;
}

export interface TextMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  message_type: 'text';
}

export interface VibeCheckMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  vibe_check_id: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  vibe_check?: VibeCheck;
  message_type: 'vibe_check';
}

export type ConversationMessage = TextMessage | VibeCheckMessage;

export interface VibeCheck {
  id: string;
  sender_id: string;
  recipient_id: string;
  media_url: string;
  vibe_check_type: 'photo' | 'video';
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
  recipient_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
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
  Conversations: undefined;
  VibeReels: undefined;
  Camera: undefined;
  Profile: undefined;
};

export type InboxStackParamList = {
  VibeCheckInbox: undefined;
  VibeCheckViewer: {
    vibeCheck?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      vibe_check_type: 'photo' | 'video';
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
  };
};

export type SentStackParamList = {
  SentVibeChecks: undefined;
  VibeCheckViewer: {
    vibeCheck?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      vibe_check_type: 'photo' | 'video';
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
  };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriends: undefined;
  VibeReelPlayer: {
    vibeReelId: string;
  };
  VibeCheckViewer: {
    vibeCheck?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      vibe_check_type: 'photo' | 'video';
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
  CreateVibeReel: {
    imageUri: string;
    imageFile?: File | string;
  };
  VibeReelPreview: {
    vibeReelId: string;
  };
  VibeReelPlayer: {
    vibeReelId: string;
  };
};

export type ProfileStackParamList = {
  ProfileScreen: { userId?: string };
  EditProfile: undefined;
};

export type VibeReelsStackParamList = {
  VibeReelsList: undefined;
  VibeReelPlayer: {
    vibeReelId: string;
  };
  CreateVibeReel: {
    imageUri: string;
    imageFile?: File | string;
  };
  VibeReelPreview: {
    vibeReelId: string;
  };
};

export type ConversationsStackParamList = {
  ConversationsList: undefined;
  ConversationDetail: {
    conversationId?: string;
    recipientId?: string;
    scrollToBottom?: boolean;
    pendingVibeCheck?: {
      localUri: string;
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
  VibeCheckViewer: {
    vibeCheck?: {
      id: string;
      sender_id: string;
      recipient_id: string;
      media_url: string;
      vibe_check_type: 'photo' | 'video';
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
  };
};

// Art and VibeReel Types
export interface ArtPiece {
  id: string;
  user_id: string;
  image_url: string;
  embedding?: number[];
  vibe_count: number;
  created_at: string;
  user?: Profile;
  similarity?: number;
}

export interface VibeReel {
  id: string;
  creator_id: string;
  primary_art_id: string;
  selected_art_ids: string[];
  created_at: string;
  creator?: Profile;
  primary_art?: ArtPiece;
  selected_art?: ArtPiece[];
}
