import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { Filter, FILTERS } from '../../types/filters';
import FilteredImage from '../../components/FilteredImage';
import FilterSelector from '../../components/FilterSelector';
import Icon from '../../components/ui/Icon';
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
          style={[styles.iconButton, styles.sendButton]}
          onPress={handleSend}
        >
          <Icon name="COMMENT" size={48} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, styles.vibeReelButton]}
          onPress={handleCreateVibeReel}
        >
          <Image
            source={require('../../assets/images/VibeReel.jpeg')}
            style={styles.vibeReelIcon}
            resizeMode="contain"
          />
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
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  iconButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.white,
  },
  vibeReelButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  vibeReelIcon: {
    width: 60,
    height: 60,
  },
});
