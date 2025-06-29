import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionConfig {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
}

interface RealtimeSubscription {
  id: string;
  configs: SubscriptionConfig[];
  callback: (payload: any) => void;
  enabled: boolean;
}

interface RealtimeContextType {
  subscribe: (
    id: string,
    configs: SubscriptionConfig[],
    callback: (payload: any) => void,
    enabled?: boolean
  ) => void;
  unsubscribe: (id: string) => void;
  updateSubscription: (
    id: string,
    configs: SubscriptionConfig[],
    callback: (payload: any) => void,
    enabled?: boolean
  ) => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtimeContext(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // Track component mount state
  const isMountedRef = useRef(true);

  // Store all active subscriptions
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());

  // Single channel for all realtime communications
  const channelRef = useRef<any>(null);

  // Throttling for subscription updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Track connection attempts
  const connectionAttemptsRef = useRef(0);

  // Initialize single channel
  const initializeChannel = useCallback(() => {
    if (channelRef.current) {
      // Channel already exists, skipping initialization
      return;
    }

    if (!user?.id) {
      // No user ID, skipping initialization
      return;
    }

    connectionAttemptsRef.current++;
    // Connection attempt

    try {
      // Creating channel for user

      const channel = supabase.channel('app-realtime-unified', {
        config: {
          presence: { key: user.id },
        },
      });

      // Set up consolidated listeners BEFORE subscribing
      // Setting up consolidated listeners
      setupConsolidatedListeners(channel);

      channel.subscribe((status: string, _error?: any) => {
        if (!isMountedRef.current) return;

        // Channel subscription status: status

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Unified realtime channel connected successfully
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          // Channel error: status
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          // Channel closed
        }
      });

      channelRef.current = channel;

      // Channel initialization complete
    } catch {
      // Error initializing realtime channel
      setIsConnected(false);
    }
  }, [user?.id]);

  // Set up listeners for all our main tables in a single channel
  const setupConsolidatedListeners = useCallback(
    (channel: any) => {
      if (!user?.id) return;

      // Listen to profiles table
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => handleRealtimeEvent('profiles', payload)
      );

      // Total listeners added: 1 (profiles)
    },
    [user?.id]
  );

  // Handle realtime events and route to appropriate subscriptions
  const handleRealtimeEvent = useCallback((table: string, payload: any) => {
    if (!isMountedRef.current) return;

    // Event received for table

    // Add to pending updates for throttling
    pendingUpdatesRef.current.add(
      `${table}:${payload.eventType}:${payload.new?.id || payload.old?.id}`
    );

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Throttle updates to prevent spam
    updateTimeoutRef.current = setTimeout(() => {
      const updates = Array.from(pendingUpdatesRef.current);
      pendingUpdatesRef.current.clear();

      if (!isMountedRef.current || updates.length === 0) return;

      // Route events to matching subscriptions
      subscriptionsRef.current.forEach(subscription => {
        if (!subscription.enabled) return;

        const matchingConfig = subscription.configs.find(config => {
          if (config.table !== table) return false;
          if (config.event && config.event !== '*' && config.event !== payload.eventType)
            return false;
          // Add filter matching logic if needed
          return true;
        });

        if (matchingConfig) {
          try {
            subscription.callback(payload);
          } catch {
            // Error in subscription callback
          }
        }
      });
    }, 300); // 300ms throttle
  }, []);

  // Public API: Subscribe to realtime events
  const subscribe = useCallback(
    (
      id: string,
      configs: SubscriptionConfig[],
      callback: (payload: any) => void,
      enabled = true
    ) => {
      if (!isMountedRef.current) return;

      // Registering subscription

      subscriptionsRef.current.set(id, {
        id,
        configs,
        callback,
        enabled,
      });

      // Active subscriptions count updated

      // Initialize channel if not already done
      if (!channelRef.current && user?.id) {
        // Channel not initialized, initializing now
        initializeChannel();
      }
    },
    [user?.id, initializeChannel]
  );

  // Public API: Unsubscribe from realtime events
  const unsubscribe = useCallback((id: string) => {
    subscriptionsRef.current.delete(id);
  }, []);

  // Public API: Update existing subscription
  const updateSubscription = useCallback(
    (
      id: string,
      configs: SubscriptionConfig[],
      callback: (payload: any) => void,
      enabled = true
    ) => {
      if (!isMountedRef.current) return;

      const existing = subscriptionsRef.current.get(id);
      if (existing) {
        subscriptionsRef.current.set(id, {
          ...existing,
          configs,
          callback,
          enabled,
        });
      } else {
        subscribe(id, configs, callback, enabled);
      }
    },
    [subscribe]
  );

  // Initialize channel when user is available
  useEffect(() => {
    // User effect triggered

    if (user?.id && !channelRef.current) {
      // User authenticated, initializing channel
      initializeChannel();
    } else if (!user?.id && channelRef.current) {
      // Clean up when user logs out
      try {
        channelRef.current.unsubscribe();
      } catch {
        // Error unsubscribing channel
      }
      channelRef.current = null;
      setIsConnected(false);
      subscriptionsRef.current.clear();
    }
  }, [user?.id, initializeChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch {
          // Error cleaning up realtime channel
        }
      }

      subscriptionsRef.current.clear();
    };
  }, []);

  const contextValue: RealtimeContextType = {
    subscribe,
    unsubscribe,
    updateSubscription,
    isConnected,
  };

  return <RealtimeContext.Provider value={contextValue}>{children}</RealtimeContext.Provider>;
}
