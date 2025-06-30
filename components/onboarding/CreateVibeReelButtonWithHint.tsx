import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../contexts/OnboardingContext';
import ActionButton from '../ui/ActionButton';

interface CreateVibeReelButtonWithHintProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  title: string;
  hasSimilarArt: boolean;
}

export const CreateVibeReelButtonWithHint: React.FC<CreateVibeReelButtonWithHintProps> = ({
  onPress,
  disabled,
  loading,
  title,
  hasSimilarArt,
}) => {
  const { state } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Show hint if user has tapped camera but hasn't created their first VibeReel AND there is similar art
  const showHint = state.hasTappedCamera && !state.hasCreatedFirstVibeReel && hasSimilarArt;

  useEffect(() => {
    if (showHint) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Bounce animation
        const bounceAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -5,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );

        bounceAnimation.start();

        return () => {
          bounceAnimation.stop();
        };
      }, 200);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showHint, fadeAnim, bounceAnim]);

  return (
    <View style={styles.container}>
      {showHint && (
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: bounceAnim }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              We've found art similar to yours.{'\n'}Choose some you vibe with!
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <View style={styles.arrow} />
          </View>
        </Animated.View>
      )}

      <ActionButton title={title} onPress={onPress} disabled={disabled} loading={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 280,
    alignItems: 'center',
  },
  tooltipText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  arrowContainer: {
    width: 20,
    height: 12,
    alignItems: 'center',
    marginTop: -2,
    overflow: 'hidden',
  },
  arrow: {
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
