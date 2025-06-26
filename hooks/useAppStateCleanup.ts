import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { cache } from '../utils/cache';

/**
 * Hook to handle cache cleanup based on app state changes
 * Prevents memory leaks from global timers and ensures proper cleanup
 */
export function useAppStateCleanup() {
  const appState = useRef(AppState.currentState);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const prevState = appState.current;
      appState.current = nextAppState;

      if (nextAppState === 'active') {
        // App became active - start periodic cleanup
        startPeriodicCleanup();

        // Clean up stale data when app becomes active
        cache.cleanup();
      } else if (
        prevState === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App went to background - stop periodic cleanup to save battery
        stopPeriodicCleanup();

        // Final cleanup before backgrounding
        cache.cleanup();
      }
    };

    const startPeriodicCleanup = () => {
      // Clear any existing interval
      stopPeriodicCleanup();

      // Set up new cleanup interval (every 10 minutes when app is active)
      cleanupIntervalRef.current = setInterval(
        () => {
          cache.cleanup();
        },
        10 * 60 * 1000
      );
    };

    const stopPeriodicCleanup = () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start cleanup if app is currently active
    if (AppState.currentState === 'active') {
      startPeriodicCleanup();
    }

    // Cleanup on unmount
    return () => {
      subscription.remove();
      stopPeriodicCleanup();
    };
  }, []);

  // Manual cleanup function for components that need it
  const cleanupNow = () => {
    cache.cleanup();
  };

  return { cleanupNow };
}
