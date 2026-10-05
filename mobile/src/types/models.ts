export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

// Bkz. backend/supabase/migrations/0012_customer_app_redesign.sql — products.options.
// Çoğu üründe seçenek yok (undefined); ürün detay ekranı sadece bu alan
// doluysa seçenek göstermeli.
export type ProductOption = {
  name: string;
  choices: string[];
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  options?: ProductOption[];
};

export type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  openingHours: string;
  imageUrl?: string;
};

export type LoyaltySummary = {
  points: number;
  tier: string;
  nextTierAt: number;
};

export type Promotion = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  startsAt: string | null;
  endsAt: string | null;
};
