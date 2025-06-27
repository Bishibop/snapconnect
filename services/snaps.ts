import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface Snap {
  id: string;
  sender_id: string;
  recipient_id: string;
  media_url: string;
  snap_type: 'photo' | 'video';
  filter_type?: string;
  duration?: number;
  status: 'sent' | 'delivered' | 'opened' | 'expired';
  created_at: string;
  delivered_at?: string;
  opened_at?: string;
  sender_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  recipient_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CreateSnapParams {
  recipientId: string;
  mediaUrl: string;
  snapType: 'photo' | 'video';
  filterType?: string;
  duration?: number;
}

// Create a new snap
export async function createSnap(params: CreateSnapParams): Promise<Snap> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('snaps')
    .insert({
      sender_id: user.id,
      recipient_id: params.recipientId,
      media_url: params.mediaUrl,
      snap_type: params.snapType,
      filter_type: params.filterType,
      duration: params.duration,
      status: 'sent',
    })
    .select(
      `
      *,
      sender_profile:profiles!snaps_sender_id_fkey(*),
      recipient_profile:profiles!snaps_recipient_id_fkey(*)
    `
    )
    .single();

  if (error) {
    throw ErrorHandler.handleApiError(error, 'create snap', true).originalError;
  }

  return data;
}

// Get inbox snaps (received by current user)
export async function getInboxSnaps(): Promise<Snap[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('snaps')
    .select(
      `
      *,
      sender_profile:profiles!snaps_sender_id_fkey(*)
    `
    )
    .eq('recipient_id', user.id)
    .in('status', ['sent', 'delivered'])
    .order('created_at', { ascending: false });

  if (error) {
    throw ErrorHandler.handleApiError(error, 'fetch inbox snaps', true).originalError;
  }

  return data || [];
}

// Get sent snaps (sent by current user)
export async function getSentSnaps(): Promise<Snap[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('snaps')
    .select(
      `
      *,
      recipient_profile:profiles!snaps_recipient_id_fkey(*)
    `
    )
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw ErrorHandler.handleApiError(error, 'fetch sent snaps', true).originalError;
  }

  return data || [];
}

// Mark a snap as opened
export async function markSnapOpened(snapId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('snaps')
    .update({
      status: 'opened',
      opened_at: new Date().toISOString(),
    })
    .eq('id', snapId)
    .eq('recipient_id', user.id); // Ensure user can only mark their own received snaps

  if (error) {
    throw ErrorHandler.handleApiError(error, 'mark snap as opened', true).originalError;
  }
}

// Subscribe to inbox changes
export function subscribeToInboxChanges(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('inbox-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'snaps',
        filter: `recipient_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// Subscribe to sent snaps changes (for status updates)
export function subscribeToSentSnapsChanges(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('sent-snaps-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'snaps',
        filter: `sender_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
