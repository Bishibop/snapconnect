import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Filter, FILTERS } from '../types/filters';
import FilterThumbnail from './FilterThumbnail';

interface FilterSelectorProps {
  imageUri: string;
  selectedFilter: Filter;
  onFilterSelect: (filter: Filter) => void;
}

export default function FilterSelector({
  imageUri,
  selectedFilter,
  onFilterSelect,
}: FilterSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map(filter => (
          <FilterThumbnail
            key={filter.id}
            filter={filter}
            imageUri={imageUri}
            isSelected={selectedFilter.id === filter.id}
            onPress={onFilterSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.sm,
  },
});
