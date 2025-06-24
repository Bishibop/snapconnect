import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthErrorBoundary } from './components/common/AuthErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthErrorBoundary>
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </AuthErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
