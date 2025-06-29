import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { theme } from '../../constants/theme';

interface AuthFormProps {
  title?: string;
  titleImage?: ImageSourcePropType;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function AuthForm({ title, titleImage, children, style }: AuthFormProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, style]}
    >
      <View style={styles.content}>
        {titleImage ? (
          <Image source={titleImage} style={styles.titleImage} resizeMode="contain" />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
        <View style={styles.form}>{children}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  form: {
    gap: theme.spacing.md,
  },
  titleImage: {
    width: 400,
    height: 240,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
});
