import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { markSnapOpened, Snap } from '../../services/snaps';
import { Story, markStoryViewed } from '../../services/stories';
import { supabase } from '../../lib/supabase';
import { FILTERS } from '../../types/filters';
import FilteredImage from '../../components/FilteredImage';
import { InboxStackParamList, SentStackParamList, FriendsStackParamList } from '../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SnapViewerNavigationProp = CompositeNavigationProp<
  StackNavigationProp<InboxStackParamList, 'SnapViewer'>,
  CompositeNavigationProp<
    StackNavigationProp<SentStackParamList, 'SnapViewer'>,
    StackNavigationProp<FriendsStackParamList, 'SnapViewer'>
  >
>;

type SnapViewerRouteProp =
  | RouteProp<InboxStackParamList, 'SnapViewer'>
  | RouteProp<SentStackParamList, 'SnapViewer'>
  | RouteProp<FriendsStackParamList, 'SnapViewer'>;

interface SnapViewerProps {
  route: SnapViewerRouteProp;
  navigation: SnapViewerNavigationProp;
}

export default function SnapViewerScreen({ route, navigation }: SnapViewerProps) {
  const { snap, story } = route.params;
  const content = snap || story; // Use snap if available, otherwise story
  const isStory = !!story;

  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for photos
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!content) return;

    // Mark snap as opened when viewer opens (only for snaps, not stories)
    if (snap) {
      markSnapOpened(snap.id).catch(console.error);
    }

    // Mark story as viewed when viewer opens (only for stories, not snaps)
    if (story && !story.is_viewed) {
      markStoryViewed(story.id).catch(_error => {
        // Silently fail if already viewed or other non-critical error
      });
    }

    // Get the public URL for the media
    getMediaUrl();
  }, [content?.id]);

  // Simple countdown timer for photos
  useEffect(() => {
    // Only start timer for photos when media is loaded
    if (!content || content.snap_type !== 'photo' || !mediaUrl) {
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset to 5 seconds
    setTimeLeft(5);

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
  }, [content?.snap_type, mediaUrl]);

  // Handle auto-close when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && content?.snap_type === 'photo') {
      navigation.goBack();
    }
  }, [timeLeft, content?.snap_type, navigation]);

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
      {content?.snap_type === 'photo' && timeLeft > 0 && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>
      )}

      {/* Sender info */}
      <View style={styles.senderInfo}>
        <Text style={styles.senderName}>
          {isStory
            ? (story as Story)?.user_profile?.username
            : (snap as Snap)?.sender_profile?.username}
        </Text>
        <Text style={styles.snapType}>
          {isStory ? `posted a ${content?.snap_type} story` : `sent a ${content?.snap_type}`}
        </Text>
      </View>

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
  senderInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  senderName: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  snapType: {
    color: theme.colors.white,
    fontSize: 14,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
