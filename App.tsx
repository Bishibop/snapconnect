import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { VibeReelsProvider } from './contexts/VibeReelsContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthErrorBoundary } from './components/common/AuthErrorBoundary';
import { useAppStateCleanup } from './hooks/useAppStateCleanup';

function AppContent() {
  // Initialize app-level cache cleanup
  useAppStateCleanup();

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
            <RealtimeProvider>
              <VibeReelsProvider>
                <FriendsProvider>
                  <AppContent />
                </FriendsProvider>
              </VibeReelsProvider>
            </RealtimeProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
