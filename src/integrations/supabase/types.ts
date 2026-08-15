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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      couples: {
        Row: {
          created_at: string | null
          id: string
          paired_at: string | null
          pairing_code: string
          status: Database["public"]["Enums"]["relationship_status"] | null
          updated_at: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          paired_at?: string | null
          pairing_code: string
          status?: Database["public"]["Enums"]["relationship_status"] | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          paired_at?: string | null
          pairing_code?: string
          status?: Database["public"]["Enums"]["relationship_status"] | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          couple_id: string
          created_at: string | null
          current_turn_id: string | null
          game_type: string
          id: string
          player1_id: string | null
          player2_id: string | null
          state: Json
          status: Database["public"]["Enums"]["game_status"] | null
          updated_at: string | null
          version: number | null
          winner_id: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          current_turn_id?: string | null
          game_type: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          state?: Json
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string | null
          version?: number | null
          winner_id?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          current_turn_id?: string | null
          game_type?: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          state?: Json
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string | null
          version?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_current_turn_id_fkey"
            columns: ["current_turn_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          couple_id: string
          created_at: string | null
          date: string
          emoji: string | null
          id: string
          title: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          date: string
          emoji?: string | null
          id?: string
          title: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          date?: string
          emoji?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          couple_id: string | null
          created_at: string | null
          id: string
          room_id: string | null
          sender_id: string
          type: string | null
        }
        Insert: {
          content: string
          couple_id?: string | null
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender_id: string
          type?: string | null
        }
        Update: {
          content?: string
          couple_id?: string | null
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          display_name: string | null
          gender: string | null
          id: string
          last_seen: string | null
          online_status: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id: string
          last_seen?: string | null
          online_status?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          last_seen?: string | null
          online_status?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          couple_id: string
          created_at: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          mood_theme: string | null
          room_code: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          mood_theme?: string | null
          room_code: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          mood_theme?: string | null
          room_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          couple_id: string
          created_at: string | null
          date: string
          id: string
          time: string
          title: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          date: string
          id?: string
          time: string
          title: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          date?: string
          id?: string
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_messages: {
        Row: {
          couple_id: string
          created_at: string | null
          id: string
          is_revealed: boolean | null
          reveal_type: Database["public"]["Enums"]["reveal_type"] | null
          revealed_at: string | null
          sender_id: string
          text: string
          timer_seconds: number | null
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          reveal_type?: Database["public"]["Enums"]["reveal_type"] | null
          revealed_at?: string | null
          sender_id: string
          text: string
          timer_seconds?: number | null
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          reveal_type?: Database["public"]["Enums"]["reveal_type"] | null
          revealed_at?: string | null
          sender_id?: string
          text?: string
          timer_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secret_messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
      game_status: "active" | "finished" | "rematch_requested"
      relationship_status: "pairing" | "paired" | "unpaired"
      reveal_type: "timer" | "click"
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
    Enums: {
      app_role: ["admin", "user"],
      game_status: ["active", "finished", "rematch_requested"],
      relationship_status: ["pairing", "paired", "unpaired"],
      reveal_type: ["timer", "click"],
    },
  },
} as const
