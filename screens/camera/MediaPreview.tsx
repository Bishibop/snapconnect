import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { uploadMedia } from '../../services/media';
import { Filter, FILTERS } from '../../types/filters';
import FilteredImage from '../../components/FilteredImage';
import FilterSelector from '../../components/FilterSelector';
import { CameraStackParamList } from '../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type MediaPreviewScreenNavigationProp = StackNavigationProp<CameraStackParamList, 'MediaPreview'>;
type MediaPreviewScreenRouteProp = RouteProp<CameraStackParamList, 'MediaPreview'>;

interface MediaPreviewProps {
  route: MediaPreviewScreenRouteProp;
  navigation: MediaPreviewScreenNavigationProp;
}

export default function MediaPreview({ route, navigation }: MediaPreviewProps) {
  const { mediaUri, mediaType } = route.params;
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>(FILTERS[0]); // Start with Original
  const [showFilters, setShowFilters] = useState(false);

  const handleSend = () => {
    // Navigate to friend selector with media and filter
    navigation.navigate('FriendSelector', {
      mediaUri,
      mediaType,
      filter: selectedFilter,
    });
  };

  const handleCreateVibeReel = () => {
    // Navigate to VibeReel creation with the captured image
    navigation.navigate('CreateVibeReel', {
      imageUri: mediaUri,
      imageFile: mediaUri, // We'll need to convert this to a File object in the component
    });
  };

  const handleFilterSelect = (filter: Filter) => {
    setSelectedFilter(filter);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Media Display */}
      <View style={styles.mediaContainer}>
        <FilteredImage
          imageUri={mediaUri}
          filter={selectedFilter}
          style={styles.media}
          resizeMode="contain"
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={handleSend}
          disabled={uploading}
        >
          <Text style={styles.sendButtonText}>VibeCheck</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.vibeReelButton]}
          onPress={handleCreateVibeReel}
          disabled={uploading}
        >
          <Text style={styles.vibeReelButtonText}>VibeReel</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Selector */}
      {showFilters && (
        <FilterSelector
          imageUri={mediaUri}
          selectedFilter={selectedFilter}
          onFilterSelect={handleFilterSelect}
        />
      )}
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
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  sendButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  vibeReelButton: {
    backgroundColor: '#FF6B35', // Orange accent color for VibeReel
  },
  vibeReelButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
