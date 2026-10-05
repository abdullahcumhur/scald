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

// scaldcoffee.com'dan alınan gerçek şube bilgileri (fotoğraflar Supabase
// Storage'daki "location-photos" bucket'ında barındırılıyor).
const LOCATION_PHOTOS_BASE =
  'https://zhotyrulimzkyoceaawi.supabase.co/storage/v1/object/public/location-photos';

export const mockLocations: Location[] = [
  {
    id: 'akcakoca',
    name: 'Scald Akçakoca',
    address: 'Osmaniye, Atatürk Cd., 81650 Akçakoca/Düzce',
    lat: 41.0896633,
    lng: 31.1302742,
    phone: '+90 545 956 31 45',
    openingHours: 'Çalışma saatleri için şubeyi arayınız',
    imageUrl: `${LOCATION_PHOTOS_BASE}/location-akcakoca.jpg`,
  },
  {
    id: 'wolf-garden',
    name: 'Scald Wolf Garden',
    address: 'Değirmen ağzı mevki, Hacı Yusuflar, Susam Sk. No: 5, 81650 Akçakoca/Düzce',
    lat: 41.0820551,
    lng: 31.1009379,
    phone: '+90 545 956 31 45',
    openingHours: 'Çalışma saatleri için şubeyi arayınız',
    imageUrl: `${LOCATION_PHOTOS_BASE}/location-wolf-garden.jpg`,
  },
  {
    id: 'yeldegirmeni',
    name: 'Scald Kadıköy Yeldeğirmeni',
    address: 'Rasimpaşa, Karakolhane Cd. No:30, 34716 Kadıköy/İstanbul',
    lat: 40.9945132,
    lng: 29.0298494,
    phone: '+90 545 956 31 45',
    openingHours: 'Çalışma saatleri için şubeyi arayınız',
    imageUrl: `${LOCATION_PHOTOS_BASE}/location-yeldegirmeni.jpg`,
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
