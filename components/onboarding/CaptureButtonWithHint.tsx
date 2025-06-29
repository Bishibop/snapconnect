import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface CaptureButtonWithHintProps {
  onPress: () => void;
  disabled: boolean;
  isCameraReady: boolean;
}

export const CaptureButtonWithHint: React.FC<CaptureButtonWithHintProps> = ({ 
  onPress, 
  disabled, 
  isCameraReady 
}) => {
  const { state } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Show hint if user has tapped camera but hasn't created their first VibeReel
  const showHint = state.hasTappedCamera && !state.hasCreatedFirstVibeReel;

  useEffect(() => {
    if (showHint && isCameraReady) {
      // Small delay to ensure camera is ready
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
  }, [showHint, isCameraReady, fadeAnim, bounceAnim]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <View
          style={[
            styles.captureButtonInner,
            !isCameraReady && styles.captureButtonInnerDisabled,
          ]}
        />
      </TouchableOpacity>
      
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
            <Text style={styles.tooltipText}>Take a flattering photo of your art!</Text>
          </View>
          <View style={styles.arrowContainer}>
            <View style={styles.arrow} />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.white,
  },
  captureButtonInnerDisabled: {
    backgroundColor: theme.colors.gray,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 85,
    alignItems: 'center',
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
    minWidth: 280,
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