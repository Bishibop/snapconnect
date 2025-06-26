import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { theme } from '../../constants/theme';

interface FormInputProps extends TextInputProps {
  style?: ViewStyle;
  variant?: 'default' | 'search';
}

export default function FormInput({
  style,
  variant = 'default',
  placeholderTextColor = theme.colors.textSecondary,
  ...props
}: FormInputProps) {
  const inputStyle = variant === 'search' ? styles.searchInput : styles.input;

  return (
    <TextInput style={[inputStyle, style]} placeholderTextColor={placeholderTextColor} {...props} />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  searchInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 0,
  },
});
