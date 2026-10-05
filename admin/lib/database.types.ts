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
  image_url: string | null;
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

// staff_role/location_id/is_active: bkz. backend/supabase/migrations/0009_staff_roles.sql.
// staff_role null olan bir profil "personel değil" demektir (sıradan müşteri,
// ya da henüz role atanmamış bir is_admin hesabı).
export type StaffRole = "cashier" | "manager" | "owner";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  loyalty_points: number;
  coffee_stamps: number;
  free_coffees: number;
  is_admin: boolean;
  staff_role: StaffRole | null;
  location_id: string | null;
  is_active: boolean;
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

// Şema: backend/supabase/migrations/0008_coffee_stamps.sql — para/harcama
// tutarından bağımsız, kahve adedine bağlı ikinci (ayrı) sadakat mekaniği.
// loyalty_points/loyalty_transactions'tan tamamen bağımsızdır.
export type CoffeeStampTransactionType = "stamp" | "redeem_free_coffee";

export type CoffeeStampTransaction = {
  id: string;
  user_id: string;
  type: CoffeeStampTransactionType;
  note: string | null;
  created_at: string;
};

// Şema: backend/supabase/migrations/0003_orders.sql ("Sırasız Teslim Al")
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export type OrderType = "pickup" | "table";

export type Order = {
  id: string;
  user_id: string;
  location_id: string;
  status: OrderStatus;
  pickup_code: string;
  requested_minutes: number;
  total_amount: number;
  order_type: OrderType;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
};
