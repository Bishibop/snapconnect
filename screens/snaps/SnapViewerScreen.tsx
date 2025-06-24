import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { markSnapOpened, Snap } from '../../services/snaps';
import { supabase } from '../../lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SnapViewerProps {
  route: {
    params: {
      snap: Snap;
    };
  };
  navigation: any;
}

export default function SnapViewerScreen({ route, navigation }: SnapViewerProps) {
  const { snap } = route.params;
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for photos
  const [mediaUrl, setMediaUrl] = useState<string>('');

  useEffect(() => {
    // Mark snap as opened when viewer opens
    markSnapOpened(snap.id).catch(console.error);
    
    // Get the public URL for the media
    getMediaUrl();
    
    // Start countdown for photos
    if (snap.snap_type === 'photo') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-close after countdown
            navigation.goBack();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [snap.id, snap.snap_type, navigation]);

  const getMediaUrl = () => {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(snap.media_url);
    
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
      {snap.snap_type === 'photo' && timeLeft > 0 && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>
      )}

      {/* Sender info */}
      <View style={styles.senderInfo}>
        <Text style={styles.senderName}>{snap.sender_profile?.username}</Text>
        <Text style={styles.snapType}>sent a {snap.snap_type}</Text>
      </View>

      {/* Media content */}
      <TouchableOpacity 
        style={styles.mediaContainer}
        activeOpacity={1}
        onPress={handleTap}
      >
        {mediaUrl ? (
          <Image 
            source={{ uri: mediaUrl }} 
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