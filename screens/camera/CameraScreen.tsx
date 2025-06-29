import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import ActionButton from '../../components/ui/ActionButton';
import { useNavigationHelpers, CameraNavigation } from '../../utils/navigation';
import { CaptureButtonWithHint } from '../../components/onboarding/CaptureButtonWithHint';

interface CameraScreenProps {
  navigation: CameraNavigation;
}

export default function CameraScreen({ navigation }: CameraScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraKey, setCameraKey] = useState(0); // Force re-render camera
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navHelpers = useNavigationHelpers(navigation);

  // Reset camera when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset camera state when screen is focused
      setIsCameraReady(false);
      setCameraKey(prev => prev + 1);

      // Small delay to ensure camera reinitializes properly
      const timer = setTimeout(() => {
        setIsCameraReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          SnapConnect needs access to your camera to take photos
        </Text>
        <ActionButton
          title="Grant Permission"
          onPress={requestPermission}
          variant="primary"
          size="large"
        />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (photo?.uri) {
        navHelpers.navigateToMediaPreview(photo.uri, 'photo');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraKey} // Force re-render when key changes
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          ratio="16:9"
        />

        {/* Top Controls Overlay */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.navigate('Friends' as any)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls Overlay */}
        <View style={styles.bottomControls}>
          <CaptureButtonWithHint
            onPress={takePicture}
            disabled={!isCameraReady}
            isCameraReady={isCameraReady}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  topControls: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '300',
  },
  bottomControls: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
