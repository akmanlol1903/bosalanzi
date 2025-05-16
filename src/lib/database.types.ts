export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
          verified: boolean
          is_online: boolean
          last_seen: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          verified?: boolean
          is_online?: boolean
          last_seen?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          verified?: boolean
          is_online?: boolean
          last_seen?: string
        }
      }
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          url: string
          thumbnail_url: string | null
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          url: string
          thumbnail_url?: string | null
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          url?: string
          thumbnail_url?: string | null
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          video_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      profile_comments: {
        Row: {
          id: string
          user_id: string
          profile_username: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_username: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_username?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      comment_details: {
        Row: {
          id: string
          video_id: string
          user_id: string
          content: string
          created_at: string
          username: string
          avatar_url: string | null
          is_admin: boolean
          verified: boolean
        }
      }
      profile_comment_details: {
        Row: {
          id: string
          user_id: string
          profile_username: string
          content: string
          created_at: string
          username: string
          avatar_url: string | null
        }
      }
    }
  }
}