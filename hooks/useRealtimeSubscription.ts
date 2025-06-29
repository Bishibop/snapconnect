import { useEffect, useRef } from 'react';
import { useRealtimeContext } from '../contexts/RealtimeContext';

interface SubscriptionConfig {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
}

interface UseRealtimeSubscriptionOptions {
  enabled?: boolean;
  dependencies?: any[];
}

/**
 * Hook for subscribing to realtime events through the centralized RealtimeContext
 * This replaces the previous implementation that created individual channels
 */
export function useRealtimeSubscription(
  configs: SubscriptionConfig | SubscriptionConfig[],
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  const { subscribe, unsubscribe, updateSubscription, isConnected } = useRealtimeContext();
  const { enabled = true, dependencies = [] } = options;

  // Generate stable subscription ID
  const subscriptionIdRef = useRef(`sub-${Math.random().toString(36).substring(2, 9)}`);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up subscription
  useEffect(() => {
    if (!enabled) {
      unsubscribe(subscriptionIdRef.current);
      return;
    }

    const configArray = Array.isArray(configs) ? configs : [configs];

    // Use stable callback that forwards to current callback
    const stableCallback = (payload: any) => {
      try {
        callbackRef.current(payload);
      } catch (error) {
        console.error('[useRealtimeSubscription] Error in callback:', error);
      }
    };

    updateSubscription(subscriptionIdRef.current, configArray, stableCallback, enabled);

    return () => {
      unsubscribe(subscriptionIdRef.current);
    };
  }, [enabled, subscribe, unsubscribe, updateSubscription, ...dependencies]);

  return {
    status: isConnected ? 'connected' : 'disconnected',
    error: null,
    unsubscribe: () => unsubscribe(subscriptionIdRef.current),
  };
}

// Legacy compatibility hooks (now use centralized context)
export function useTableSubscription(
  table: string,
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  return useRealtimeSubscription({ table }, callback, options);
}
