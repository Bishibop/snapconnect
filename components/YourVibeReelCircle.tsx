import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../constants/theme';
import { VibeReel, VibeReelWithViewStatus } from '../services/vibeReels';
import { getArtPieceUrl } from '../services/artSimilarity';

interface YourVibeReelCircleProps {
  userVibeReel: VibeReel | null;
  username: string;
  onPress: () => void;
  onVibeReelPress?: (vibeReel: VibeReel | VibeReelWithViewStatus) => void;
}

export default function YourVibeReelCircle({
  userVibeReel,
  username,
  onPress,
  onVibeReelPress,
}: YourVibeReelCircleProps) {
  // Get first 2 letters of username, uppercase
  const getInitials = (username: string): string => {
    return username.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(username);
  const hasVibeReel = userVibeReel !== null;
  const thumbnailUrl = userVibeReel?.primary_art?.image_url
    ? getArtPieceUrl(userVibeReel.primary_art.image_url)
    : null;

  const handlePress = () => {
    if (hasVibeReel && userVibeReel && onVibeReelPress) {
      onVibeReelPress(userVibeReel);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.circleContainer}>
        {hasVibeReel ? (
          thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.circle, styles.vibeReelCircle]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )
        ) : (
          <View style={[styles.circle, styles.addCircle]}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {hasVibeReel ? 'Your VibeReel' : 'Add VibeReel'}
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
  vibeReelCircle: {
    backgroundColor: theme.colors.primary, // Your VibeReel gets the primary color
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.lightGray,
  },
});
