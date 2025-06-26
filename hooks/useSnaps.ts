import { useState, useEffect, useCallback } from 'react';
import {
  getInboxSnaps,
  getSentSnaps,
  markSnapOpened,
  subscribeToInboxChanges,
  subscribeToSentSnapsChanges,
  Snap,
} from '../services/snaps';
import { useAuth } from '../contexts/AuthContext';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';
import { ErrorHandler, StandardError, createErrorState } from '../utils/errorHandler';

interface UseSnapsOptions {
  type: 'inbox' | 'sent';
}

export function useSnaps({ type }: UseSnapsOptions) {
  const { user } = useAuth();
  const cacheKey = type === 'inbox' ? CACHE_KEYS.INBOX_SNAPS : CACHE_KEYS.SENT_SNAPS;

  // Initialize with cached data synchronously
  const [snaps, setSnaps] = useState<Snap[]>(() => {
    if (!user?.id) return [];
    return cache.get<Snap[]>(cacheKey, user.id, CACHE_DURATIONS.SNAPS) || [];
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<StandardError | null>(null);
  const { handleError, clearError } = createErrorState(setError, `${type} Snaps`);

  const loadSnaps = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        clearError();
        if (!silent) setRefreshing(true);

        const snapsList = type === 'inbox' ? await getInboxSnaps() : await getSentSnaps();
        setSnaps(snapsList);

        // Cache the new data
        cache.set(cacheKey, snapsList, user.id);
      } catch (error) {
        ErrorHandler.handleApiError(error, `load ${type} snaps`, silent);
        if (!silent) {
          handleError(error, { context: `Loading ${type} snaps` });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [user?.id, type, cacheKey, handleError, clearError]
  );

  const refresh = useCallback(async () => {
    await loadSnaps(false); // Not silent for manual refresh
  }, [loadSnaps]);

  const markOpened = useCallback(
    async (snapId: string) => {
      if (type !== 'inbox' || !user?.id) return;

      try {
        await markSnapOpened(snapId);

        // Atomically update both cache and state
        const updatedSnaps = cache.update<Snap[]>(
          cacheKey,
          current => {
            const snaps = current || [];
            return snaps.map(snap =>
              snap.id === snapId ? { ...snap, opened_at: new Date().toISOString() } : snap
            );
          },
          user.id
        );

        setSnaps(updatedSnaps);
      } catch (error) {
        ErrorHandler.handleApiError(error, 'mark snap as opened', true);
      }
    },
    [type, user?.id, cacheKey]
  );

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;

    // Check if we need fresh data
    const hasValidCache = cache.has(cacheKey, user.id, CACHE_DURATIONS.SNAPS);
    if (!hasValidCache) {
      loadSnaps(true); // Silent background fetch
    }
  }, [user?.id, cacheKey, loadSnaps]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription =
      type === 'inbox'
        ? subscribeToInboxChanges(user.id, () => loadSnaps(true)) // Silent reload on real-time updates
        : subscribeToSentSnapsChanges(user.id, () => loadSnaps(true));

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, type, loadSnaps]);

  return {
    snaps,
    refreshing,
    error,
    refresh,
    markOpened,
    reload: loadSnaps,
  };
}
