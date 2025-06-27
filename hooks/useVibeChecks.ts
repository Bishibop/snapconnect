import { useState, useEffect, useCallback } from 'react';
import {
  getInboxVibeChecks,
  getSentVibeChecks,
  markVibeCheckOpened,
  subscribeToInboxVibeCheckChanges,
  subscribeToSentVibeCheckChanges,
  VibeCheck,
} from '../services/vibeChecks';
import { useAuth } from '../contexts/AuthContext';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

interface UseVibeChecksOptions {
  type: 'inbox' | 'sent';
}

export function useVibeChecks({ type }: UseVibeChecksOptions) {
  const { user } = useAuth();
  const cacheKey = type === 'inbox' ? CACHE_KEYS.INBOX_VIBE_CHECKS : CACHE_KEYS.SENT_VIBE_CHECKS;

  // Initialize with cached data synchronously
  const [vibeChecks, setVibeChecks] = useState<VibeCheck[]>(() => {
    if (!user?.id) return [];
    return cache.get<VibeCheck[]>(cacheKey, user.id, CACHE_DURATIONS.VIBE_CHECKS) || [];
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);
  const { handleError, clearError } = createErrorState(setError, `${type} VibeChecks`);

  const loadVibeChecks = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        clearError();
        if (!silent) setRefreshing(true);

        const vibeChecksList =
          type === 'inbox' ? await getInboxVibeChecks() : await getSentVibeChecks();
        setVibeChecks(vibeChecksList);

        // Cache the new data
        cache.set(cacheKey, vibeChecksList, user.id);
      } catch (error) {
        ErrorHandler.handleApiError(error, `load ${type} vibe checks`, silent);
        if (!silent) {
          handleError(error, { context: `Loading ${type} vibe checks` });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [user?.id, type, cacheKey, handleError, clearError]
  );

  const refresh = useCallback(async () => {
    await loadVibeChecks(false); // Not silent for manual refresh
  }, [loadVibeChecks]);

  const markOpened = useCallback(
    async (vibeCheckId: string) => {
      if (type !== 'inbox' || !user?.id) return;

      try {
        await markVibeCheckOpened(vibeCheckId);

        // Atomically update both cache and state
        const updatedVibeChecks = cache.update<VibeCheck[]>(
          cacheKey,
          current => {
            const vibeChecks = current || [];
            return vibeChecks.map(vibeCheck =>
              vibeCheck.id === vibeCheckId
                ? { ...vibeCheck, opened_at: new Date().toISOString() }
                : vibeCheck
            );
          },
          user.id
        );

        setVibeChecks(updatedVibeChecks);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'mark vibe check as opened', true);
      }
    },
    [type, user?.id, cacheKey]
  );

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;

    // Check if we need fresh data
    const hasValidCache = cache.has(cacheKey, user.id, CACHE_DURATIONS.VIBE_CHECKS);
    if (!hasValidCache) {
      loadVibeChecks(true); // Silent background fetch
    }
  }, [user?.id, cacheKey, loadVibeChecks]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription =
      type === 'inbox'
        ? subscribeToInboxVibeCheckChanges(user.id, () => loadVibeChecks(true)) // Silent reload on real-time updates
        : subscribeToSentVibeCheckChanges(user.id, () => loadVibeChecks(true));

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, type, loadVibeChecks]);

  return {
    vibeChecks,
    refreshing,
    error,
    refresh,
    markOpened,
    reload: loadVibeChecks,
  };
}
