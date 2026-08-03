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
      restaurants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          phone: string | null;
          address: string | null;
          hours: string | null;
          currency: string;
          accent_color: string | null;
          owner_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          phone?: string | null;
          address?: string | null;
          hours?: string | null;
          currency?: string;
          accent_color?: string | null;
          owner_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          phone?: string | null;
          address?: string | null;
          hours?: string | null;
          currency?: string;
          accent_color?: string | null;
          owner_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      dishes: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          thumbnail_url: string | null;
          model_glb_url: string;
          model_usdz_url: string | null;
          is_available: boolean;
          sort_order: number;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          price: number;
          category?: string | null;
          thumbnail_url?: string | null;
          model_glb_url: string;
          model_usdz_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          category?: string | null;
          thumbnail_url?: string | null;
          model_glb_url?: string;
          model_usdz_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          tags?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
            isOneToOne: false;
          }
        ];
      };
      menu_events: {
        Row: {
          id: number;
          restaurant_id: string;
          dish_id: string | null;
          event: "menu_scan" | "dish_view";
          created_at: string;
        };
        Insert: {
          id?: number;
          restaurant_id: string;
          dish_id?: string | null;
          event: "menu_scan" | "dish_view";
          created_at?: string;
        };
        Update: {
          id?: number;
          restaurant_id?: string;
          dish_id?: string | null;
          event?: "menu_scan" | "dish_view";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_events_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "menu_events_dish_id_fkey";
            columns: ["dish_id"];
            referencedRelation: "dishes";
            referencedColumns: ["id"];
            isOneToOne: false;
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_restaurant: {
        Args: { p_slug: string };
        Returns: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          phone: string | null;
          address: string | null;
          hours: string | null;
          currency: string;
          accent_color: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}