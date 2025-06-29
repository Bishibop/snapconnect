import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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

  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for photos
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Simple countdown timer for photos
  useEffect(() => {
    // Only start timer for photos when media is loaded
    if (!content || getContentType() !== 'photo' || !mediaUrl) {
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset to 30 seconds
    setTimeLeft(30);

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

      {/* Countdown timer for photos */}
      {getContentType() === 'photo' && timeLeft > 0 && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeLeft}</Text>
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
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
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
