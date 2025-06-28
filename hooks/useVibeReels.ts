import { useVibeReelsContext } from '../contexts/VibeReelsContext';

/**
 * Hook to access VibeReels data from the global VibeReelsContext
 * This replaces the previous implementation that created multiple subscriptions
 */
export function useVibeReels() {
  return useVibeReelsContext();
}
