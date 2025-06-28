import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getVibeReelWithArt } from '../../services/vibeReels';
import { getArtPieceUrl } from '../../services/artSimilarity';
import { theme } from '../../constants/theme';
import { ErrorHandler } from '../../utils/errorHandler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ArtPiece {
  id: string;
  image_url: string;
  user?: {
    username: string;
  };
  vibe_count: number;
}

export default function VibeReelPlayer() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vibeReelId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [_vibeReel, setVibeReel] = useState<any>(null);
  const [allArt, setAllArt] = useState<ArtPiece[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadVibeReel();
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  const loadVibeReel = async () => {
    try {
      setLoading(true);
      const data = await getVibeReelWithArt(vibeReelId);

      if (!data) {
        ErrorHandler.handle(new Error('VibeReel not found'), { context: 'VibeReel not found' });
        navigation.goBack();
        return;
      }

      setVibeReel(data);

      // Combine selected art with the primary art at the end
      const artSequence = [
        ...data.selected_art,
        {
          id: data.primary_art_id,
          image_url: data.primary_art?.image_url || '',
          user: { username: data.creator?.username || 'unknown' },
          vibe_count: data.primary_art?.vibe_count || 0,
        },
      ];

      setAllArt(artSequence);
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error loading VibeReel' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startPlayback = () => {
    if (allArt.length === 0) return;

    setIsPlaying(true);
    setCurrentIndex(0);

    // Start the animation cycle
    playbackTimer.current = setInterval(() => {
      animateTransition();
    }, 800); // 800ms per image
  };

  const animateTransition = () => {
    // Fade out and scale down
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next image
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;

        // Check if we've reached the end
        if (nextIndex >= allArt.length) {
          stopPlayback();
          return prev;
        }

        return nextIndex;
      });

      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const stopPlayback = () => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
  };

  const handleClose = () => {
    stopPlayback();
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentArt = allArt[currentIndex];
  const imageUrl = currentArt ? getArtPieceUrl(currentArt.image_url) : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {imageUrl && (
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image source={{ uri: imageUrl }} style={styles.artImage} />

          <View style={styles.attribution}>
            <Text style={styles.username}>@{currentArt.user?.username || 'unknown'}</Text>
            <Text style={styles.vibeCount}>{currentArt.vibe_count} vibes</Text>
          </View>
        </Animated.View>
      )}

      {!isPlaying && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playButton} onPress={startPlayback}>
            <Text style={styles.playButtonText}>Play VibeReel</Text>
          </TouchableOpacity>

          <Text style={styles.artCount}>
            {currentIndex + 1} / {allArt.length} pieces
          </Text>
        </View>
      )}

      {isPlaying && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentIndex + 1) / allArt.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artImage: {
    width: screenWidth - 40,
    height: screenHeight * 0.6,
    resizeMode: 'contain',
    borderRadius: 12,
  },
  attribution: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  username: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  vibeCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  artCount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});
