import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFriends, removeFriend, FriendWithProfile } from '../services/friends';
import { useAuth } from '../contexts/AuthContext';
import { useFriendshipsSubscription } from './useRealtimeSubscription';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';

export function useFriends() {
  const { user } = useAuth();
  
  // Initialize with cached data synchronously
  const [friends, setFriends] = useState<FriendWithProfile[]>(() => {
    if (!user?.id) return [];
    return cache.get<FriendWithProfile[]>(CACHE_KEYS.FRIENDS, user.id, CACHE_DURATIONS.FRIENDS) || [];
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async (silent = false) => {
    if (!user?.id) return;
    
    try {
      setError(null);
      if (!silent) setRefreshing(true);
      
      const friendsList = await getFriends();
      setFriends(friendsList);
      
      // Cache the new data
      cache.set(CACHE_KEYS.FRIENDS, friendsList, user.id);
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends list');
      if (!silent) {
        Alert.alert('Error', 'Failed to load friends list');
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);


  const remove = useCallback(async (friend: FriendWithProfile) => {
    try {
      await removeFriend(friend.id);
      const updatedFriends = friends.filter(f => f.id !== friend.id);
      setFriends(updatedFriends);
      
      // Update cache with new data
      if (user?.id) {
        cache.set(CACHE_KEYS.FRIENDS, updatedFriends, user.id);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
      throw error;
    }
  }, [friends, user?.id]);

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;
    
    // Check if we need fresh data
    const hasValidCache = cache.has(CACHE_KEYS.FRIENDS, user.id, CACHE_DURATIONS.FRIENDS);
    if (!hasValidCache) {
      loadFriends(true); // Silent background fetch
    }
  }, [user?.id, loadFriends]);

  // Real-time subscription
  useFriendshipsSubscription(user?.id, () => {
    loadFriends(true); // Silent reload on real-time updates
  });

  return {
    friends,
    refreshing,
    error,
    remove,
    reload: loadFriends,
  };
}