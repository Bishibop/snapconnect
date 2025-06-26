import React from 'react';
import { FlatList, StyleSheet, ViewStyle } from 'react-native';

interface SimpleListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  horizontal?: boolean;
  numColumns?: number;
  ItemSeparatorComponent?: React.ComponentType | null;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
}

export default function SimpleList<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  horizontal = false,
  numColumns,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
}: SimpleListProps<T>) {

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[styles.list, style]}
      contentContainerStyle={[data.length === 0 && styles.emptyContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      horizontal={horizontal}
      numColumns={numColumns}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
});
