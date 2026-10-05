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
-- products
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
    'a5555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Tereyağlı Kruvasan',
    'Günlük taze pişen, çıtır kruvasan.',
    75.00,
    null,
    true
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------
insert into public.locations (id, name, address, lat, lng, phone, opening_hours) values
  (
    'b1111111-1111-1111-1111-111111111111',
    'Scald Kadıköy',
    'Moda Cd. No:1, Kadıköy / İstanbul',
    40.9877,
    29.0271,
    '+90 216 000 00 00',
    '{"mon_sun": "08:00-22:00"}'::jsonb
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Scald Beşiktaş',
    'Barbaros Blv. No:1, Beşiktaş / İstanbul',
    41.0431,
    29.0073,
    '+90 212 000 00 00',
    '{"mon_sun": "08:00-22:00"}'::jsonb
  )
on conflict (id) do nothing;

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
