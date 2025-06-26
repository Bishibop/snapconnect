import { useState, useEffect, useCallback } from 'react';
import { getFriends, removeFriend, FriendWithProfile } from '../services/friends';
import { useAuth } from '../contexts/AuthContext';
import { useFriendshipsSubscription } from './useRealtimeSubscription';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

export function useFriends() {
  const { user } = useAuth();

  // Initialize with cached data synchronously
  const [friends, setFriends] = useState<FriendWithProfile[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<FriendWithProfile[]>(CACHE_KEYS.FRIENDS, user.id, CACHE_DURATIONS.FRIENDS) || []
    );
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);
  const { handleError, clearError } = createErrorState(setError, 'Friends');

  const loadFriends = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        clearError();
        if (!silent) setRefreshing(true);

        const friendsList = await getFriends();
        setFriends(friendsList);

        // Cache the new data
        cache.set(CACHE_KEYS.FRIENDS, friendsList, user.id);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'load friends', silent);
        if (!silent) {
          handleError(error, { context: 'Loading friends' });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [user?.id, handleError, clearError]
  );

  const refresh = useCallback(async () => {
    await loadFriends(false); // Not silent for manual refresh
  }, [loadFriends]);

  const remove = useCallback(
    async (friend: FriendWithProfile) => {
      if (!user?.id) return;

      try {
        await removeFriend(friend.id);

        // Atomically update both cache and state
        const updatedFriends = cache.update<FriendWithProfile[]>(
          CACHE_KEYS.FRIENDS,
          current => {
            const friends = current || [];
            return friends.filter(f => f.id !== friend.id);
          },
          user.id
        );

        setFriends(updatedFriends);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'remove friend', false);
        throw error;
      }
    },
    [user?.id]
  );

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
    refresh,
    remove,
    reload: loadFriends,
  };
}
