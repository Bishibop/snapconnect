import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Story } from '../services/stories';

interface YourStoryCircleProps {
  userStory: Story | null;
  username: string;
  onPress: () => void;
  onStoryPress?: (story: Story) => void;
}

export default function YourStoryCircle({ 
  userStory, 
  username, 
  onPress, 
  onStoryPress 
}: YourStoryCircleProps) {
  // Get first 2 letters of username, uppercase
  const getInitials = (username: string): string => {
    return username.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(username);
  const hasStory = userStory !== null;

  const handlePress = () => {
    if (hasStory && userStory && onStoryPress) {
      onStoryPress(userStory);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.circleContainer}>
        <View style={[
          styles.circle,
          hasStory ? styles.storyCircle : styles.addCircle
        ]}>
          {hasStory ? (
            <Text style={styles.initials}>{initials}</Text>
          ) : (
            <Text style={styles.plusIcon}>+</Text>
          )}
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {hasStory ? 'Your Story' : 'Add Story'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    width: 70,
  },
  circleContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storyCircle: {
    backgroundColor: theme.colors.primary, // Your story gets the primary color
  },
  addCircle: {
    backgroundColor: theme.colors.lightGray,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    borderStyle: 'dashed',
  },
  initials: {
    color: theme.colors.secondary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  plusIcon: {
    color: theme.colors.gray,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    maxWidth: 70,
  },
});