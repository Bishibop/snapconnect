import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getStoriesFromFriends,
  getCurrentUserStory,
  markStoryViewed,
  Story,
} from '../services/stories';
import { useAuth } from './AuthContext';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

interface StoriesContextType {
  friendStories: Story[];
  myStory: Story | null;
  refreshing: boolean;
  error: StandardError | null;
  refresh: () => Promise<void>;
  markViewed: (storyId: string) => Promise<void>;
  reload: (silent?: boolean) => Promise<void>;
}

const StoriesContext = createContext<StoriesContextType | null>(null);

export function useStoriesContext(): StoriesContextType {
  const context = useContext(StoriesContext);
  if (!context) {
    throw new Error('useStoriesContext must be used within a StoriesProvider');
  }
  return context;
}

interface StoriesProviderProps {
  children: React.ReactNode;
}

export function StoriesProvider({ children }: StoriesProviderProps) {
  const { user } = useAuth();

  // Track component mount state to prevent crashes from setState on unmounted components
  const isMountedRef = useRef(true);

  // Initialize with cached data synchronously
  const [friendStories, setFriendStories] = useState<Story[]>(() => {
    if (!user?.id) return [];
    return cache.get<Story[]>(CACHE_KEYS.STORIES, user.id, CACHE_DURATIONS.STORIES) || [];
  });

  const [myStory, setMyStory] = useState<Story | null>(() => {
    if (!user?.id) return null;
    const cached = cache.get<Story | null>(CACHE_KEYS.USER_STORY, user.id, CACHE_DURATIONS.STORIES);
    return cached !== undefined ? cached : null;
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);
  const { handleError, clearError } = createErrorState(setError, 'Stories');

  // Safe setState wrappers to prevent crashes
  const safeSetFriendStories = useCallback((stories: Story[]) => {
    if (isMountedRef.current) {
      setFriendStories(stories);
    }
  }, []);

  const safeSetMyStory = useCallback((story: Story | null) => {
    if (isMountedRef.current) {
      setMyStory(story);
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

  // Throttled function to handle story updates - prevents database spam
  const handleThrottledStoryUpdate = useCallback(
    (storyId: string) => {
      // Add to pending updates
      pendingUpdatesRef.current.add(storyId);

      // Clear existing timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      // Set new timeout to batch process updates
      throttleTimeoutRef.current = setTimeout(async () => {
        const storyIds = Array.from(pendingUpdatesRef.current);
        pendingUpdatesRef.current.clear();

        if (storyIds.length === 0) return;

        try {
          // Batch fetch all pending story updates in a single query
          const { data: storiesWithProfiles } = await supabase
            .from('stories')
            .select(`*, user_profile:profiles!stories_user_id_fkey(*)`)
            .in('id', storyIds)
            .eq('is_active', true); // Only get active stories

          if (!storiesWithProfiles || !user?.id) return;

          // Process each story update with crash protection
          storiesWithProfiles.forEach(storyWithProfile => {
            try {
              if (storyWithProfile.user_id === user.id) {
                // Update my story
                safeSetMyStory(storyWithProfile);
                cache.set(CACHE_KEYS.USER_STORY, storyWithProfile, user.id);
              } else {
                // Update friend stories
                const updatedStories = cache.update<Story[]>(
                  CACHE_KEYS.STORIES,
                  current => {
                    const stories = current || [];
                    const exists = stories.some(s => s.id === storyWithProfile.id);
                    return exists
                      ? stories.map(s => (s.id === storyWithProfile.id ? storyWithProfile : s))
                      : [storyWithProfile, ...stories].filter(s => s.is_active); // Only keep active stories
                  },
                  user.id
                );
                safeSetFriendStories(updatedStories);
              }
            } catch (error) {
              console.error('Error processing story update:', error);
            }
          });
        } catch (error) {
          console.error('Error in throttled story update:', error);
        }
      }, 500); // 500ms throttle - batches rapid updates
    },
    [user?.id, safeSetMyStory, safeSetFriendStories]
  );

  const loadStories = useCallback(
    async (silent = false) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        clearError();
        if (!silent) safeSetRefreshing(true);

        const [friendStoriesData, myStoryData] = await Promise.all([
          getStoriesFromFriends(),
          getCurrentUserStory(),
        ]);

        // Check if component is still mounted after async operations
        if (!isMountedRef.current) return;

        safeSetFriendStories(friendStoriesData);
        safeSetMyStory(myStoryData);

        // Cache the new data
        cache.set(CACHE_KEYS.STORIES, friendStoriesData, user.id);
        cache.set(CACHE_KEYS.USER_STORY, myStoryData, user.id);
      } catch (error) {
        if (!isMountedRef.current) return;

        ErrorHandler.handleApiError(error, 'load stories', silent);
        if (!silent) {
          handleError(error, { context: 'Loading stories' });
        }
      } finally {
        safeSetRefreshing(false);
      }
    },
    [user?.id, handleError, clearError, safeSetRefreshing, safeSetFriendStories, safeSetMyStory]
  );

  const refresh = useCallback(async () => {
    await loadStories(false); // Not silent for manual refresh
  }, [loadStories]);

  const markViewed = useCallback(
    async (storyId: string) => {
      if (!user?.id || !isMountedRef.current) return;

      try {
        await markStoryViewed(storyId);

        // Check if component is still mounted after async operation
        if (!isMountedRef.current) return;

        // Atomically update both cache and state to prevent race conditions
        const updatedStories = cache.update<Story[]>(
          CACHE_KEYS.STORIES,
          current => {
            const stories = current || [];
            return stories.map(story =>
              story.id === storyId ? { ...story, is_viewed: true } : story
            );
          },
          user.id
        );

        safeSetFriendStories(updatedStories);
      } catch (error) {
        if (!isMountedRef.current) return;
        ErrorHandler.handleApiError(error, 'mark story as viewed', true);
      }
    },
    [user?.id, safeSetFriendStories]
  );

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;

    // Check if we need fresh data
    const hasValidStoriesCache = cache.has(CACHE_KEYS.STORIES, user.id, CACHE_DURATIONS.STORIES);
    const hasValidUserStoryCache = cache.has(
      CACHE_KEYS.USER_STORY,
      user.id,
      CACHE_DURATIONS.STORIES
    );

    if (!hasValidStoriesCache || !hasValidUserStoryCache) {
      loadStories(true); // Silent background fetch
    }
  }, [user?.id, loadStories]);

  // SINGLE realtime subscription for the entire app - no more multiple subscriptions!
  useRealtimeSubscription(
    [
      {
        table: 'stories',
        event: '*',
        // Note: We listen to all stories since we need to know about friends' stories
        // The throttling will batch the database calls to prevent spam
      },
      {
        table: 'story_views',
        event: 'INSERT',
        filter: user?.id ? `viewer_id=eq.${user.id}` : undefined,
      },
    ],
    payload => {
      if (payload.table === 'stories') {
        const { eventType, new: newStory, old: oldStory } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          // Use throttled update to prevent database spam
          handleThrottledStoryUpdate(newStory.id);
        } else if (eventType === 'DELETE') {
          // Handle deletes immediately (no database call needed)
          try {
            if (oldStory.user_id === user?.id) {
              safeSetMyStory(null);
              if (user?.id) {
                cache.set(CACHE_KEYS.USER_STORY, null, user.id);
              }
            } else {
              // Atomically update both cache and state
              const updatedStories = cache.update<Story[]>(
                CACHE_KEYS.STORIES,
                current => {
                  const stories = current || [];
                  return stories.filter(s => s.id !== oldStory.id);
                },
                user?.id
              );
              safeSetFriendStories(updatedStories);
            }
          } catch (error) {
            console.error('Error handling story delete:', error);
          }
        }
      } else if (payload.table === 'story_views') {
        // Update viewed status when we view a story (no database call needed)
        try {
          const { story_id } = payload.new;

          if (user?.id) {
            // Atomically update both cache and state
            const updatedStories = cache.update<Story[]>(
              CACHE_KEYS.STORIES,
              current => {
                const stories = current || [];
                return stories.map(story =>
                  story.id === story_id ? { ...story, is_viewed: true } : story
                );
              },
              user?.id
            );
            safeSetFriendStories(updatedStories);
          }
        } catch (error) {
          console.error('Error handling story view update:', error);
        }
      }
    },
    {
      enabled: !!user?.id,
      dependencies: [user?.id, handleThrottledStoryUpdate, safeSetMyStory, safeSetFriendStories],
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
      safeSetFriendStories([]);
      safeSetMyStory(null);
      safeSetRefreshing(false);
      safeSetError(null);
    }
  }, [user?.id, safeSetFriendStories, safeSetMyStory, safeSetRefreshing, safeSetError]);

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

  const contextValue: StoriesContextType = {
    friendStories,
    myStory,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadStories,
  };

  return <StoriesContext.Provider value={contextValue}>{children}</StoriesContext.Provider>;
}
