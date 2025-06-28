import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { VibeReelWithViewStatus } from '../services/vibeReels';
import VibeReelCircle from './VibeReelCircle';
import YourVibeReelCircle from './YourVibeReelCircle';
import { useVibeReels } from '../hooks/useVibeReels';
import { useAuth } from '../contexts/AuthContext';
import { useProfileUsername } from '../hooks/useProfileUsername';

/**
 * Props for the VibeReelsRow component that displays user and friend VibeReels
 */
interface VibeReelsRowProps {
  /** Callback when user wants to create a new VibeReel */
  onCreateVibeReel: () => void;
  /** Callback when user wants to view an existing VibeReel */
  onViewVibeReel: (vibeReel: VibeReelWithViewStatus) => void;
}

export default function VibeReelsRow({ onCreateVibeReel, onViewVibeReel }: VibeReelsRowProps) {
  const { friendVibeReels: vibeReels, myVibeReel: userVibeReel } = useVibeReels();
  const { user } = useAuth();

  // Use lightweight hook that just gets username without global state management
  const username = useProfileUsername(user?.id || '');

  // Always show VibeReels row for consistency
  if (vibeReels.length === 0 && !userVibeReel) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <YourVibeReelCircle
            userVibeReel={userVibeReel}
            username={username}
            onPress={onCreateVibeReel}
            onVibeReelPress={(vibeReel) => {
              // Convert VibeReel to VibeReelWithViewStatus for user's own reel
              const vibeReelWithStatus = {
                ...vibeReel,
                is_viewed: true // User's own VibeReel is always considered viewed
              } as VibeReelWithViewStatus;
              onViewVibeReel(vibeReelWithStatus);
            }}
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
        {/* Your VibeReel always comes first */}
        <YourVibeReelCircle
          userVibeReel={userVibeReel}
          username={username}
          onPress={onCreateVibeReel}
          onVibeReelPress={(vibeReel) => {
            // Convert VibeReel to VibeReelWithViewStatus for user's own reel
            const vibeReelWithStatus = {
              ...vibeReel,
              is_viewed: true // User's own VibeReel is always considered viewed
            } as VibeReelWithViewStatus;
            onViewVibeReel(vibeReelWithStatus);
          }}
        />

        {/* Friends' VibeReels */}
        {vibeReels.map(vibeReel => (
          <VibeReelCircle key={vibeReel.id} vibeReel={vibeReel} onPress={onViewVibeReel} />
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
