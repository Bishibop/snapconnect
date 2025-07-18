import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0); // For progress bar
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [showCaption, setShowCaption] = useState(false);

  // Double buffer animation values - start with 0 for initial fade-in
  const fadeAnimA = useRef(new Animated.Value(0)).current;
  const fadeAnimB = useRef(new Animated.Value(0)).current;

  // Scale animations for zoom effect
  const scaleAnimA = useRef(new Animated.Value(1.0)).current;
  const scaleAnimB = useRef(new Animated.Value(1.0)).current;

  // Caption fade animation
  const captionFadeAnim = useRef(new Animated.Value(0)).current;

  // Refs for managing playback
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const captionTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const currentIndexRef = useRef(0);
  const allArtRef = useRef<ArtPiece[]>([]);
  const activeBuffer = useRef<'A' | 'B'>('A'); // Track which buffer is currently visible
  const aiCaptionRef = useRef<string | null>(null);

  // State for both buffers
  const [imageA, setImageA] = useState<ArtPiece | null>(null);
  const [imageB, setImageB] = useState<ArtPiece | null>(null);

  useEffect(() => {
    isMounted.current = true;
    loadVibeReel();
    return () => {
      isMounted.current = false;
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
      }
      if (captionTimer.current) {
        clearTimeout(captionTimer.current);
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
      setAiCaption(data.ai_caption || null);
      aiCaptionRef.current = data.ai_caption || null;

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
      allArtRef.current = artSequence; // Store in ref for immediate access

      // Auto-start playback after loading
      if (artSequence.length > 0) {
        // Initialize first image in buffer A
        setImageA(artSequence[0]);
        // Preload second image in buffer B if available
        if (artSequence.length > 1) {
          setImageB(artSequence[1]);
        }

        setIsPlaying(true);
        currentIndexRef.current = 0;
        setCurrentDisplayIndex(0);
        activeBuffer.current = 'A';

        // Start playback after a brief delay
        setTimeout(() => {
          startPlayback();
        }, 500);
      }
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error loading VibeReel' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startPlayback = () => {
    if (allArtRef.current.length === 0) return;

    setIsPlaying(true);

    // Simple fade in for first image
    Animated.timing(fadeAnimA, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Start the playback cycle after entrance
      scheduleNextTransition();
    });
  };

  const scheduleNextTransition = () => {
    if (!isMounted.current) return;

    const currentIdx = currentIndexRef.current;
    const isMainPhoto = currentIdx === allArtRef.current.length - 1;
    const displayDuration = isMainPhoto ? 10000 : 750; // 10s for main, 0.75s for others

    // Smooth zoom in during display
    const currentScale = activeBuffer.current === 'A' ? scaleAnimA : scaleAnimB;
    currentScale.setValue(1.0); // Start at normal size

    Animated.timing(currentScale, {
      toValue: 1.1, // Zoom in to 110%
      duration: displayDuration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Show caption on the final image
    if (isMainPhoto && aiCaptionRef.current) {
      // Wait 3 seconds, then fade in caption
      captionTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCaption(true);
        Animated.timing(captionFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 3000);
    }

    // Schedule transition after display duration
    playbackTimer.current = setTimeout(() => {
      if (!isMounted.current) return;
      transitionToNext();
    }, displayDuration);
  };

  const transitionToNext = () => {
    const nextIdx = currentIndexRef.current + 1;

    // Hide caption before transitioning
    if (showCaption) {
      setShowCaption(false);
      captionFadeAnim.setValue(0);
    }

    // Clear caption timer if it's running
    if (captionTimer.current) {
      clearTimeout(captionTimer.current);
      captionTimer.current = null;
    }

    if (nextIdx >= allArtRef.current.length) {
      // End of sequence
      stopPlayback();
      return;
    }

    // For single image, no transition needed
    if (allArtRef.current.length === 1) {
      stopPlayback();
      return;
    }

    const nextArt = allArtRef.current[nextIdx];
    const currentActive = activeBuffer.current;
    const nextActive = currentActive === 'A' ? 'B' : 'A';

    // Preload next image in the inactive buffer
    if (nextActive === 'A') {
      setImageA(nextArt);
    } else {
      setImageB(nextArt);
    }

    // Get animation refs for both buffers
    const fadeOut = currentActive === 'A' ? fadeAnimA : fadeAnimB;
    const fadeIn = currentActive === 'A' ? fadeAnimB : fadeAnimA;
    const scaleIn = currentActive === 'A' ? scaleAnimB : scaleAnimA;

    // Reset scale for incoming buffer before transition
    scaleIn.setValue(1.0);

    // Simple cross-fade between buffers
    Animated.parallel([
      // Fade out current
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 200, // Faster transition for snappier feel
        useNativeDriver: true,
      }),
      // Fade in next
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update state after animation completes
      currentIndexRef.current = nextIdx;
      setCurrentDisplayIndex(nextIdx); // Update display index for progress bar
      activeBuffer.current = nextActive;

      // Preload the next image if available
      const nextNextIdx = nextIdx + 1;
      if (nextNextIdx < allArtRef.current.length) {
        const nextNextArt = allArtRef.current[nextNextIdx];
        if (currentActive === 'A') {
          setImageA(nextNextArt);
        } else {
          setImageB(nextNextArt);
        }
      }

      // Continue playback
      scheduleNextTransition();
    });
  };

  const stopPlayback = () => {
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    if (captionTimer.current) {
      clearTimeout(captionTimer.current);
      captionTimer.current = null;
    }
    setIsPlaying(false);
    // Auto-close when playback completes
    navigation.goBack();
  };

  const handleClose = () => {
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    if (captionTimer.current) {
      clearTimeout(captionTimer.current);
      captionTimer.current = null;
    }
    setIsPlaying(false);
    navigation.goBack();
  };

  if (loading) {
    return <View style={styles.loadingContainer} />;
  }

  // Helper to render an image buffer
  const renderImageBuffer = (
    art: ArtPiece | null,
    fadeAnim: Animated.Value,
    scaleAnim: Animated.Value,
    _bufferName: string
  ) => {
    if (!art) return null;

    const imageUrl = getArtPieceUrl(art.image_url);

    return (
      <Animated.View
        style={[
          styles.imageContainer,
          styles.absoluteFill,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <Image source={{ uri: imageUrl }} style={styles.artImage} />
        <View style={styles.vignette} />
        <View style={styles.attribution}>
          <Text style={styles.username}>@{art.user?.username || 'unknown'}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.imageWrapper}>
        {renderImageBuffer(imageA, fadeAnimA, scaleAnimA, 'A')}
        {renderImageBuffer(imageB, fadeAnimB, scaleAnimB, 'B')}
      </View>

      {isPlaying && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentDisplayIndex + 1) / allArt.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {showCaption && aiCaption && (
        <Animated.View
          style={[styles.captionContainer, { opacity: captionFadeAnim }]}
          pointerEvents="none"
        >
          <View style={styles.captionBackground}>
            <Text style={styles.captionText}>{aiCaption}</Text>
          </View>
        </Animated.View>
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
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
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
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    // Radial gradient effect using shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    // Background gradient fallback
    backgroundColor: 'transparent',
    borderWidth: 40,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  captionBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    // Subtle blur effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 27,
    letterSpacing: 0.3,
  },
});
