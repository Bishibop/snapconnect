import { supabase } from '../lib/supabase';
import { Conversation, TextMessage } from '../types';

export const conversationsService = {
  async getConversations(): Promise<Conversation[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participant1:participant1_id(id, username, bio),
        participant2:participant2_id(id, username, bio),
        messages(
          id,
          content,
          sender_id,
          created_at,
          read_at
        )
      `
      )
      .or(`participant1_id.eq.${user.user.id},participant2_id.eq.${user.user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    return (data || []).map(conv => {
      const lastMessage = conv.messages?.[0];
      const unreadCount =
        conv.messages?.filter(
          (msg: { sender_id: string; read_at: string | null }) =>
            msg.sender_id !== user.user.id && !msg.read_at
        ).length || 0;

      return {
        ...conv,
        last_message: lastMessage,
        unread_count: unreadCount,
        messages: undefined, // Remove messages array from response
      };
    });
  },

  async getOrCreateConversation(recipientId: string): Promise<Conversation> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const userId = user.user.id;
    const participant1 = userId < recipientId ? userId : recipientId;
    const participant2 = userId < recipientId ? recipientId : userId;

    // Try to find existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participant1:participant1_id(id, username, bio),
        participant2:participant2_id(id, username, bio)
      `
      )
      .or(
        `and(participant1_id.eq.${participant1},participant2_id.eq.${participant2}),` +
          `and(participant1_id.eq.${participant2},participant2_id.eq.${participant1})`
      )
      .single();

    if (existing) return existing;

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant1_id: participant1,
        participant2_id: participant2,
      })
      .select(
        `
        *,
        participant1:participant1_id(id, username, bio),
        participant2:participant2_id(id, username, bio)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(conversationId: string): Promise<TextMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_id(id, username, bio)
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId: string, content: string): Promise<TextMessage> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.user.id,
        content: content.trim(),
      })
      .select(
        `
        *,
        sender:sender_id(id, username, bio)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.user.id)
      .is('read_at', null);

    if (error) throw error;
  },

  subscribeToConversations(onUpdate: () => void) {
    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        onUpdate
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  subscribeToMessages(conversationId: string, onNewMessage: (message: TextMessage) => void) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          try {
            // Fetch the full message with sender info
            const { data, error } = await supabase
              .from('messages')
              .select(
                `
                *,
                sender:sender_id(id, username, bio)
              `
              )
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching message details:', error);
              return;
            }

            if (data) {
              onNewMessage(data);
            }
          } catch (error) {
            console.error('Exception in subscription handler:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
