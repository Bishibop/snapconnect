import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Story } from '../services/stories';
import StoryCircle from './StoryCircle';
import YourStoryCircle from './YourStoryCircle';
import { useStories } from '../hooks/useStories';
import { useAuth } from '../contexts/AuthContext';
import { useProfileUsername } from '../hooks/useProfileUsername';

/**
 * Props for the StoriesRow component that displays user and friend stories
 */
interface StoriesRowProps {
  /** Callback when user wants to create a new story */
  onCreateStory: () => void;
  /** Callback when user wants to view an existing story */
  onViewStory: (story: Story) => void;
}

export default function StoriesRow({ onCreateStory, onViewStory }: StoriesRowProps) {
  const { friendStories: stories, myStory: userStory } = useStories();
  const { user } = useAuth();

  // Use lightweight hook that just gets username without global state management
  const username = useProfileUsername(user?.id || '');

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
});
