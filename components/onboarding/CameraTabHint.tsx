import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;

interface CameraTabHintProps {
  onDismiss: () => void;
}

export const CameraTabHint: React.FC<CameraTabHintProps> = ({ onDismiss }) => {
  const insets = useSafeAreaInsets();
  const { markCameraTapped } = useOnboarding();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    bounceAnimation.start();
    pulseAnimation.start();

    return () => {
      bounceAnimation.stop();
      pulseAnimation.stop();
    };
  }, [fadeAnim, bounceAnim, pulseAnim]);

  const handleDismiss = () => {
    markCameraTapped();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const tabBarBottom = insets.bottom;
  // Camera is the 4th tab out of 5, so position at 70% of width
  const cameraTabPosition = width * 0.7;
  const arrowBottom = tabBarBottom + TAB_BAR_HEIGHT + 20;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.dismissArea} onPress={handleDismiss} activeOpacity={1}>
        <View style={styles.content}>
          <View style={[styles.tooltip, { bottom: arrowBottom + 50 }]}>
            <Text style={styles.tooltipText}>Tap here to create your first VibeReel!</Text>
          </View>

          <Animated.View
            style={[
              styles.arrow,
              {
                bottom: arrowBottom,
                left: cameraTabPosition - 15,
                transform: [{ translateY: bounceAnim }],
              },
            ]}
          >
            <View style={styles.arrowShape} />
          </Animated.View>

          <Animated.View
            style={[
              styles.pulse,
              {
                bottom: tabBarBottom + 24,
                left: cameraTabPosition - 40,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: width * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  arrow: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowShape: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 20,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
  },
});
