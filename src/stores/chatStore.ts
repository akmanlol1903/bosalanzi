// src/stores/chatStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type UserForSender = Database['public']['Tables']['users']['Row'];

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: UserForSender | { 
    username: string;
    avatar_url: string | null;
    is_admin?: boolean; 
    verified?: boolean; 
    is_online?: boolean; 
    last_seen?: string; 
    id?: string; 
  };
  reply_to?: string;
  reply_to_content?: string;
  reply_to_username?: string;
};

interface ChatState {
  messages: Message[];
  privateChats: Record<string, Message[]>;
  loading: boolean;
  sendGlobalMessage: (
    content: string,
    replyToId?: string | null,
    options?: { isEventMessage?: boolean; eventTriggeringUserId?: string }
  ) => Promise<boolean>;
  sendPrivateMessage: (receiverId: string, content: string) => Promise<boolean>;
  fetchGlobalMessages: () => Promise<void>;
  fetchPrivateMessages: (userId: string) => Promise<void>;
  subscribeToMessages: () => () => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string | null) => Promise<void>;

  unreadEventNotifications: number;
  incrementUnreadEventNotifications: () => void;
  clearUnreadEventNotifications: () => void;
}

const SYSTEM_SENDER_USERNAME = 'boşalanzi bildirimi'; // Çevrildi
const SYSTEM_SENDER_AVATAR = '/vite.svg'; 

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  privateChats: {},
  loading: false,
  unreadEventNotifications: 0,

  incrementUnreadEventNotifications: () => {
    if (!window.location.pathname.endsWith('/chat')) {
      set(state => ({ unreadEventNotifications: state.unreadEventNotifications + 1 }));
    }
  },
  clearUnreadEventNotifications: () => set({ unreadEventNotifications: 0 }),
  
  sendGlobalMessage: async (content: string, replyToId?: string | null, options?: { isEventMessage?: boolean; eventTriggeringUserId?: string }) => {
    const authUser = (await supabase.auth.getUser()).data.user;
    
    if (!authUser) {
      console.error('mesaj göndermek için kullanıcı kimliği doğrulanmadı');
      return false;
    }

    const messageData: Database['public']['Tables']['messages']['Insert'] = {
      sender_id: authUser.id, 
      content,
      created_at: new Date().toISOString(),
      is_event_message: options?.isEventMessage || false,
    };
    
    if (replyToId) {
      const { data: replyMessage } = await supabase
        .from('messages')
        .select('id, content, sender:users!messages_sender_id_fkey(username)')
        .eq('id', replyToId)
        .single();

      if (replyMessage && replyMessage.sender) {
        messageData.reply_to = replyMessage.id;
        messageData.reply_to_content = replyMessage.content;
        messageData.reply_to_username = (replyMessage.sender as UserForSender).username;
      }
    }
    
    const { error } = await supabase
      .from('messages')
      .insert(messageData);
      
    if (error) {
      console.error('mesaj gönderilirken hata:', error);
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
      console.error('özel mesaj gönderilirken hata:', error);
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
        is_event_message, 
        sender:users!messages_sender_id_fkey(
          id, username, avatar_url, is_admin, verified, is_online, last_seen
        )
      `)
      .is('receiver_id', null)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('mesajlar alınırken hata:', error);
      set({ loading: false });
      return;
    }
    
    if (data) {
      const processedMessages = data.map(msg => {
        if (msg.is_event_message) {
          return {
            ...msg,
            sender: {
              id: msg.sender_id, 
              username: SYSTEM_SENDER_USERNAME,
              avatar_url: SYSTEM_SENDER_AVATAR,
              is_admin: false,
              verified: true,
              is_online: true,
              last_seen: msg.created_at
            }
          };
        }
        return msg;
      });
      set({ messages: processedMessages as Message[], loading: false });
    } else {
      set({ messages: [], loading: false });
    }
  },
  
  editMessage: async (messageId: string, content: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content, edited: true, updated_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) console.error('mesaj düzenlenirken hata:', error);
  },

  deleteMessage: async (messageId: string | null) => {
    const query = supabase.from('messages');
    if (messageId === null) {
      await query.delete().is('receiver_id', null).eq('is_event_message', false);
      await query.delete().is('receiver_id', null).eq('is_event_message', true); 
    } else {
      await query.delete().eq('id', messageId);
    }
  },
  
  subscribeToMessages: () => {
    const messagesSubscriptionKey = 'messages-global-subscription-v2';
    const messageChannel = supabase.channel(messagesSubscriptionKey);
    
    messageChannel
      .on<Database['public']['Tables']['messages']['Row']>(
        'postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, 
        async (payload) => {
          const newMessage = payload.new;

          if (newMessage.receiver_id === null) { 
            console.log('realtime aracılığıyla yeni genel mesaj:', newMessage);

            let processedMessage: Message;

            if (newMessage.is_event_message) {
              processedMessage = {
                ...newMessage,
                sender: {
                  id: newMessage.sender_id,
                  username: SYSTEM_SENDER_USERNAME,
                  avatar_url: SYSTEM_SENDER_AVATAR,
                  is_admin: false,
                  verified: true,
                  is_online: true,
                  last_seen: newMessage.created_at
                }
              };
              get().incrementUnreadEventNotifications();
            } else if (newMessage.sender_id) {
              const { data: userSenderData, error: userError } = await supabase
                .from('users')
                .select('id, username, avatar_url, is_admin, verified, is_online, last_seen')
                .eq('id', newMessage.sender_id)
                .single();
              
              processedMessage = {
                ...newMessage,
                sender: userError ? undefined : userSenderData
              };
            } else {
              processedMessage = { ...newMessage, sender: undefined };
            }
            
            set(state => ({ messages: [...state.messages, processedMessage] }));
          }
        }
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') console.log(`${messagesSubscriptionKey} kanalına başarıyla abone olundu`);
         else if (err) console.error(`${messagesSubscriptionKey} aboneliğinde hata:`, err);
         else console.log(`${messagesSubscriptionKey} için abonelik durumu: ${status}`);
      });
      
    return () => {
      console.log(`${messagesSubscriptionKey} aboneliğinden çıkılıyor`);
      supabase.removeChannel(messageChannel).catch(error => console.error(`${messagesSubscriptionKey} aboneliğinden çıkılırken hata:`, error));
    };
  }
}));