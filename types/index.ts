export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
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
  Home: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  Home: undefined;
};