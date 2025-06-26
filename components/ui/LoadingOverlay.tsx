import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import LoadingSpinner from './LoadingSpinner';
import { theme } from '../../constants/theme';

interface LoadingOverlayProps {
  text?: string;
  style?: ViewStyle;
  transparent?: boolean;
}

export default function LoadingOverlay({ text, style, transparent = false }: LoadingOverlayProps) {
  return (
    <View style={[styles.container, transparent && styles.transparent, style]}>
      <View style={styles.content}>
        <LoadingSpinner size="large" />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    zIndex: 1000,
  },
  transparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
