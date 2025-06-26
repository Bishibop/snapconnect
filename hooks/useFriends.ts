import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFriends, removeFriend, FriendWithProfile } from '../services/friends';
import { useAuth } from '../contexts/AuthContext';
import { useFriendshipsSubscription } from './useRealtimeSubscription';

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      setError(null);
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends list');
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
  }, [loadFriends]);

  const remove = useCallback(async (friend: FriendWithProfile) => {
    try {
      await removeFriend(friend.id);
      setFriends(prev => prev.filter(f => f.id !== friend.id));
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Real-time subscription
  useFriendshipsSubscription(user?.id, () => {
    loadFriends();
  });

  return {
    friends,
    loading,
    refreshing,
    error,
    refresh,
    remove,
    reload: loadFriends,
  };
}