import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';

interface CameraTabWithHintProps {
  focused: boolean;
  showHint: boolean;
}

export const CameraTabWithHint: React.FC<CameraTabWithHintProps> = ({ focused, showHint }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showHint) {
      // Small delay before showing
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
      <Image
        source={require('../../assets/images/VibeReel.jpeg')}
        style={[styles.cameraIcon, focused && styles.cameraIconActive]}
        resizeMode="contain"
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
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Create your first VibeReel!</Text>
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
  cameraIcon: {
    width: 32,
    height: 32,
    opacity: 0.8,
  },
  cameraIconActive: {
    opacity: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 45,
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
