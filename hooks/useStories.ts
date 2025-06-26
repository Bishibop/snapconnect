import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getStoriesFromFriends, getCurrentUserStory, markStoryViewed, Story } from '../services/stories';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { supabase } from '../lib/supabase';

export function useStories() {
  const { user } = useAuth();
  const [friendStories, setFriendStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const [friendStoriesData, myStoryData] = await Promise.all([
        getStoriesFromFriends(),
        getCurrentUserStory(),
      ]);
      setFriendStories(friendStoriesData);
      setMyStory(myStoryData);
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories');
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadStories();
  }, [loadStories]);

  const markViewed = useCallback(async (storyId: string) => {
    if (!user?.id) return;

    try {
      await markStoryViewed(storyId);
      // Update local state to reflect viewed status
      setFriendStories(prev =>
        prev.map(story =>
          story.id === storyId ? { ...story, is_viewed: true } : story
        )
      );
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadStories();
  }, [loadStories]);

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
            } else {
              setFriendStories(prev => {
                const exists = prev.some(s => s.id === storyWithProfile.id);
                if (exists) {
                  return prev.map(s => s.id === storyWithProfile.id ? storyWithProfile : s);
                }
                return [storyWithProfile, ...prev];
              });
            }
          }
        } else if (eventType === 'DELETE') {
          if (oldStory.user_id === user?.id) {
            setMyStory(null);
          } else {
            setFriendStories(prev => prev.filter(s => s.id !== oldStory.id));
          }
        }
      } else if (payload.table === 'story_views') {
        // Update viewed status when we view a story
        const { story_id } = payload.new;
        setFriendStories(prev =>
          prev.map(story =>
            story.id === story_id ? { ...story, is_viewed: true } : story
          )
        );
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
    loading,
    refreshing,
    error,
    refresh,
    markViewed,
    reload: loadStories,
  };
}