import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaPreviewProps {
  route: {
    params: {
      mediaUri: string;
      mediaType: 'photo' | 'video';
    };
  };
  navigation: any;
}

export default function MediaPreview({ route, navigation }: MediaPreviewProps) {
  const { mediaUri, mediaType } = route.params;

  const handleRetake = () => {
    // Go back to camera screen
    navigation.goBack();
  };

  const handleSendSnap = () => {
    // Navigate to friend selector with media
    navigation.navigate('FriendSelector', {
      mediaUri,
      mediaType,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Media Display */}
      <View style={styles.mediaContainer}>
        <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="contain" />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.useButton]}
          onPress={handleSendSnap}
        >
          <Text style={styles.useButtonText}>Send Snap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  retakeButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  useButton: {
    backgroundColor: theme.colors.primary,
  },
  useButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});