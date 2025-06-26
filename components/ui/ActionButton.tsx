import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../constants/theme';
import LoadingSpinner from './LoadingSpinner';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function ActionButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  fullWidth = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button];

    // Add size-specific styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
      default:
        baseStyle.push(styles.mediumButton);
    }

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (isDisabled) baseStyle.push(styles.disabled);

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        if (isDisabled) baseStyle.push(styles.secondaryDisabled);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        if (isDisabled) baseStyle.push(styles.dangerDisabled);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
      default:
        baseStyle.push(styles.primaryButton);
        if (isDisabled) baseStyle.push(styles.primaryDisabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.buttonText];

    // Add size-specific text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText);
        break;
      case 'large':
        baseStyle.push(styles.largeText);
        break;
      default:
        baseStyle.push(styles.mediumText);
    }

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'danger':
        baseStyle.push(styles.dangerText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    return baseStyle;
  };

  const getSpinnerColor = () => {
    switch (variant) {
      case 'secondary':
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <LoadingSpinner size="small" color={getSpinnerColor()} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },

  // Primary variant
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryDisabled: {
    backgroundColor: theme.colors.gray,
  },
  primaryText: {
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },

  // Secondary variant
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
  secondaryText: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  // Danger variant
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  dangerDisabled: {
    backgroundColor: theme.colors.gray,
  },
  dangerText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },

  // Ghost variant
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Sizes
  smallButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48,
  },
  largeButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },

  // Text sizes
  buttonText: {
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
