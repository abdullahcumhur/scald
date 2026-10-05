-- Scald Coffee — örnek/başlangıç verisi
-- mobile/src/data/mock.ts dosyasındaki geçici mock veriyle tutarlı tutulmuştur,
-- böylece ileride mock veriden gerçek Supabase'e geçiş sorunsuz olur.
-- Not: scaldcoffee.com'a bu ortamdan erişim yok; adres/telefon/koordinatlar
-- gerçekçi ama placeholder değerlerdir (bkz. ROADMAP.md Faz 0 notu).

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'Kahve', 1),
  ('22222222-2222-2222-2222-222222222222', 'Çay', 2),
  ('33333333-3333-3333-3333-333333333333', 'Fırın', 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- products — fotoğraflar "product-photos" bucket'ına yüklendikten sonra
-- image_url o public URL'leri referans alır (bkz. README "Ürün fotoğraflarını
-- yükleme"). Flat White/Cortado/Brownie scaldcoffee.com'dan alınan gerçek
-- ürün fotoğraflarıyla eşleşir; diğerleri henüz fotoğrafsız placeholder.
-- ---------------------------------------------------------------------------
insert into public.products (id, category_id, name, description, price, image_url, is_available) values
  (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Espresso',
    'Yoğun ve aromatik tek shot espresso.',
    65.00,
    null,
    true
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Flat White',
    'Mikroköpüklü süt ile dengeli espresso.',
    95.00,
    null,
    true
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Cortado',
    'Küçük bardakta, espresso ile sütün dengeli buluşması.',
    80.00,
    null,
    true
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Filtre Kahve',
    'Günün seçkisi, V60 ile demlenir.',
    85.00,
    null,
    true
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Earl Grey',
    'Bergamot aromalı klasik siyah çay.',
    55.00,
    null,
    true
  ),
  (
    'a7777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    'Brownie',
    'Bol çikolatalı, kendi imalathanemizde günlük hazırlanan brownie.',
    90.00,
    null,
    true
  )
on conflict (id) do update set
  name = excluded.name, description = excluded.description, price = excluded.price;

-- ---------------------------------------------------------------------------
-- locations — scaldcoffee.com'dan alınan gerçek şube bilgileri
-- (fotoğraflar 0004_location_photos.sql'deki "location-photos" bucket'ına
-- yüklendikten sonra image_url burada o public URL'leri referans alır)
-- ---------------------------------------------------------------------------
insert into public.locations (id, name, address, lat, lng, phone, opening_hours, image_url) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'Scald Akçakoca',
    'Osmaniye, Atatürk Cd., 81650 Akçakoca/Düzce',
    41.0896633,
    31.1302742,
    '+90 545 956 31 45',
    '{"info": "Çalışma saatleri için şubeyi arayınız"}'::jsonb,
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Scald Wolf Garden',
    'Değirmen ağzı mevki, Hacı Yusuflar, Susam Sk. No: 5, 81650 Akçakoca/Düzce',
    41.0820551,
    31.1009379,
    '+90 545 956 31 45',
    '{"info": "Çalışma saatleri için şubeyi arayınız"}'::jsonb,
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Scald Kadıköy Yeldeğirmeni',
    'Rasimpaşa, Karakolhane Cd. No:30, 34716 Kadıköy/İstanbul',
    40.9945132,
    29.0298494,
    '+90 545 956 31 45',
    '{"info": "Çalışma saatleri için şubeyi arayınız"}'::jsonb,
    null
  )
on conflict (id) do update set
  name = excluded.name, address = excluded.address, lat = excluded.lat, lng = excluded.lng,
  phone = excluded.phone, opening_hours = excluded.opening_hours;

-- Not: image_url değerleri seed.sql dosyasında null bırakılmıştır çünkü dosya
-- yolları Storage'a yükleme sırasında projeye özeldir (bkz. backend/supabase/README.md
-- "Şube fotoğraflarını yükleme" bölümü). Mevcut canlı projede bu alanlar
-- Management API ile ayrıca güncellenmiştir.

-- ---------------------------------------------------------------------------
-- promotions (örnek kampanya)
-- ---------------------------------------------------------------------------
insert into public.promotions (id, title, body, image_url, starts_at, ends_at) values
  (
    'c1111111-1111-1111-1111-111111111111',
    'Sonbahar Kampanyası',
    'Ekim ayı boyunca tüm filtre kahvelerde %10 indirim.',
    null,
    now(),
    now() + interval '30 days'
  )
on conflict (id) do nothing;

-- Not: profiles / loyalty_transactions / push_tokens tabloları auth.users'a
-- bağlı olduğundan (ve handle_new_user trigger'ı ile otomatik oluştuğundan)
-- buraya örnek kullanıcı verisi eklenmemiştir. Test için Supabase Auth
-- üzerinden bir kullanıcı oluşturduktan sonra ilgili tablolara veri eklenebilir.
