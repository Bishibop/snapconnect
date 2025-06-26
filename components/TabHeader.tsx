import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import LoadingSpinner from './ui/LoadingSpinner';

interface TabHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  showLoading?: boolean;
}

export default function TabHeader({ title, rightElement, showLoading }: TabHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {showLoading && <LoadingSpinner size="small" style={styles.loadingSpinner} />}
      </View>
      {rightElement && rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  loadingSpinner: {
    marginLeft: theme.spacing.sm,
  },
});
