import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getPostedVibeReelsFromFriends,
  getCurrentUserPostedVibeReel,
  markVibeReelViewed,
  VibeReelWithViewStatus,
  VibeReel,
} from '../services/vibeReels';
import { useAuth } from './AuthContext';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, ErrorHandlingOptions } from '../utils/errorHandler';

interface VibeReelsContextType {
  friendVibeReels: VibeReelWithViewStatus[];
  myVibeReel: VibeReel | null;
  refreshing: boolean;
  error: StandardError | null;
  refresh: () => Promise<void>;
  markViewed: (vibeReelId: string) => Promise<void>;
  reload: (silent?: boolean) => Promise<void>;
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
      cache.get<VibeReelWithViewStatus[]>('VIBE_REELS', user.id, CACHE_DURATIONS.STORIES) || []
    );
  });

  const [myVibeReel, setMyVibeReel] = useState<VibeReel | null>(() => {
    if (!user?.id) return null;
    const cached = cache.get<VibeReel | null>('USER_VIBE_REEL', user.id, CACHE_DURATIONS.STORIES);
    return cached !== undefined ? cached : null;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);

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

  const safeSetMyVibeReel = useCallback((vibeReel: VibeReel | null) => {
    if (isMountedRef.current) {
      setMyVibeReel(vibeReel);
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

  // Throttling for realtime subscription to prevent database spam
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Throttled function to handle VibeReel updates - prevents database spam
  const handleThrottledVibeReelUpdate = useCallback(
    (vibeReelId: string) => {
      // Add to pending updates
      pendingUpdatesRef.current.add(vibeReelId);

      // Clear existing timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      // Set new timeout to batch process updates
      throttleTimeoutRef.current = setTimeout(async () => {
        const vibeReelIds = Array.from(pendingUpdatesRef.current);
        pendingUpdatesRef.current.clear();

        if (vibeReelIds.length === 0) return;

        console.log('[THROTTLED UPDATE] Processing vibeReel IDs:', vibeReelIds);

        try {
          // First get the list of friend IDs to filter against
          const { data: friendships, error: friendError } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', user?.id)
            .eq('status', 'accepted');

          if (friendError) {
            console.error('Error fetching friends:', friendError);
            return;
          }

          const friendIds = friendships?.map(f => f.friend_id) || [];

          // Batch fetch all pending VibeReel updates in a single query
          const { data: vibeReelsWithData, error } = await supabase
            .from('vibe_reels')
            .select(
              `
              *,
              creator:profiles!vibe_reels_creator_id_fkey(username),
              primary_art:art_pieces(image_url, vibe_count),
              vibe_reel_views!vibe_reel_views_vibe_reel_id_fkey(viewer_id)
            `
            )
            .in('id', vibeReelIds);

          console.log('[THROTTLED UPDATE] Query result:', {
            data: vibeReelsWithData,
            error,
            count: vibeReelsWithData?.length,
          });

          if (!vibeReelsWithData || !user?.id) return;

          // Process each VibeReel update with crash protection
          vibeReelsWithData.forEach(vibeReelWithData => {
            try {
              // Add view status
              const vibeReelWithViewStatus = {
                ...vibeReelWithData,
                is_viewed:
                  vibeReelWithData.vibe_reel_views?.some(
                    (view: any) => view.viewer_id === user.id
                  ) || false,
              };

              console.log('[THROTTLED UPDATE] Processing VibeReel:', {
                id: vibeReelWithData.id,
                creator_id: vibeReelWithData.creator_id,
                user_id: user.id,
                is_mine: vibeReelWithData.creator_id === user.id,
                is_friend: friendIds.includes(vibeReelWithData.creator_id),
                has_posted_at: !!vibeReelWithData.posted_at,
                posted_at: vibeReelWithData.posted_at,
              });

              if (vibeReelWithData.creator_id === user.id && vibeReelWithData.posted_at) {
                console.log('[THROTTLED UPDATE] Updating MY posted VibeReel');
                // Update my posted VibeReel
                safeSetMyVibeReel(vibeReelWithData);
                cache.set('USER_VIBE_REEL', vibeReelWithData, user.id);
              } else if (
                vibeReelWithData.creator_id !== user.id &&
                vibeReelWithData.posted_at &&
                friendIds.includes(vibeReelWithData.creator_id)
              ) {
                console.log('[THROTTLED UPDATE] Updating FRIEND VibeReel');
                // Update friend VibeReels - only if they are actually a friend
                const updatedVibeReels = cache.update<VibeReelWithViewStatus[]>(
                  'VIBE_REELS',
                  current => {
                    const vibeReels = current || [];

                    // Remove any existing vibe reels from the same creator
                    const filteredVibeReels = vibeReels.filter(
                      vr => vr.creator_id !== vibeReelWithViewStatus.creator_id
                    );

                    // Add the new vibe reel if it's posted
                    if (vibeReelWithViewStatus.posted_at) {
                      return [vibeReelWithViewStatus, ...filteredVibeReels];
                    }

                    return filteredVibeReels;
                  },
                  user.id
                );
                safeSetFriendVibeReels(updatedVibeReels);
              }
            } catch (error) {
              console.error('Error processing VibeReel update:', error);
            }
          });
        } catch (error) {
          console.error('Error in throttled VibeReel update:', error);
        }
      }, 500); // 500ms throttle - batches rapid updates
    },
    [user?.id, safeSetMyVibeReel, safeSetFriendVibeReels]
  );

  const loadVibeReels = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      console.log('[LOAD VIBEREELS] Starting load, silent:', silent);

      try {
        clearError();
        if (!silent) safeSetRefreshing(true);

        const [friendVibeReelsData, myVibeReelData] = await Promise.all([
          getPostedVibeReelsFromFriends(),
          getCurrentUserPostedVibeReel(),
        ]);

        // Check if component is still mounted after async operations
        if (!isMountedRef.current) return;

        console.log('[LOAD VIBEREELS] Results:', {
          friendCount: friendVibeReelsData.length,
          hasMyVibeReel: !!myVibeReelData,
          myVibeReelId: myVibeReelData?.id,
          myVibeReelPostedAt: myVibeReelData?.posted_at,
        });

        safeSetFriendVibeReels(friendVibeReelsData);
        safeSetMyVibeReel(myVibeReelData);

        // Cache the new data
        cache.set('VIBE_REELS', friendVibeReelsData, user.id);
        cache.set('USER_VIBE_REEL', myVibeReelData, user.id);
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
      safeSetMyVibeReel,
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
    const hasValidVibeReelsCache = cache.has('VIBE_REELS', user.id, CACHE_DURATIONS.STORIES);
    const hasValidUserVibeReelCache = cache.has('USER_VIBE_REEL', user.id, CACHE_DURATIONS.STORIES);

    if (!hasValidVibeReelsCache || !hasValidUserVibeReelCache) {
      // Prevent concurrent loads
      loadingRef.current = true;

      // Call loadVibeReels directly without it being a dependency
      (async () => {
        if (!user?.id || !isMountedRef.current) return;

        console.log('[LOAD VIBEREELS] Starting load, silent:', true);

        try {
          clearError();

          const [friendVibeReelsData, myVibeReelData] = await Promise.all([
            getPostedVibeReelsFromFriends(),
            getCurrentUserPostedVibeReel(),
          ]);

          // Check if component is still mounted after async operations
          if (!isMountedRef.current) return;

          console.log('[LOAD VIBEREELS] Results:', {
            friendCount: friendVibeReelsData.length,
            hasMyVibeReel: !!myVibeReelData,
            myVibeReelId: myVibeReelData?.id,
            myVibeReelPostedAt: myVibeReelData?.posted_at,
          });

          // The service already deduplicates, but double-check here for safety
          safeSetFriendVibeReels(friendVibeReelsData);
          safeSetMyVibeReel(myVibeReelData);

          // Cache the new data
          cache.set('VIBE_REELS', friendVibeReelsData, user.id);
          cache.set('USER_VIBE_REEL', myVibeReelData, user.id);
        } catch (error) {
          if (!isMountedRef.current) return;

          ErrorHandler.handleApiError(error, 'load VibeReels', true);
        } finally {
          loadingRef.current = false;
        }
      })();
    }
  }, [user?.id, clearError, safeSetFriendVibeReels, safeSetMyVibeReel]); // Minimal stable dependencies

  // SINGLE realtime subscription for the entire app - no more multiple subscriptions!
  useRealtimeSubscription(
    [
      {
        table: 'vibe_reels',
        event: '*',
        // Note: We listen to all VibeReels since we need to know about friends' VibeReels
        // The throttling will batch the database calls to prevent spam
      },
      {
        table: 'vibe_reel_views',
        event: 'INSERT',
        filter: user?.id ? `viewer_id=eq.${user.id}` : undefined,
      },
    ],
    payload => {
      if (payload.table === 'vibe_reels') {
        const { eventType, new: newVibeReel, old: oldVibeReel } = payload;

        console.log(`[REALTIME] VibeReel ${eventType} event:`, {
          id: newVibeReel?.id || oldVibeReel?.id,
          creator_id: newVibeReel?.creator_id || oldVibeReel?.creator_id,
          current_user_id: user?.id,
          is_mine: (newVibeReel?.creator_id || oldVibeReel?.creator_id) === user?.id,
          old_posted_at: oldVibeReel?.posted_at,
          new_posted_at: newVibeReel?.posted_at,
          posted_at_changed: oldVibeReel?.posted_at !== newVibeReel?.posted_at,
        });

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          // Handle all VibeReel updates, including when posted_at is set
          handleThrottledVibeReelUpdate(newVibeReel.id);
        } else if (eventType === 'DELETE') {
          // Handle deletes immediately (no database call needed)
          try {
            if (oldVibeReel.creator_id === user?.id) {
              safeSetMyVibeReel(null);
              if (user?.id) {
                cache.set('USER_VIBE_REEL', null, user.id);
              }
            } else {
              // Atomically update both cache and state
              const updatedVibeReels = cache.update<VibeReelWithViewStatus[]>(
                'VIBE_REELS',
                current => {
                  const vibeReels = current || [];
                  return vibeReels.filter(vr => vr.id !== oldVibeReel.id);
                },
                user?.id
              );
              safeSetFriendVibeReels(updatedVibeReels);
            }
          } catch (error) {
            console.error('Error handling VibeReel delete:', error);
          }
        }
      } else if (payload.table === 'vibe_reel_views') {
        // Update viewed status when we view a VibeReel (no database call needed)
        try {
          const { vibe_reel_id } = payload.new;

          if (user?.id) {
            // Atomically update both cache and state
            const updatedVibeReels = cache.update<VibeReelWithViewStatus[]>(
              'VIBE_REELS',
              current => {
                const vibeReels = current || [];
                return vibeReels.map(vibeReel =>
                  vibeReel.id === vibe_reel_id ? { ...vibeReel, is_viewed: true } : vibeReel
                );
              },
              user?.id
            );
            safeSetFriendVibeReels(updatedVibeReels);
          }
        } catch (error) {
          console.error('Error handling VibeReel view update:', error);
        }
      }
    },
    {
      enabled: !!user?.id,
      dependencies: [
        user?.id,
        handleThrottledVibeReelUpdate,
        safeSetMyVibeReel,
        safeSetFriendVibeReels,
      ],
    }
  );

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when user changes
  useEffect(() => {
    if (!user?.id) {
      safeSetFriendVibeReels([]);
      safeSetMyVibeReel(null);
      safeSetRefreshing(false);
      safeSetError(null);
    }
  }, [user?.id, safeSetFriendVibeReels, safeSetMyVibeReel, safeSetRefreshing, safeSetError]);

  // Mark component as unmounted to prevent crashes
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Also cleanup any pending throttle timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: VibeReelsContextType = {
    friendVibeReels,
    myVibeReel,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadVibeReels,
  };

  return <VibeReelsContext.Provider value={contextValue}>{children}</VibeReelsContext.Provider>;
}
