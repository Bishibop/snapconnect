import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Story } from '../services/stories';
import { supabase } from '../lib/supabase';
import StoryCircle from './StoryCircle';
import YourStoryCircle from './YourStoryCircle';
import LoadingSpinner from './ui/LoadingSpinner';
import { useStories } from '../hooks/useStories';

interface StoriesRowProps {
  onCreateStory: () => void;
  onViewStory: (story: Story) => void;
}

export default function StoriesRow({ onCreateStory, onViewStory }: StoriesRowProps) {
  const { friendStories: stories, myStory: userStory, loading } = useStories();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    } catch (error: unknown) {
      console.error('Error loading user profile:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="small" />
        </View>
      </View>
    );
  }

  // Always show stories row for consistency
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
        {stories.map(story => (
          <StoryCircle key={story.id} story={story} onPress={onViewStory} />
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
