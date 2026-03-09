export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          active_prompt_version_id: string | null
          chat_model: string | null
          created_at: string
          embedding_model: string | null
          enable_mmr: boolean | null
          hybrid_enabled: boolean | null
          id: string
          max_tokens: number | null
          mmr_lambda: number | null
          rate_limit_per_minute: number | null
          similarity_threshold: number | null
          temperature: number | null
          top_k: number | null
          updated_at: string
          url_allowlist: string[] | null
        }
        Insert: {
          active_prompt_version_id?: string | null
          chat_model?: string | null
          created_at?: string
          embedding_model?: string | null
          enable_mmr?: boolean | null
          hybrid_enabled?: boolean | null
          id?: string
          max_tokens?: number | null
          mmr_lambda?: number | null
          rate_limit_per_minute?: number | null
          similarity_threshold?: number | null
          temperature?: number | null
          top_k?: number | null
          updated_at?: string
          url_allowlist?: string[] | null
        }
        Update: {
          active_prompt_version_id?: string | null
          chat_model?: string | null
          created_at?: string
          embedding_model?: string | null
          enable_mmr?: boolean | null
          hybrid_enabled?: boolean | null
          id?: string
          max_tokens?: number | null
          mmr_lambda?: number | null
          rate_limit_per_minute?: number | null
          similarity_threshold?: number | null
          temperature?: number | null
          top_k?: number | null
          updated_at?: string
          url_allowlist?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_prompt_version"
            columns: ["active_prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          retrieved_chunk_ids: string[] | null
          role: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          retrieved_chunk_ids?: string[] | null
          role: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          retrieved_chunk_ids?: string[] | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          chat_log_id: string | null
          comment: string | null
          created_at: string
          helpful: boolean | null
          id: string
        }
        Insert: {
          chat_log_id?: string | null
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
        }
        Update: {
          chat_log_id?: string | null
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_chat_log_id_fkey"
            columns: ["chat_log_id"]
            isOneToOne: false
            referencedRelation: "chat_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          article_id: string | null
          category: string | null
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          ingestion_status: string
          raw_text: string
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          category?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          ingestion_status?: string
          raw_text: string
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          category?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          ingestion_status?: string
          raw_text?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          article_uuid: string
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          section: string | null
          source_url: string | null
        }
        Insert: {
          article_uuid: string
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          section?: string | null
          source_url?: string | null
        }
        Update: {
          article_uuid?: string
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          section?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_article_uuid_fkey"
            columns: ["article_uuid"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          created_at: string
          id: string
          name: string
          system_prompt: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          system_prompt: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          system_prompt?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string
          id: string
          session_id: string | null
          short_description: string
          sn_incident_number: string | null
          sn_incident_url: string | null
          status: string
          urgency: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description: string
          id?: string
          session_id?: string | null
          short_description: string
          sn_incident_number?: string | null
          sn_incident_url?: string | null
          status?: string
          urgency?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string
          id?: string
          session_id?: string | null
          short_description?: string
          sn_incident_number?: string | null
          sn_incident_url?: string | null
          status?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { check_email: string }; Returns: boolean }
      match_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          article_uuid: string
          chunk_index: number
          content: string
          id: string
          section: string
          similarity: number
          source_url: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
