import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: {
    username: string;
    avatar_url: string | null;
    is_admin: boolean;
    verified: boolean;
    is_online: boolean;
    last_seen: string;
  };
  reply_to?: string;
  reply_to_content?: string;
  reply_to_username?: string;
};

interface ChatState {
  messages: Message[];
  privateChats: Record<string, Message[]>;
  loading: boolean;
  sendGlobalMessage: (content: string, replyToId?: string | null) => Promise<boolean>;
  sendPrivateMessage: (receiverId: string, content: string) => Promise<boolean>;
  fetchGlobalMessages: () => Promise<void>;
  fetchPrivateMessages: (userId: string) => Promise<void>;
  subscribeToMessages: () => () => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string | null) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  privateChats: {},
  loading: false,
  
  sendGlobalMessage: async (content: string, replyToId?: string | null) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;
    
    const messageData: any = {
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    };

    if (replyToId) {
      const { data: replyMessage } = await supabase
        .from('messages')
        .select('id, content, sender:users!messages_sender_id_fkey(username)')
        .eq('id', replyToId)
        .single();

      if (replyMessage) {
        messageData.reply_to = replyMessage.id;
        messageData.reply_to_content = replyMessage.content;
        messageData.reply_to_username = replyMessage.sender.username;
      }
    }
    
    const { error } = await supabase
      .from('messages')
      .insert(messageData);
      
    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  },
  
  sendPrivateMessage: async (receiverId: string, content: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;
    
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error sending private message:', error);
      return false;
    }

    return true;
  },
  
  fetchGlobalMessages: async () => {
    set({ loading: true });
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(
          username, 
          avatar_url, 
          is_admin, 
          verified,
          is_online,
          last_seen
        )
      `)
      .is('receiver_id', null)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      set({ loading: false });
      return;
    }
    
    set({ messages: data || [], loading: false });
  },
  
  fetchPrivateMessages: async (userId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(
          username, 
          avatar_url, 
          is_admin, 
          verified,
          is_online,
          last_seen
        )
      `)
      .or(`and(receiver_id.eq.${userId},sender_id.eq.${user.id}),and(receiver_id.eq.${user.id},sender_id.eq.${userId})`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching private messages:', error);
      return;
    }
    
    set(state => ({
      privateChats: {
        ...state.privateChats,
        [userId]: data || []
      }
    }));
  },
  
  editMessage: async (messageId: string, content: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId);

    if (error) {
      console.error('Error editing message:', error);
      return;
    }
  },

  deleteMessage: async (messageId: string | null) => {
    const query = supabase.from('messages');
    
    if (messageId === null) {
      // Delete all global messages
      await query.delete().is('receiver_id', null);
    } else {
      // Delete specific message
      await query.delete().eq('id', messageId);
    }
  },
  
  subscribeToMessages: () => {
    const messageChannel = supabase.channel('messages');
    
    messageChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, async () => {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey(
              username, 
              avatar_url, 
              is_admin, 
              verified,
              is_online,
              last_seen
            )
          `)
          .is('receiver_id', null)
          .order('created_at', { ascending: true });
          
        if (!error && data) {
          set({ messages: data });
        }
      })
      .subscribe();
      
    return () => {
      messageChannel.unsubscribe();
    };
  }
}));
