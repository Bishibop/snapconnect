import React from 'react';
import { StyleSheet, Image, View, ViewStyle, ImageStyle } from 'react-native';
import { Filter } from '../types/filters';

interface FilteredImageProps {
  imageUri: string;
  filter: Filter;
  style?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export default function FilteredImage({
  imageUri,
  filter,
  style,
  resizeMode = 'contain',
}: FilteredImageProps) {
  if (filter.id === 'original') {
    // Original - no filter
    return (
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode={resizeMode} />
    );
  }

  // Apply filter using overlay technique
  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode={resizeMode} />
      {filter.id === 'bw' ? (
        // Black and white filter using multiple overlays
        <>
          <View style={[styles.overlay, { backgroundColor: '#000000', opacity: 0.3 }]} />
          <View style={[styles.overlay, { backgroundColor: '#808080', opacity: 0.4 }]} />
          <View style={[styles.overlay, { backgroundColor: '#ffffff', opacity: 0.2 }]} />
        </>
      ) : filter.tintColor ? (
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: filter.tintColor,
              opacity: filter.opacity || 0.3,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
