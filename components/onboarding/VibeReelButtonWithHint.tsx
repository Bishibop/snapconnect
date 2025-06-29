import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface VibeReelButtonWithHintProps {
  onPress: () => void;
}

export const VibeReelButtonWithHint: React.FC<VibeReelButtonWithHintProps> = ({ onPress }) => {
  const { state } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Show hint if user has tapped camera but hasn't created their first VibeReel
  const showHint = state.hasTappedCamera && !state.hasCreatedFirstVibeReel;

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
      <TouchableOpacity
        style={[styles.iconButton, styles.vibeReelButton]}
        onPress={onPress}
      >
        <Image
          source={require('../../assets/images/VibeReel.jpeg')}
          style={styles.vibeReelIcon}
          resizeMode="contain"
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
            <Text style={styles.tooltipText}>Now, find art that{'\n'}you vibe with!</Text>
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
  iconButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vibeReelButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  vibeReelIcon: {
    width: 60,
    height: 60,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 95,
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
    minWidth: 180,
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