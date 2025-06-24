import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import { getStoriesFromFriends, getCurrentUserStory, Story } from '../services/stories';
import { supabase } from '../lib/supabase';
import StoryCircle from './StoryCircle';
import YourStoryCircle from './YourStoryCircle';

interface StoriesRowProps {
  onCreateStory: () => void;
  onViewStory: (story: Story) => void;
}

export default function StoriesRow({ onCreateStory, onViewStory }: StoriesRowProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [userStory, setUserStory] = useState<Story | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
    loadUserProfile();
    
    // Setup realtime subscription with proper cleanup
    const cleanup = setupRealtimeSubscription();
    
    return cleanup; // This will unsubscribe when component unmounts
  }, []);

  const loadStories = async () => {
    try {
      const [friendStories, currentUserStory] = await Promise.all([
        getStoriesFromFriends(),
        getCurrentUserStory(),
      ]);
      
      // Filter out current user's story from friends list (it's shown separately)
      const { data: { user } } = await supabase.auth.getUser();
      const filteredStories = friendStories.filter(story => story.user_id !== user?.id);
      
      setStories(filteredStories);
      setUserStory(currentUserStory);
    } catch (error: any) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Create a unique channel name to avoid conflicts between multiple StoriesRow instances
    const channelName = `stories-changes-${Math.random().toString(36).substring(2, 9)}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        (payload) => {
          console.log('Stories change:', payload);
          handleStoryChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_views',
        },
        (payload) => {
          console.log('Story views change:', payload);
          handleStoryViewChange(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleStoryChange = async (payload: any) => {
    const { eventType, new: newStory, old: oldStory } = payload;
    
    if (eventType === 'INSERT') {
      // Add new story to the list
      const { data: { user } } = await supabase.auth.getUser();
      if (newStory.user_id === user?.id) {
        // Update user's story
        setUserStory(newStory);
      } else {
        // Add friend's story
        setStories(prev => [{ ...newStory, is_viewed: false }, ...prev]);
      }
    } else if (eventType === 'UPDATE') {
      // Update existing story
      if (newStory.user_id === userStory?.user_id) {
        setUserStory(newStory.is_active ? newStory : null);
      } else {
        setStories(prev => 
          prev.map(story => 
            story.id === newStory.id 
              ? { ...newStory, is_viewed: story.is_viewed }
              : story
          ).filter(story => story.is_active) // Remove deactivated stories
        );
      }
    } else if (eventType === 'DELETE') {
      // Remove deleted story
      if (oldStory.user_id === userStory?.user_id) {
        setUserStory(null);
      } else {
        setStories(prev => prev.filter(story => story.id !== oldStory.id));
      }
    }
  };

  const handleStoryViewChange = async (payload: any) => {
    const { eventType, new: newView } = payload;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (eventType === 'INSERT' && newView.viewer_id === user?.id) {
      // Current user viewed a story - mark it as viewed
      setStories(prev => 
        prev.map(story => 
          story.id === newView.story_id 
            ? { ...story, is_viewed: true }
            : story
        )
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // Don't show the stories row if there are no stories and user hasn't created one
  if (stories.length === 0 && !userStory) {
    return (
      <View style={styles.container}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <YourStoryCircle
            userStory={userStory}
            username={username}
            onPress={onCreateStory}
            onStoryPress={onViewStory}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your story always comes first */}
        <YourStoryCircle
          userStory={userStory}
          username={username}
          onPress={onCreateStory}
          onStoryPress={onViewStory}
        />
        
        {/* Friends' stories */}
        {stories.map((story) => (
          <StoryCircle
            key={story.id}
            story={story}
            onPress={onViewStory}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  loadingContainer: {
    height: 90, // Same height as story circles
    justifyContent: 'center',
    alignItems: 'center',
  },
});