import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  requested_by: string;
  created_at: string;
  requester_profile: Profile;
}

export interface FriendWithProfile {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'accepted';
  created_at: string;
  friend_profile: Profile;
}

// Search users by username
export async function searchUsers(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

// Send friend request
export async function sendFriendRequest(friendId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    )
    .single();

  if (existing) {
    throw new Error('Friend request already exists or you are already friends');
  }

  const { error } = await supabase.from('friendships').insert({
    user_id: user.id,
    friend_id: friendId,
    status: 'pending',
    requested_by: user.id,
  });

  if (error) throw error;
}

// Get pending friend requests (received)
export async function getPendingRequests(): Promise<FriendRequest[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      requester_profile:profiles!friendships_requested_by_fkey(*)
    `
    )
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
  return data || [];
}

// Get sent friend requests
export async function getSentRequests(): Promise<FriendRequest[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      requester_profile:profiles!friendships_friend_id_fkey(*)
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
  return data || [];
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) throw error;
}

// Decline friend request
export async function declineFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', requestId);

  if (error) throw error;
}

// Get friends list
export async function getFriends(): Promise<FriendWithProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      friend_profile:profiles!friendships_friend_id_fkey(*)
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  if (error) throw error;
  return data || [];
}

// Remove friend
export async function removeFriend(friendshipId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First get the friendship to find the other user
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('id', friendshipId)
    .single();

  if (fetchError) throw fetchError;
  if (!friendship) throw new Error('Friendship not found');

  const otherUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;

  // Remove both directions of the friendship
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${user.id})`
    );

  if (error) throw error;
}
