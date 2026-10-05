import type { Category, Location, LoyaltySummary, Product, Promotion } from '@/types/models';

// Gerçek içerik Supabase bağlanana kadar ekranları geliştirmek için kullanılan geçici veri.
export const mockCategories: Category[] = [
  { id: 'coffee', name: 'Kahve', sortOrder: 1 },
  { id: 'tea', name: 'Çay', sortOrder: 2 },
  { id: 'bakery', name: 'Fırın', sortOrder: 3 },
];

export const mockProducts: Product[] = [
  {
    id: 'espresso',
    categoryId: 'coffee',
    name: 'Espresso',
    description: 'Yoğun ve aromatik tek shot espresso.',
    price: 65,
    isAvailable: true,
  },
  {
    id: 'flat-white',
    categoryId: 'coffee',
    name: 'Flat White',
    description: 'Mikroköpüklü süt ile dengeli espresso.',
    price: 95,
    isAvailable: true,
  },
  {
    id: 'filter-coffee',
    categoryId: 'coffee',
    name: 'Filtre Kahve',
    description: 'Günün seçkisi, V60 ile demlenir.',
    price: 85,
    isAvailable: true,
  },
  {
    id: 'earl-grey',
    categoryId: 'tea',
    name: 'Earl Grey',
    description: 'Bergamot aromalı klasik siyah çay.',
    price: 55,
    isAvailable: true,
  },
  {
    id: 'croissant',
    categoryId: 'bakery',
    name: 'Tereyağlı Kruvasan',
    description: 'Günlük taze pişen, çıtır kruvasan.',
    price: 75,
    isAvailable: true,
  },
];

export const mockLocations: Location[] = [
  {
    id: 'kadikoy',
    name: 'Scald Kadıköy',
    address: 'Moda Cd. No:1, Kadıköy / İstanbul',
    lat: 40.9877,
    lng: 29.0271,
    phone: '+90 216 000 00 00',
    openingHours: 'Her gün 08:00 - 22:00',
  },
  {
    id: 'besiktas',
    name: 'Scald Beşiktaş',
    address: 'Barbaros Blv. No:1, Beşiktaş / İstanbul',
    lat: 41.0431,
    lng: 29.0073,
    phone: '+90 212 000 00 00',
    openingHours: 'Her gün 08:00 - 22:00',
  },
];

export const mockLoyaltySummary: LoyaltySummary = {
  points: 240,
  tier: 'Kahve Sever',
  nextTierAt: 500,
};

export const mockPromotions: Promotion[] = [
  {
    id: 'promo-second-coffee',
    title: 'İkinci Kahve Yarı Fiyatına',
    body: 'Bugün ilk kahveni al, ikincisini yarı fiyatına keyifle iç.',
    startsAt: null,
    endsAt: null,
  },
  {
    id: 'promo-loyalty-double',
    title: 'Bu Hafta Puanlar 2 Katı',
    body: 'Sadakat programı üyeleri bu hafta yaptıkları her alışverişte 2 kat puan kazanır.',
    startsAt: null,
    endsAt: null,
  },
];
