// Scald Coffee admin panel — Supabase tablolarına karşılık gelen tipler.
// Şema: backend/supabase/migrations/0001_init.sql ve 0002_admin_and_loyalty.sql

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  opening_hours: unknown | null;
  created_at: string;
  updated_at: string;
};

export type Promotion = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  loyalty_points: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type LoyaltyTransactionType = "earn" | "redeem";

export type LoyaltyTransaction = {
  id: string;
  user_id: string;
  points: number;
  type: LoyaltyTransactionType;
  note: string | null;
  created_at: string;
};
