import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { VibeReelsProvider } from './contexts/VibeReelsContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthErrorBoundary } from './components/common/AuthErrorBoundary';
import { useAppStateCleanup } from './hooks/useAppStateCleanup';
import { useFriendSync } from './hooks/useFriendSync';

function AppContent() {
  // Initialize app-level cache cleanup
  useAppStateCleanup();

  // Sync friend IDs to vibe reels context for client-side filtering
  useFriendSync();

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthErrorBoundary>
          <AuthProvider>
            <OnboardingProvider>
              <RealtimeProvider>
                <VibeReelsProvider>
                  <FriendsProvider>
                    <AppContent />
                  </FriendsProvider>
                </VibeReelsProvider>
              </RealtimeProvider>
            </OnboardingProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
