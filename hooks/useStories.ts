import { useStoriesContext } from '../contexts/StoriesContext';

/**
 * Hook to access stories data from the global StoriesContext
 * This replaces the previous implementation that created multiple subscriptions
 */
export function useStories() {
  return useStoriesContext();
}
