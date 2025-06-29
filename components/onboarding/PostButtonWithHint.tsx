import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../contexts/OnboardingContext';
import ActionButton from '../ui/ActionButton';

interface PostButtonWithHintProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}

export const PostButtonWithHint: React.FC<PostButtonWithHintProps> = ({ 
  onPress, 
  loading, 
  disabled 
}) => {
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
              toValue: 5,
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
      <ActionButton
        title="Post"
        onPress={onPress}
        variant="primary"
        loading={loading}
        disabled={disabled}
        style={styles.button}
      />
      
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
          <View style={styles.arrowContainer}>
            <View style={styles.arrow} />
          </View>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Share your VibeReel with{'\n'}friends and the community!
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
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
    marginBottom: -2,
    overflow: 'hidden',
    transform: [{ rotate: '180deg' }],
  },
  arrow: {
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
});