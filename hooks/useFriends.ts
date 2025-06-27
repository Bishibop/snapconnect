import { useFriendsContext } from '../contexts/FriendsContext';

/**
 * Hook to access friends data from the global FriendsContext
 * This replaces the previous implementation that created multiple subscriptions
 */
export function useFriends() {
  const { friends, loading, error, refreshFriends, removeFriend } = useFriendsContext();

  return {
    friends,
    refreshing: loading,
    error,
    refresh: refreshFriends,
    reload: refreshFriends,
    remove: removeFriend,
  };
}
