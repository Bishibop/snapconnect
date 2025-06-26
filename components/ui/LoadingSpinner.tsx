import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  centered?: boolean;
}

export default function LoadingSpinner({
  size = 'small',
  color = theme.colors.primary,
  style,
  centered = false,
}: LoadingSpinnerProps) {
  const containerStyle = centered ? [styles.centered, style] : style;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
