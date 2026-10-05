// Supabase'den dönen snake_case satırları src/types/models.ts'deki camelCase
// domain tiplerine çeviren saf dönüştürücü fonksiyonlar.

import type { Category, Location, Product } from '@/types/models';

type SupabaseCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type SupabaseProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  is_available: boolean;
};

type SupabaseLocationRow = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  // `opening_hours` jsonb olarak saklanıyor: düz metin, { [gun]: saat } şeklinde
  // bir obje ya da henüz tanımsız (null) olabilir.
  opening_hours: unknown;
};

export function mapCategory(row: SupabaseCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

export function mapProduct(row: SupabaseProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id ?? '',
    name: row.name,
    description: row.description ?? '',
    price: typeof row.price === 'string' ? Number(row.price) : row.price,
    imageUrl: row.image_url ?? undefined,
    isAvailable: row.is_available,
  };
}

function formatOpeningHours(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return Object.entries(value as Record<string, string>)
        .map(([day, hours]) => `${day}: ${hours}`)
        .join(', ');
    } catch {
      return '';
    }
  }
  return '';
}

export function mapLocation(row: SupabaseLocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    phone: row.phone ?? undefined,
    openingHours: formatOpeningHours(row.opening_hours),
  };
}
