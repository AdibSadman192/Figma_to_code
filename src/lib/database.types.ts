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
      profiles: {
        Row: {
          id: string
          figma_access_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          figma_access_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          figma_access_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          figma_url: string
          figma_file_key: string
          name: string | null
          status: string
          document: Json | null
          last_modified: string | null
          version: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          figma_url: string
          figma_file_key: string
          name?: string | null
          status?: string
          document?: Json | null
          last_modified?: string | null
          version?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          figma_url?: string
          figma_file_key?: string
          name?: string | null
          status?: string
          document?: Json | null
          last_modified?: string | null
          version?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
