import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import ActionButton from '../../components/ui/ActionButton';
import { postVibeReel } from '../../services/vibeReels';
import { ErrorHandler } from '../../utils/errorHandler';
import { useVibeReelsContext } from '../../contexts/VibeReelsContext';

export default function VibeReelPreview() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vibeReelId } = route.params || {};
  const { reload } = useVibeReelsContext();

  const [posting, setPosting] = useState(false);

  const handlePreview = () => {
    // Navigate to VibeReelPlayer for private viewing
    navigation.navigate('VibeReelPlayer', { vibeReelId });
  };

  const handlePost = async () => {
    if (!vibeReelId) {
      Alert.alert('Error', 'VibeReel ID not found');
      return;
    }

    try {
      setPosting(true);
      await postVibeReel(vibeReelId);

      // Removed manual reload - realtime should handle this now
      // setTimeout(() => {
      //   reload(true); // Silent reload
      // }, 500);

      // Navigate back to camera after successful post
      navigation.navigate('Camera', { screen: 'CameraScreen' });
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error posting VibeReel' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your VibeReel is ready!</Text>

        <View style={styles.buttonContainer}>
          <ActionButton
            title="Preview"
            onPress={handlePreview}
            variant="secondary"
            disabled={posting}
            style={styles.button}
          />

          <ActionButton
            title="Post to Friends"
            onPress={handlePost}
            variant="primary"
            loading={posting}
            disabled={posting}
            style={styles.button}
          />
        </View>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
});
