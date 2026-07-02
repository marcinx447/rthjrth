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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          created_at: string
          discord_id: string
          id: string
          is_banned: boolean
          password: string
          permissions: string[]
          role: string
          username: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          discord_id: string
          id?: string
          is_banned?: boolean
          password: string
          permissions?: string[]
          role?: string
          username: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          discord_id?: string
          id?: string
          is_banned?: boolean
          password?: string
          permissions?: string[]
          role?: string
          username?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          agent: string
          created_at: string
          id: string
          ip_hash: string | null
          product_id: string | null
        }
        Insert: {
          agent: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          product_id?: string | null
        }
        Update: {
          agent?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_likes: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          outfit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          outfit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          outfit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          author: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_hidden: boolean
          is_verified: boolean
          items: Json
          likes: number
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_hidden?: boolean
          is_verified?: boolean
          items?: Json
          likes?: number
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_hidden?: boolean
          is_verified?: boolean
          items?: Json
          likes?: number
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          path?: string | null
        }
        Relationships: []
      }
      product_backups: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          reason: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          reason?: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          reason?: string
          snapshot?: Json
        }
        Relationships: []
      }
      products: {
        Row: {
          agent_links: Json
          batch: string | null
          category: string
          contact_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          images: string[]
          is_verified: boolean
          name: string
          original_price: number | null
          price: number
          quality: string | null
          sizes: string[]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          agent_links?: Json
          batch?: string | null
          category?: string
          contact_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          is_verified?: boolean
          name: string
          original_price?: number | null
          price: number
          quality?: string | null
          sizes?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          agent_links?: Json
          batch?: string | null
          category?: string
          contact_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          is_verified?: boolean
          name?: string
          original_price?: number | null
          price?: number
          quality?: string | null
          sizes?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          announcement: string | null
          announcement_active: boolean
          id: number
          maintenance_message: string
          maintenance_mode: boolean
          popup_active: boolean
          popup_message: string
          popup_title: string
          promo_active: boolean
          promo_cta_label: string
          promo_link: string
          promo_logo: string
          promo_message: string
          promo_title: string
          updated_at: string
        }
        Insert: {
          announcement?: string | null
          announcement_active?: boolean
          id?: number
          maintenance_message?: string
          maintenance_mode?: boolean
          popup_active?: boolean
          popup_message?: string
          popup_title?: string
          promo_active?: boolean
          promo_cta_label?: string
          promo_link?: string
          promo_logo?: string
          promo_message?: string
          promo_title?: string
          updated_at?: string
        }
        Update: {
          announcement?: string | null
          announcement_active?: boolean
          id?: number
          maintenance_message?: string
          maintenance_mode?: boolean
          popup_active?: boolean
          popup_message?: string
          popup_title?: string
          promo_active?: boolean
          promo_cta_label?: string
          promo_link?: string
          promo_logo?: string
          promo_message?: string
          promo_title?: string
          updated_at?: string
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
