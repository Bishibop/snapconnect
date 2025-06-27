import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface VibeCheck {
  id: string;
  sender_id: string;
  recipient_id: string;
  media_url: string;
  vibe_check_type: 'photo' | 'video';
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

export interface CreateVibeCheckParams {
  recipientId: string;
  mediaUrl: string;
  vibeCheckType: 'photo' | 'video';
  filterType?: string;
  duration?: number;
}

// Create a new vibe check
export async function createVibeCheck(params: CreateVibeCheckParams): Promise<VibeCheck> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vibe_checks')
    .insert({
      sender_id: user.id,
      recipient_id: params.recipientId,
      media_url: params.mediaUrl,
      vibe_check_type: params.vibeCheckType,
      filter_type: params.filterType,
      duration: params.duration,
      status: 'sent',
    })
    .select(
      `
      *,
      sender_profile:profiles!vibe_checks_sender_id_fkey(*),
      recipient_profile:profiles!vibe_checks_recipient_id_fkey(*)
    `
    )
    .single();

  if (error) {
    throw ErrorHandler.handleApiError(error, 'create vibe check', true).originalError;
  }

  return data;
}

// Get inbox vibe checks (received by current user)
export async function getInboxVibeChecks(): Promise<VibeCheck[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vibe_checks')
    .select(
      `
      *,
      sender_profile:profiles!vibe_checks_sender_id_fkey(*)
    `
    )
    .eq('recipient_id', user.id)
    .in('status', ['sent', 'delivered'])
    .order('created_at', { ascending: false });

  if (error) {
    throw ErrorHandler.handleApiError(error, 'fetch inbox vibe checks', true).originalError;
  }

  return data || [];
}

// Get sent vibe checks (sent by current user)
export async function getSentVibeChecks(): Promise<VibeCheck[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vibe_checks')
    .select(
      `
      *,
      recipient_profile:profiles!vibe_checks_recipient_id_fkey(*)
    `
    )
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw ErrorHandler.handleApiError(error, 'fetch sent vibe checks', true).originalError;
  }

  return data || [];
}

// Mark a vibe check as opened
export async function markVibeCheckOpened(vibeCheckId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('vibe_checks')
    .update({
      status: 'opened',
      opened_at: new Date().toISOString(),
    })
    .eq('id', vibeCheckId)
    .eq('recipient_id', user.id); // Ensure user can only mark their own received vibe checks

  if (error) {
    throw ErrorHandler.handleApiError(error, 'mark vibe check as opened', true).originalError;
  }
}

// Subscribe to inbox vibe check changes
export function subscribeToInboxVibeCheckChanges(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('inbox-vibe-check-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vibe_checks',
        filter: `recipient_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// Subscribe to sent vibe check changes (for status updates)
export function subscribeToSentVibeCheckChanges(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('sent-vibe-check-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vibe_checks',
        filter: `sender_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
