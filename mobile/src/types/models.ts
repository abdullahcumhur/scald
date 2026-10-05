export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  openingHours: string;
};

export type LoyaltySummary = {
  points: number;
  tier: string;
  nextTierAt: number;
};
