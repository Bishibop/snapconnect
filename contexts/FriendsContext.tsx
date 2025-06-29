import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingRequests,
  getSentRequests,
  getFriends,
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
  removeFriend,
  FriendRequest,
  FriendWithProfile,
} from '../services/friends';
import { useAuth } from './AuthContext';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

interface FriendsContextType {
  friends: FriendWithProfile[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  error: StandardError | null;
  refreshFriends: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  declineRequest: (requestId: string) => Promise<boolean>;
  sendRequest: (userId: string) => Promise<boolean>;
  removeFriend: (friend: FriendWithProfile) => Promise<boolean>;
}

const FriendsContext = createContext<FriendsContextType | null>(null);

export function useFriendsContext(): FriendsContextType {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriendsContext must be used within a FriendsProvider');
  }
  return context;
}

interface FriendsProviderProps {
  children: React.ReactNode;
}

export function FriendsProvider({ children }: FriendsProviderProps) {
  const { user } = useAuth();

  // Track component mount state to prevent crashes
  const isMountedRef = useRef(true);

  // Initialize with cached data
  const [friends, setFriends] = useState<FriendWithProfile[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<FriendWithProfile[]>(CACHE_KEYS.FRIENDS, user.id, CACHE_DURATIONS.FRIENDS) || []
    );
  });

  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<FriendRequest[]>(
        CACHE_KEYS.FRIEND_REQUESTS_RECEIVED,
        user.id,
        CACHE_DURATIONS.FRIENDS
      ) || []
    );
  });

  const [sentRequests, setSentRequests] = useState<FriendRequest[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<FriendRequest[]>(
        CACHE_KEYS.FRIEND_REQUESTS_SENT,
        user.id,
        CACHE_DURATIONS.FRIENDS
      ) || []
    );
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);
  const { handleError, clearError } = createErrorState(setError, 'Friends');

  // Safe setState wrappers
  const safeSetFriends = useCallback((friends: FriendWithProfile[]) => {
    if (isMountedRef.current) {
      setFriends(friends);
    }
  }, []);

  const safeSetReceivedRequests = useCallback((requests: FriendRequest[]) => {
    if (isMountedRef.current) {
      setReceivedRequests(requests);
    }
  }, []);

  const safeSetSentRequests = useCallback((requests: FriendRequest[]) => {
    if (isMountedRef.current) {
      setSentRequests(requests);
    }
  }, []);

  const safeSetLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setLoading(loading);
    }
  }, []);

  const refreshFriends = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        if (!silent) {
          clearError();
          safeSetLoading(true);
        }

        const friendsData = await getFriends();

        if (!isMountedRef.current) return;

        safeSetFriends(friendsData);
        cache.set(CACHE_KEYS.FRIENDS, friendsData, user.id);
      } catch (error) {
        if (!isMountedRef.current) return;

        ErrorHandler.handleApiError(error, 'load friends', silent);
        if (!silent) {
          handleError(error, { context: 'Loading friends' });
        }
      } finally {
        if (!silent) safeSetLoading(false);
      }
    },
    [user?.id, handleError, clearError, safeSetLoading, safeSetFriends]
  );

  const refreshRequests = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        if (!silent) {
          clearError();
          safeSetLoading(true);
        }

        const [received, sent] = await Promise.all([getPendingRequests(), getSentRequests()]);

        if (!isMountedRef.current) return;

        safeSetReceivedRequests(received);
        safeSetSentRequests(sent);

        cache.set(CACHE_KEYS.FRIEND_REQUESTS_RECEIVED, received, user.id);
        cache.set(CACHE_KEYS.FRIEND_REQUESTS_SENT, sent, user.id);
      } catch (error) {
        if (!isMountedRef.current) return;

        ErrorHandler.handleApiError(error, 'load friend requests', silent);
        if (!silent) {
          handleError(error, { context: 'Loading friend requests' });
        }
      } finally {
        if (!silent) safeSetLoading(false);
      }
    },
    [
      user?.id,
      handleError,
      clearError,
      safeSetLoading,
      safeSetReceivedRequests,
      safeSetSentRequests,
    ]
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!isMountedRef.current) return false;

      try {
        await acceptFriendRequest(requestId);

        if (!isMountedRef.current) return false;

        // Update local state immediately for better UX
        const updatedRequests = receivedRequests.filter((r: FriendRequest) => r.id !== requestId);
        safeSetReceivedRequests(updatedRequests);

        // Refresh friends list to include new friend
        await refreshFriends(true);

        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;
        ErrorHandler.handleApiError(error, 'accept friend request');
        return false;
      }
    },
    [refreshFriends, safeSetReceivedRequests, receivedRequests]
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      if (!isMountedRef.current) return false;

      try {
        await declineFriendRequest(requestId);

        if (!isMountedRef.current) return false;

        // Update local state immediately
        const updatedRequests = receivedRequests.filter((r: FriendRequest) => r.id !== requestId);
        safeSetReceivedRequests(updatedRequests);

        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;
        ErrorHandler.handleApiError(error, 'decline friend request');
        return false;
      }
    },
    [safeSetReceivedRequests, receivedRequests]
  );

  const sendRequest = useCallback(
    async (userId: string) => {
      if (!isMountedRef.current) return false;

      try {
        await sendFriendRequest(userId);

        if (!isMountedRef.current) return false;

        // Refresh sent requests to show new request
        await refreshRequests(true);

        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;
        ErrorHandler.handleApiError(error, 'send friend request');
        return false;
      }
    },
    [refreshRequests]
  );

  const removeFriendFromList = useCallback(
    async (friend: FriendWithProfile) => {
      if (!isMountedRef.current) return false;

      try {
        await removeFriend(friend.id);

        if (!isMountedRef.current) return false;

        // Update local state immediately
        const updatedFriends = friends.filter((f: FriendWithProfile) => f.id !== friend.id);
        safeSetFriends(updatedFriends);

        // Update cache
        if (user?.id) {
          cache.set(CACHE_KEYS.FRIENDS, updatedFriends, user.id);
        }

        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;
        ErrorHandler.handleApiError(error, 'remove friend');
        return false;
      }
    },
    [friends, user?.id, safeSetFriends]
  );

  // Initial data load
  useEffect(() => {
    if (!user?.id) return;

    const hasValidFriendsCache = cache.has(CACHE_KEYS.FRIENDS, user.id, CACHE_DURATIONS.FRIENDS);
    const hasValidRequestsCache = cache.has(
      CACHE_KEYS.FRIEND_REQUESTS_RECEIVED,
      user.id,
      CACHE_DURATIONS.FRIENDS
    );

    if (!hasValidFriendsCache) {
      refreshFriends(true);
    }

    if (!hasValidRequestsCache) {
      refreshRequests(true);
    }
  }, [user?.id, refreshFriends, refreshRequests]);

  // Polling for friend updates every 1 second
  useEffect(() => {
    if (!user?.id) return;

    // Initial poll after a short delay to let initial cache load complete
    const initialTimer = setTimeout(() => {
      refreshFriends(true); // silent refresh
      refreshRequests(true); // silent refresh
    }, 500);

    // Set up recurring poll every 1 second
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current) return;

      try {
        await Promise.all([
          refreshFriends(true), // silent refresh
          refreshRequests(true), // silent refresh
        ]);
      } catch {
        // Polling error
      }
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
    };
  }, [user?.id, refreshFriends, refreshRequests]);

  // Reset state when user changes
  useEffect(() => {
    if (!user?.id) {
      safeSetFriends([]);
      safeSetReceivedRequests([]);
      safeSetSentRequests([]);
      safeSetLoading(false);
      setError(null);
    }
  }, [user?.id, safeSetFriends, safeSetReceivedRequests, safeSetSentRequests, safeSetLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contextValue: FriendsContextType = {
    friends,
    receivedRequests,
    sentRequests,
    loading,
    error,
    refreshFriends,
    refreshRequests,
    acceptRequest,
    declineRequest,
    sendRequest,
    removeFriend: removeFriendFromList,
  };

  return <FriendsContext.Provider value={contextValue}>{children}</FriendsContext.Provider>;
}
