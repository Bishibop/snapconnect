import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getPostedVibeReelsFromFriends,
  getCurrentUserPostedVibeReels,
  markVibeReelViewed,
  VibeReelWithViewStatus,
  VibeReel,
} from '../services/vibeReels';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { cache, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, ErrorHandlingOptions } from '../utils/errorHandler';

interface VibeReelsContextType {
  friendVibeReels: VibeReelWithViewStatus[];
  myVibeReels: VibeReel[];
  refreshing: boolean;
  error: StandardError | null;
  refresh: () => Promise<void>;
  markViewed: (vibeReelId: string) => Promise<void>;
  reload: (silent?: boolean) => Promise<void>;
  updateFriendIds: (friendIds: string[]) => void;
}

const VibeReelsContext = createContext<VibeReelsContextType | null>(null);

export function useVibeReelsContext(): VibeReelsContextType {
  const context = useContext(VibeReelsContext);
  if (!context) {
    throw new Error('useVibeReelsContext must be used within a VibeReelsProvider');
  }
  return context;
}

interface VibeReelsProviderProps {
  children: React.ReactNode;
}

export function VibeReelsProvider({ children }: VibeReelsProviderProps) {
  const { user } = useAuth();

  // Track component mount state to prevent crashes from setState on unmounted components
  const isMountedRef = useRef(true);

  // Initialize with cached data synchronously
  const [friendVibeReels, setFriendVibeReels] = useState<VibeReelWithViewStatus[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<VibeReelWithViewStatus[]>('VIBE_REELS', user.id, CACHE_DURATIONS.VIBE_REELS) || []
    );
  });

  const [myVibeReels, setMyVibeReels] = useState<VibeReel[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<VibeReel[]>('USER_VIBE_REELS', user.id, CACHE_DURATIONS.VIBE_REELS) || []
    );
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);

  // Cache friend IDs for client-side filtering
  const [friendIds, setFriendIds] = useState<string[]>([]);

  // Memoize error handlers to prevent unnecessary re-renders
  const handleError = useCallback((error: unknown, options: ErrorHandlingOptions = {}) => {
    const standardError = ErrorHandler.handle(error, {
      context: 'VibeReels',
      ...options,
    });
    setError(standardError);
    return standardError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Safe setState wrappers to prevent crashes
  const safeSetFriendVibeReels = useCallback((vibeReels: VibeReelWithViewStatus[]) => {
    if (isMountedRef.current) {
      setFriendVibeReels(vibeReels);
    }
  }, []);

  const safeSetMyVibeReels = useCallback((vibeReels: VibeReel[]) => {
    if (isMountedRef.current) {
      setMyVibeReels(vibeReels);
    }
  }, []);

  const safeSetRefreshing = useCallback((refreshing: boolean) => {
    if (isMountedRef.current) {
      setRefreshing(refreshing);
    }
  }, []);

  const safeSetError = useCallback((error: StandardError | null) => {
    if (isMountedRef.current) {
      setError(error);
    }
  }, []);

  // Function to update friend IDs (called from FriendsContext)
  const updateFriendIds = useCallback((newFriendIds: string[]) => {
    if (isMountedRef.current) {
      setFriendIds(newFriendIds);
      // Also update any existing vibe reels to filter out non-friends
      setFriendVibeReels(current => current.filter(vr => newFriendIds.includes(vr.creator_id)));
    }
  }, []);

  const loadVibeReels = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        clearError();
        if (!silent) safeSetRefreshing(true);

        // Also fetch friend IDs for client-side filtering
        const [friendVibeReelsData, myVibeReelsData, friendshipsData] = await Promise.all([
          getPostedVibeReelsFromFriends(),
          getCurrentUserPostedVibeReels(),
          supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', user.id)
            .eq('status', 'accepted'),
        ]);

        // Check if component is still mounted after async operations
        if (!isMountedRef.current) return;

        // Update friend IDs
        const newFriendIds = friendshipsData.data?.map(f => f.friend_id) || [];
        setFriendIds(newFriendIds);

        safeSetFriendVibeReels(friendVibeReelsData);
        safeSetMyVibeReels(myVibeReelsData);

        // Cache the new data
        cache.set('VIBE_REELS', friendVibeReelsData, user.id);
        cache.set('USER_VIBE_REELS', myVibeReelsData, user.id);
      } catch (error) {
        if (!isMountedRef.current) return;

        ErrorHandler.handleApiError(error, 'load VibeReels', silent);
        if (!silent) {
          handleError(error, { context: 'Loading VibeReels' });
        }
      } finally {
        safeSetRefreshing(false);
      }
    },
    [
      user?.id,
      handleError,
      clearError,
      safeSetRefreshing,
      safeSetFriendVibeReels,
      safeSetMyVibeReels,
    ]
  );

  const refresh = useCallback(async () => {
    await loadVibeReels(false); // Not silent for manual refresh
  }, [loadVibeReels]);

  const markViewed = useCallback(
    async (vibeReelId: string) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        await markVibeReelViewed(vibeReelId);

        // Check if component is still mounted after async operation
        if (!isMountedRef.current) return;

        // Atomically update both cache and state to prevent race conditions
        const updatedVibeReels = cache.update<VibeReelWithViewStatus[]>(
          'VIBE_REELS',
          current => {
            const vibeReels = current || [];
            return vibeReels.map(vibeReel =>
              vibeReel.id === vibeReelId ? { ...vibeReel, is_viewed: true } : vibeReel
            );
          },
          user.id
        );

        safeSetFriendVibeReels(updatedVibeReels);
      } catch (error) {
        if (!isMountedRef.current) return;
        ErrorHandler.handleApiError(error, 'mark VibeReel as viewed', true);
      }
    },
    [user?.id, safeSetFriendVibeReels]
  );

  // Track if we're currently loading to prevent concurrent loads
  const loadingRef = useRef(false);

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id || loadingRef.current) return;

    // Check if we need fresh data
    const hasValidVibeReelsCache = cache.has('VIBE_REELS', user.id, CACHE_DURATIONS.VIBE_REELS);
    const hasValidUserVibeReelsCache = cache.has(
      'USER_VIBE_REELS',
      user.id,
      CACHE_DURATIONS.VIBE_REELS
    );

    if (!hasValidVibeReelsCache || !hasValidUserVibeReelsCache) {
      // Prevent concurrent loads
      loadingRef.current = true;

      // Use the existing loadVibeReels function with silent=true
      loadVibeReels(true).finally(() => {
        loadingRef.current = false;
      });
    }
  }, [user?.id, loadVibeReels]); // Use loadVibeReels as dependency

  // Add 1-second polling
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      loadVibeReels(true); // silent refresh
    }, 1000); // Poll every 1 second

    return () => clearInterval(interval);
  }, [user?.id, loadVibeReels]);

  // Reset state when user changes
  useEffect(() => {
    if (!user?.id) {
      safeSetFriendVibeReels([]);
      safeSetMyVibeReels([]);
      safeSetRefreshing(false);
      safeSetError(null);
    }
  }, [user?.id, safeSetFriendVibeReels, safeSetMyVibeReels, safeSetRefreshing, safeSetError]);

  // Mark component as unmounted to prevent crashes
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contextValue: VibeReelsContextType = {
    friendVibeReels,
    myVibeReels,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadVibeReels,
    updateFriendIds,
  };

  return <VibeReelsContext.Provider value={contextValue}>{children}</VibeReelsContext.Provider>;
}
