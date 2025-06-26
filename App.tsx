import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
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
            <AppContent />
          </AuthProvider>
        </AuthErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
