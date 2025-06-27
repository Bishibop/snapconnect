/**
 * Local cache management for SnapConnect
 * Provides in-memory caching with background refresh capabilities
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId?: string;
}

interface CacheOptions {
  maxAge?: number; // milliseconds
  userSpecific?: boolean; // whether cache should be user-specific
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache
   * @param key - Cache key
   * @param userId - User ID for user-specific cache
   * @param maxAge - Maximum age in milliseconds
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string, userId?: string, maxAge?: number): T | null {
    const cacheKey = userId ? `${key}:${userId}` : key;
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAgeToUse = maxAge ?? this.DEFAULT_MAX_AGE;

    if (age > maxAgeToUse) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param userId - User ID for user-specific cache
   */
  set<T>(key: string, data: T, userId?: string): void {
    const cacheKey = userId ? `${key}:${userId}` : key;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Atomically update cache and return the updated data
   * Ensures cache and state updates are consistent
   * @param key - Cache key
   * @param updateFn - Function to update the data
   * @param userId - User ID for user-specific cache
   * @returns Updated data
   */
  update<T>(key: string, updateFn: (current: T | null) => T, userId?: string): T {
    const current = this.get<T>(key, userId);
    const updated = updateFn(current);
    this.set(key, updated, userId);
    return updated;
  }

  /**
   * Check if cache has valid data
   * @param key - Cache key
   * @param userId - User ID for user-specific cache
   * @param maxAge - Maximum age in milliseconds
   * @returns True if cache has valid data
   */
  has(key: string, userId?: string, maxAge?: number): boolean {
    return this.get(key, userId, maxAge) !== null;
  }

  /**
   * Clear specific cache entry
   * @param key - Cache key
   * @param userId - User ID for user-specific cache
   */
  clear(key: string, userId?: string): void {
    const cacheKey = userId ? `${key}:${userId}` : key;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache entries for a user
   * @param userId - User ID
   */
  clearUser(userId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(maxAge?: number): void {
    const maxAgeToUse = maxAge ?? this.DEFAULT_MAX_AGE;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeToUse) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const cache = new CacheManager();

// Cache keys for different data types
export const CACHE_KEYS = {
  FRIENDS: 'friends',
  FRIEND_REQUESTS_RECEIVED: 'friend_requests_received',
  FRIEND_REQUESTS_SENT: 'friend_requests_sent',
  STORIES: 'stories',
  USER_STORY: 'user_story',
  INBOX_SNAPS: 'inbox_snaps',
  SENT_SNAPS: 'sent_snaps',
  INBOX_VIBE_CHECKS: 'inbox_vibe_checks',
  SENT_VIBE_CHECKS: 'sent_vibe_checks',
  USER_PROFILE: 'user_profile',
  CONVERSATIONS: 'conversations',
  CONVERSATION_MESSAGES: 'conversation_messages',
} as const;

// Cache durations
export const CACHE_DURATIONS = {
  FRIENDS: 10 * 60 * 1000, // 10 minutes
  STORIES: 2 * 60 * 1000, // 2 minutes (stories change frequently)
  SNAPS: 5 * 60 * 1000, // 5 minutes
  VIBE_CHECKS: 5 * 60 * 1000, // 5 minutes (same as snaps)
  PROFILE: 30 * 60 * 1000, // 30 minutes
  CONVERSATIONS: 2 * 60 * 1000, // 2 minutes (conversations change with new messages)
  MESSAGES: 30 * 1000, // 30 seconds (messages need to be fresh but can cache briefly)
} as const;

/**
 * Hook for cached data with background refresh
 * @param key - Cache key
 * @param fetchFn - Function to fetch fresh data
 * @param options - Cache options
 * @returns Object with cached data and loading states
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & {
    userId?: string;
    enabled?: boolean;
    dependencies?: any[];
  } = {}
) {
  const {
    maxAge,
    userSpecific = true,
    userId,
    enabled = true,
    dependencies: _dependencies = [],
  } = options;

  // Get cached data immediately
  const getCachedData = (): T | null => {
    if (!enabled) return null;
    return cache.get<T>(key, userSpecific ? userId : undefined, maxAge);
  };

  // Check if we need to fetch fresh data
  const shouldFetch = (): boolean => {
    if (!enabled) return false;
    return !cache.has(key, userSpecific ? userId : undefined, maxAge);
  };

  // Fetch and cache data
  const fetchAndCache = async (silent = false): Promise<T | null> => {
    if (!enabled) return null;

    try {
      const data = await fetchFn();
      cache.set(key, data, userSpecific ? userId : undefined);
      return data;
    } catch (error) {
      if (!silent) {
        console.error(`Error fetching data for key ${key}:`, error);
      }
      return null;
    }
  };

  return {
    getCachedData,
    shouldFetch,
    fetchAndCache,
    clearCache: () => cache.clear(key, userSpecific ? userId : undefined),
  };
}

/**
 * Utility to invalidate related caches
 * @param userId - User ID
 * @param keys - Specific cache keys to invalidate
 */
export function invalidateCache(userId?: string, keys?: string[]): void {
  if (keys) {
    keys.forEach(key => cache.clear(key, userId));
  } else if (userId) {
    cache.clearUser(userId);
  } else {
    cache.clearAll();
  }
}

/**
 * Cache warming utility - pre-fetch data in background
 * @param entries - Array of cache entries to warm
 */
export async function warmCache(
  entries: Array<{
    key: string;
    fetchFn: () => Promise<any>;
    userId?: string;
  }>
): Promise<void> {
  const promises = entries.map(async ({ key, fetchFn, userId }) => {
    try {
      const data = await fetchFn();
      cache.set(key, data, userId);
    } catch (error) {
      console.warn(`Failed to warm cache for key ${key}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

// Note: Cache cleanup is now handled by AppState listeners in useAppStateCleanup hook
// to prevent memory leaks and ensure proper cleanup when app backgrounds/foregrounds
