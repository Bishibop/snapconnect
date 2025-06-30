import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllPostedVibeReels,
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
  myVibeReels: VibeReelWithViewStatus[];
  communityVibeReels: VibeReelWithViewStatus[];
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
  const [allVibeReels, setAllVibeReels] = useState<VibeReelWithViewStatus[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<VibeReelWithViewStatus[]>('ALL_VIBE_REELS', user.id, CACHE_DURATIONS.VIBE_REELS) ||
      []
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

  // Safe setState wrapper to prevent crashes
  const safeSetAllVibeReels = useCallback((vibeReels: VibeReelWithViewStatus[]) => {
    if (isMountedRef.current) {
      setAllVibeReels(vibeReels);
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
    }
  }, []);

  const loadVibeReels = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        clearError();
        if (!silent) safeSetRefreshing(true);

        // Fetch all vibe reels and friend IDs for client-side filtering
        const [allVibeReelsData, friendshipsData] = await Promise.all([
          getAllPostedVibeReels(),
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

        safeSetAllVibeReels(allVibeReelsData);

        // Cache the new data
        cache.set('ALL_VIBE_REELS', allVibeReelsData, user.id);
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
    [user?.id, handleError, clearError, safeSetRefreshing, safeSetAllVibeReels]
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
          'ALL_VIBE_REELS',
          current => {
            const vibeReels = current || [];
            return vibeReels.map(vibeReel =>
              vibeReel.id === vibeReelId ? { ...vibeReel, is_viewed: true } : vibeReel
            );
          },
          user.id
        );

        safeSetAllVibeReels(updatedVibeReels);
      } catch (error) {
        if (!isMountedRef.current) return;
        ErrorHandler.handleApiError(error, 'mark VibeReel as viewed', true);
      }
    },
    [user?.id, safeSetAllVibeReels]
  );

  // Track if we're currently loading to prevent concurrent loads
  const loadingRef = useRef(false);

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id || loadingRef.current) return;

    // Check if we need fresh data
    const hasValidCache = cache.has('ALL_VIBE_REELS', user.id, CACHE_DURATIONS.VIBE_REELS);

    if (!hasValidCache) {
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
      safeSetAllVibeReels([]);
      safeSetRefreshing(false);
      safeSetError(null);
    }
  }, [user?.id, safeSetAllVibeReels, safeSetRefreshing, safeSetError]);

  // Mark component as unmounted to prevent crashes
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create a Set for O(1) friend ID lookup instead of O(n) with includes
  const friendIdSet = new Set(friendIds);

  // Compute filtered arrays for backward compatibility
  const friendVibeReels = allVibeReels.filter(vr => friendIdSet.has(vr.creator_id));
  const myVibeReels = allVibeReels.filter(vr => vr.creator_id === user?.id);
  // Community shows only non-friend, non-self vibe reels
  const communityVibeReels = allVibeReels.filter(
    vr => !friendIdSet.has(vr.creator_id) && vr.creator_id !== user?.id
  );

  const contextValue: VibeReelsContextType = {
    friendVibeReels,
    myVibeReels,
    communityVibeReels,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadVibeReels,
    updateFriendIds,
  };

  return <VibeReelsContext.Provider value={contextValue}>{children}</VibeReelsContext.Provider>;
}
