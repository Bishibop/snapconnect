import React from 'react';
import { FlatList, RefreshControl, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface RefreshableListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  refreshing?: boolean;
  onRefresh?: () => void;
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

export default function RefreshableList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing = false,
  onRefresh,
  ListEmptyComponent,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  horizontal = false,
  numColumns,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
}: RefreshableListProps<T>) {
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
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
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
