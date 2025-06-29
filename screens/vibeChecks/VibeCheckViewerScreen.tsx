import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { markVibeCheckOpened, VibeCheck } from '../../services/vibeChecks';
import { supabase } from '../../lib/supabase';
import { FILTERS } from '../../types/filters';
import FilteredImage from '../../components/FilteredImage';
import { InboxStackParamList, SentStackParamList, FriendsStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type VibeCheckViewerNavigationProp = CompositeNavigationProp<
  StackNavigationProp<InboxStackParamList, 'VibeCheckViewer'>,
  CompositeNavigationProp<
    StackNavigationProp<SentStackParamList, 'VibeCheckViewer'>,
    StackNavigationProp<FriendsStackParamList, 'VibeCheckViewer'>
  >
>;

type VibeCheckViewerRouteProp =
  | RouteProp<InboxStackParamList, 'VibeCheckViewer'>
  | RouteProp<SentStackParamList, 'VibeCheckViewer'>
  | RouteProp<FriendsStackParamList, 'VibeCheckViewer'>;

interface VibeCheckViewerProps {
  route: VibeCheckViewerRouteProp;
  navigation: VibeCheckViewerNavigationProp;
}

export default function VibeCheckViewerScreen({ route, navigation }: VibeCheckViewerProps) {
  const { vibeCheck } = route.params;
  const content = vibeCheck as VibeCheck;
  const { user } = useAuth();

  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds for photos
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current; // Start at 100%

  // Helper function to get the content type
  const getContentType = (): 'photo' | 'video' | undefined => {
    if (!content) return undefined;
    return content.vibe_check_type;
  };

  useEffect(() => {
    if (!content || !user) return;

    // Mark VibeCheck as opened when viewer opens (only if recipient is viewing)
    if (content && content.recipient_id === user.id) {
      markVibeCheckOpened(content.id).catch(console.error);
    }

    // Get the public URL for the media
    getMediaUrl();
  }, [content?.id, user?.id]);

  // Simple countdown timer for photos with progress bar animation
  useEffect(() => {
    // Only start timer for photos when media is loaded
    if (!content || getContentType() !== 'photo' || !mediaUrl) {
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset to 10 seconds
    setTimeLeft(10);
    progressAnim.setValue(1); // Reset progress to 100%

    // Animate progress bar over 10 seconds
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 10000, // 10 seconds
      useNativeDriver: false,
    }).start();

    // Start simple 1-second interval countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          // Timer finished
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      progressAnim.stopAnimation();
    };
  }, [getContentType(), mediaUrl]);

  // Handle auto-close when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && getContentType() === 'photo') {
      navigation.goBack();
    }
  }, [timeLeft, getContentType(), navigation]);

  const getMediaUrl = () => {
    if (!content) return;

    const { data } = supabase.storage.from('media').getPublicUrl(content.media_url);
    setMediaUrl(data.publicUrl);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleTap = () => {
    // For photos, tapping doesn't do anything (countdown continues)
    // For videos, we could pause/play but keeping it simple for now
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Progress bar for photos */}
      {getContentType() === 'photo' && timeLeft > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Media content */}
      <TouchableOpacity style={styles.mediaContainer} activeOpacity={1} onPress={handleTap}>
        {mediaUrl ? (
          <FilteredImage
            imageUri={mediaUrl}
            filter={FILTERS.find(f => f.id === content?.filter_type) || FILTERS[0]}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderText}>Loading...</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary, // Black background like Snapchat
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
  closeButtonText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '300',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
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
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  mediaPlaceholder: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderText: {
    color: theme.colors.white,
    fontSize: 18,
  },
});
