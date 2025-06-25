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
import { theme } from '../../constants/theme';
import { createStory } from '../../services/stories';
import { uploadMedia } from '../../services/media';
import { Filter, FILTERS } from '../../types/filters';
import FilteredImage from '../../components/FilteredImage';
import FilterSelector from '../../components/FilterSelector';

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
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>(FILTERS[0]); // Start with Original
  const [showFilters, setShowFilters] = useState(false);

  const handleRetake = () => {
    // Go back to camera screen
    navigation.goBack();
  };

  const handleSendSnap = () => {
    // Navigate to friend selector with media and filter
    navigation.navigate('FriendSelector', {
      mediaUri,
      mediaType,
      filter: selectedFilter,
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterSelect = (filter: Filter) => {
    setSelectedFilter(filter);
  };

  const handleAddToStory = async () => {
    setUploading(true);
    
    try {
      // First upload the media
      const uploadResult = await uploadMedia(mediaUri, mediaType);
      
      // Create the story with filter
      await createStory({
        mediaUrl: uploadResult.path,
        snapType: mediaType,
        filterType: selectedFilter.id,
      });
      
      Alert.alert(
        'Story Posted!',
        'Your story has been posted and is visible to all your friends.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('CameraScreen');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating story:', error);
      Alert.alert('Failed to Post', error.message || 'Failed to post story. Please try again.');
    } finally {
      setUploading(false);
    }
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
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
          disabled={uploading}
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={handleToggleFilters}
          disabled={uploading}
        >
          <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
            Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.storyButton, uploading && styles.buttonDisabled]}
          onPress={handleAddToStory}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.storyButtonText}>Story</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.useButton]}
          onPress={handleSendSnap}
          disabled={uploading}
        >
          <Text style={styles.useButtonText}>Snap</Text>
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
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 80,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  retakeButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: theme.colors.secondary,
  },
  storyButton: {
    backgroundColor: theme.colors.primary,
  },
  storyButtonText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  useButton: {
    backgroundColor: theme.colors.primary,
  },
  useButtonText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});