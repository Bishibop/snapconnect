import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { theme } from '../../constants/theme';
import { VALIDATION_LIMITS, VALIDATION_MESSAGES } from '../../constants/validation';

export default function EditProfile() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, updateBio } = useProfile(user?.id || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);

  // Update bio state when profile data changes
  React.useEffect(() => {
    if (profile?.bio !== undefined) {
      setBio(profile.bio || '');
    }
  }, [profile?.bio]);

  const handleSave = async () => {
    if (bio.length > VALIDATION_LIMITS.BIO_MAX_LENGTH) {
      Alert.alert('Bio too long', VALIDATION_MESSAGES.BIO_TOO_LONG);
      return;
    }

    setLoading(true);
    try {
      await updateBio(bio);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update bio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.username}>{profile?.username}</Text>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.charCount}>
                {bio.length}/{VALIDATION_LIMITS.BIO_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself and your art..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={VALIDATION_LIMITS.BIO_MAX_LENGTH}
              textAlignVertical="top"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  saveText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  saveTextDisabled: {
    color: theme.colors.textSecondary,
  },
  form: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  field: {
    marginBottom: theme.spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  charCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  username: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  bioInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
