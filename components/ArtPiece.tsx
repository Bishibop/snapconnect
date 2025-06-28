import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { getArtPieceUrl } from '../services/artSimilarity';
import { theme } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ArtPieceProps {
  artPiece: {
    id: string;
    image_url: string;
    vibe_count: number;
    user?: {
      username: string;
    };
  };
  size?: number;
  showVibeCount?: boolean;
  showUsername?: boolean;
  onPress?: () => void;
  selected?: boolean;
  selectionNumber?: number;
}

export default function ArtPiece({
  artPiece,
  size,
  showVibeCount = true,
  showUsername = false,
  onPress,
  selected = false,
  selectionNumber,
}: ArtPieceProps) {
  const imageUrl = getArtPieceUrl(artPiece.image_url);
  const itemSize = size || (screenWidth - 48) / 3;

  return (
    <TouchableOpacity
      style={[styles.container, { width: itemSize, height: itemSize }, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} />

      {selected && selectionNumber !== undefined && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionNumber}>{selectionNumber}</Text>
        </View>
      )}

      {(showVibeCount || showUsername) && (
        <View style={styles.overlay}>
          {showUsername && artPiece.user && (
            <Text style={styles.username} numberOfLines={1}>
              @{artPiece.user.username}
            </Text>
          )}
          {showVibeCount && (
            <View style={styles.vibeContainer}>
              <Text style={styles.vibeCount}>{artPiece.vibe_count}</Text>
              <Text style={styles.vibeLabel}>vibes</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.lightGray,
    marginBottom: 8,
  },
  selected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
  },
  username: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  vibeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  vibeCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  vibeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
});
