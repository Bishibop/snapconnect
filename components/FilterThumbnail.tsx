import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { theme } from '../constants/theme';
import { Filter } from '../types/filters';

interface FilterThumbnailProps {
  filter: Filter;
  imageUri: string;
  isSelected: boolean;
  onPress: (filter: Filter) => void;
}

export default function FilterThumbnail({
  filter,
  imageUri,
  isSelected,
  onPress,
}: FilterThumbnailProps) {
  const renderImage = () => {
    if (filter.id === 'original') {
      // Original - no filter
      return <Image source={{ uri: imageUri }} style={styles.thumbnailImage} resizeMode="cover" />;
    }

    // Apply filter using overlay technique
    return (
      <View style={styles.thumbnailImageContainer}>
        <Image source={{ uri: imageUri }} style={styles.thumbnailImage} resizeMode="cover" />
        {filter.id === 'bw' ? (
          // Black and white filter using multiple overlays
          <>
            <View style={[styles.thumbnailOverlay, { backgroundColor: '#000000', opacity: 0.3 }]} />
            <View style={[styles.thumbnailOverlay, { backgroundColor: '#808080', opacity: 0.4 }]} />
            <View style={[styles.thumbnailOverlay, { backgroundColor: '#ffffff', opacity: 0.2 }]} />
          </>
        ) : filter.tintColor ? (
          <View
            style={[
              styles.thumbnailOverlay,
              {
                backgroundColor: filter.tintColor,
                opacity: filter.opacity || 0.3,
              },
            ]}
          />
        ) : null}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPress(filter)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>{renderImage()}</View>
      <Text style={[styles.filterName, isSelected && styles.selectedFilterName]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailImageContainer: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterName: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedFilterName: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
