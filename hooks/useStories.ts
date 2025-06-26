import { useState, useEffect, useCallback } from 'react';
import {
  getStoriesFromFriends,
  getCurrentUserStory,
  markStoryViewed,
  Story,
} from '../services/stories';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

export function useStories() {
  const { user } = useAuth();

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

  const loadStories = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        clearError();
        if (!silent) setRefreshing(true);

        const [friendStoriesData, myStoryData] = await Promise.all([
          getStoriesFromFriends(),
          getCurrentUserStory(),
        ]);
        setFriendStories(friendStoriesData);
        setMyStory(myStoryData);

        // Cache the new data
        cache.set(CACHE_KEYS.STORIES, friendStoriesData, user.id);
        cache.set(CACHE_KEYS.USER_STORY, myStoryData, user.id);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'load stories', silent);
        if (!silent) {
          handleError(error, { context: 'Loading stories' });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [user?.id, handleError, clearError]
  );

  const refresh = useCallback(async () => {
    await loadStories(false); // Not silent for manual refresh
  }, [loadStories]);

  const markViewed = useCallback(
    async (storyId: string) => {
      if (!user?.id) return;

      try {
        await markStoryViewed(storyId);

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

        setFriendStories(updatedStories);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'mark story as viewed', true);
      }
    },
    [user?.id]
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

  // Real-time subscription for story changes
  useRealtimeSubscription(
    [
      {
        table: 'stories',
        event: '*',
      },
      {
        table: 'story_views',
        event: 'INSERT',
        filter: user?.id ? `viewer_id=eq.${user.id}` : undefined,
      },
    ],
    async payload => {
      if (payload.table === 'stories') {
        const { eventType, new: newStory, old: oldStory } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          // Fetch complete story data with profile
          const { data: storyWithProfile } = await supabase
            .from('stories')
            .select(`*, user_profile:profiles!stories_user_id_fkey(*)`)
            .eq('id', newStory.id)
            .single();

          if (storyWithProfile) {
            if (storyWithProfile.user_id === user?.id) {
              setMyStory(storyWithProfile);
              if (user?.id) {
                cache.set(CACHE_KEYS.USER_STORY, storyWithProfile, user.id);
              }
            } else {
              // Atomically update both cache and state
              const updatedStories = cache.update<Story[]>(
                CACHE_KEYS.STORIES,
                current => {
                  const stories = current || [];
                  const exists = stories.some(s => s.id === storyWithProfile.id);
                  return exists
                    ? stories.map(s => (s.id === storyWithProfile.id ? storyWithProfile : s))
                    : [storyWithProfile, ...stories];
                },
                user?.id
              );
              setFriendStories(updatedStories);
            }
          }
        } else if (eventType === 'DELETE') {
          if (oldStory.user_id === user?.id) {
            setMyStory(null);
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
            setFriendStories(updatedStories);
          }
        }
      } else if (payload.table === 'story_views') {
        // Update viewed status when we view a story
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
          setFriendStories(updatedStories);
        }
      }
    },
    {
      enabled: !!user?.id,
      dependencies: [user?.id],
    }
  );

  return {
    friendStories,
    myStory,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadStories,
  };
}
