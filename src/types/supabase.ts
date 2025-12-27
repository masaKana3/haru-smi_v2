export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          bio: string | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
      };
      daily_checks: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          answers: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          answers?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          answers?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      smi_results: {
        Row: {
          id: string;
          user_id: string;
          total_score: number | null;
          answers: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_score?: number | null;
          answers?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_score?: number | null;
          answers?: Json;
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}