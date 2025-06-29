import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import ActionButton from '../../components/ui/ActionButton';
import { postVibeReel } from '../../services/vibeReels';
import { ErrorHandler } from '../../utils/errorHandler';
import { useVibeReelsContext } from '../../contexts/VibeReelsContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { PostButtonWithHint } from '../../components/onboarding/PostButtonWithHint';
import { TouchableOpacity } from 'react-native';

export default function VibeReelPreview() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vibeReelId } = route.params || {};
  const { reload } = useVibeReelsContext();
  const { state: onboardingState, completeFirstVibeReel } = useOnboarding();

  const [posting, setPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handlePreview = () => {
    // Navigate to VibeReelPlayer for private viewing
    navigation.navigate('VibeReelPlayer', { vibeReelId });
  };

  const handleKeepVibing = () => {
    navigation.navigate('VibeReels', { screen: 'VibeReelsList' });
  };

  const handlePost = async () => {
    if (!vibeReelId) {
      Alert.alert('Error', 'VibeReel ID not found');
      return;
    }

    try {
      setPosting(true);
      await postVibeReel(vibeReelId);

      // Check if this is the user's first VibeReel
      if (!onboardingState.hasCreatedFirstVibeReel) {
        completeFirstVibeReel();
        setShowSuccess(true);
        setShowTooltips(true);

        // Show success animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Don't auto-navigate, wait for user to tap button
      } else {
        // Navigate to VibeReels feed after successful post
        navigation.navigate('VibeReels', { screen: 'VibeReelsList' });
      }
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error posting VibeReel' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>You posted your first VibeReel!</Text>

          {showTooltips && (
            <View style={styles.tooltipsContainer}>
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>Others can now Vibe your art.</Text>
              </View>
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>View your profile to see how many times your art has been Vibed.</Text>
              </View>
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>Add friends to share private VibeCheck messages.</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.keepVibingButton} onPress={handleKeepVibing}>
            <Text style={styles.keepVibingText}>Keep Vibing!</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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

          <PostButtonWithHint
            onPress={handlePost}
            loading={posting}
            disabled={posting}
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  tooltipsContainer: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  tooltip: {
    backgroundColor: theme.colors.lightGray,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  tooltipText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  keepVibingButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  keepVibingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
