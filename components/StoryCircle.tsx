import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Story } from '../services/stories';

interface StoryCircleProps {
  story: Story;
  onPress: (story: Story) => void;
}

export default function StoryCircle({ story, onPress }: StoryCircleProps) {
  // Get first 2 letters of username, uppercase
  const getInitials = (username: string): string => {
    return username.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on username
  const getCircleColor = (username: string): string => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
      '#54A0FF',
      '#5F27CD',
      '#00D2D3',
      '#FF9F43',
      '#A55EEA',
      '#26DE81',
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  const username = story.user_profile?.username || 'Unknown';
  const initials = getInitials(username);
  const circleColor = getCircleColor(username);

  const hasUnviewedStory = !story.is_viewed;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(story)} activeOpacity={0.7}>
      <View style={[styles.circleContainer, hasUnviewedStory && styles.unviewedBorder]}>
        <View style={[styles.circle, { backgroundColor: circleColor }]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {username}
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
  unviewedBorder: {
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'dotted',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  initials: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  username: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    maxWidth: 70,
  },
});
