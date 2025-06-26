import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getStoriesFromFriends, getCurrentUserStory, markStoryViewed, Story } from '../services/stories';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';

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
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async (silent = false) => {
    if (!user?.id) return;

    try {
      setError(null);
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
      console.error('Error loading stories:', error);
      setError('Failed to load stories');
      if (!silent) {
        Alert.alert('Error', 'Failed to load stories');
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await loadStories(false); // Not silent for manual refresh
  }, [loadStories]);

  const markViewed = useCallback(async (storyId: string) => {
    if (!user?.id) return;

    try {
      await markStoryViewed(storyId);
      // Update local state to reflect viewed status
      const updatedStories = friendStories.map(story =>
        story.id === storyId ? { ...story, is_viewed: true } : story
      );
      setFriendStories(updatedStories);
      
      // Update cache
      cache.set(CACHE_KEYS.STORIES, updatedStories, user.id);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  }, [user?.id, friendStories]);

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;
    
    // Check if we need fresh data
    const hasValidStoriesCache = cache.has(CACHE_KEYS.STORIES, user.id, CACHE_DURATIONS.STORIES);
    const hasValidUserStoryCache = cache.has(CACHE_KEYS.USER_STORY, user.id, CACHE_DURATIONS.STORIES);
    
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
              cache.set(CACHE_KEYS.USER_STORY, storyWithProfile, user.id);
            } else {
              setFriendStories(prev => {
                const exists = prev.some(s => s.id === storyWithProfile.id);
                const updatedStories = exists 
                  ? prev.map(s => s.id === storyWithProfile.id ? storyWithProfile : s)
                  : [storyWithProfile, ...prev];
                
                // Update cache
                cache.set(CACHE_KEYS.STORIES, updatedStories, user.id);
                return updatedStories;
              });
            }
          }
        } else if (eventType === 'DELETE') {
          if (oldStory.user_id === user?.id) {
            setMyStory(null);
            cache.set(CACHE_KEYS.USER_STORY, null, user.id);
          } else {
            setFriendStories(prev => {
              const updatedStories = prev.filter(s => s.id !== oldStory.id);
              cache.set(CACHE_KEYS.STORIES, updatedStories, user.id);
              return updatedStories;
            });
          }
        }
      } else if (payload.table === 'story_views') {
        // Update viewed status when we view a story
        const { story_id } = payload.new;
        setFriendStories(prev => {
          const updatedStories = prev.map(story =>
            story.id === story_id ? { ...story, is_viewed: true } : story
          );
          
          // Update cache
          if (user?.id) {
            cache.set(CACHE_KEYS.STORIES, updatedStories, user.id);
          }
          return updatedStories;
        });
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