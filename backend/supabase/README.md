# Scald Coffee — Supabase Backend

Bu dizin, Scald Coffee mobil uygulamasının Supabase (Postgres + Auth) şemasını
içerir. Veri modeli için bkz. [`../../ROADMAP.md`](../../ROADMAP.md).

```
backend/supabase/
  migrations/
    0001_init.sql   → categories, products, locations, profiles,
                      loyalty_transactions, promotions, push_tokens
                      tabloları + index'ler + RLS politikaları +
                      auth.users -> profiles trigger'ı
    0002_admin_and_loyalty.sql → profiles.is_admin, is_admin() helper,
                      admin yazma politikaları (admin/ panelin kullandığı),
                      loyalty_transactions eklendiğinde profiles.loyalty_points'i
                      otomatik güncelleyen trigger
  seed.sql          → örnek menü/şube/kampanya verisi (mobile/src/data/mock.ts
                      ile tutarlı)
```

## Gereksinimler

- [Supabase CLI](https://supabase.com/docs/guides/cli) kurulu olmalı:
  ```bash
  npm install -g supabase
  # veya: brew install supabase/tap/supabase
  ```
- Bir Supabase projesi (https://supabase.com/dashboard üzerinden oluşturulur).

## Seçenek 1: Supabase CLI ile (önerilen)

1. Bu dizinde (ya da repo kökünde, CLI'ın `--workdir` desteğiyle) Supabase
   projesini başlatın/bağlayın. Eğer proje henüz `supabase init` ile
   başlatılmadıysa:

   ```bash
   cd backend
   supabase init
   ```

   > Not: `supabase init` komutu kendi `supabase/` klasör yapısını oluşturur;
   > bu depoda zaten `backend/supabase/migrations` ve `backend/supabase/seed.sql`
   > mevcut olduğundan, `supabase init` sonrası bu dosyaların üzerine
   > yazılmadığından emin olun (gerekirse mevcut dosyaları koruyup birleştirin).

2. Uzak (remote) Supabase projenize bağlanın:

   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

   `<PROJECT_REF>`, Supabase Dashboard'da proje ayarlarında (Project Settings
   → General) bulunan "Reference ID" değeridir.

3. Migration'ları uzak veritabanına uygulayın:

   ```bash
   supabase db push
   ```

   Bu komut `migrations/` klasöründeki henüz uygulanmamış `.sql` dosyalarını
   (burada `0001_init.sql`) sırayla çalıştırır.

4. (Opsiyonel) Örnek/başlangıç verisini yüklemek için `seed.sql` dosyasını
   çalıştırın:

   ```bash
   supabase db execute -f seed.sql
   ```

   Alternatif olarak `psql` ile de çalıştırabilirsiniz (bkz. aşağıdaki
   "Bağlantı bilgisiyle psql" bölümü).

### Yerelde test etmek isterseniz

```bash
supabase start      # yerel Supabase stack'i (Docker) ayağa kaldırır
supabase db reset    # migrations/ + seed.sql'i sıfırdan uygular
```

## Seçenek 2: Supabase Dashboard SQL Editor ile

CLI kurmak istemiyorsanız ya da hızlıca tek seferlik uygulamak isterseniz:

1. [Supabase Dashboard](https://supabase.com/dashboard) üzerinden projenizi
   açın.
2. Sol menüden **SQL Editor**'a gidin, **New query** oluşturun.
3. `migrations/0001_init.sql` dosyasının tüm içeriğini kopyalayıp yapıştırın
   ve **Run** ile çalıştırın.
4. Aynı şekilde `seed.sql` içeriğini yeni bir query olarak çalıştırarak örnek
   veriyi yükleyin.

## Bağlantı bilgisiyle psql

Proje bağlantı dizesini (Project Settings → Database → Connection string)
kullanarak doğrudan `psql` ile de uygulayabilirsiniz:

```bash
psql "<CONNECTION_STRING>" -f migrations/0001_init.sql
psql "<CONNECTION_STRING>" -f seed.sql
```

## Notlar

- `profiles` tablosu `auth.users` tablosuna foreign key ile bağlıdır; yeni bir
  kullanıcı Supabase Auth üzerinden kayıt olduğunda `on_auth_user_created`
  trigger'ı otomatik olarak ilgili `profiles` satırını oluşturur.
- Row Level Security (RLS) tüm tablolarda aktiftir:
  - `categories`, `products`, `locations`, `promotions`: herkese (anon dahil)
    SELECT açık (public menü/şube/kampanya içerikleri).
  - `profiles`, `loyalty_transactions`, `push_tokens`: kullanıcı sadece kendi
    satırlarını görebilir/düzenleyebilir (`auth.uid()` kontrolü).
- `seed.sql`, `mobile/src/data/mock.ts` dosyasındaki geçici mock veriyle aynı
  ürün/şube isimlerini kullanır; ileride mobil uygulama mock veri yerine
  gerçek Supabase bağlantısına geçtiğinde veri tutarlılığı sağlanmış olur.

## İlk admin kullanıcısını oluşturma

`profiles.is_admin` varsayılan olarak `false`'tur ve kendini admin yapma yolu
(bilinçli olarak) yoktur — bootstrap için ilk admin'i SQL Editor'dan elle
işaretlemeniz gerekir:

1. Önce admin panelden veya mobil uygulamadan normal şekilde e-posta/şifre ile
   kayıt olun (bu otomatik olarak bir `profiles` satırı oluşturur).
2. Supabase Dashboard → SQL Editor'da şunu çalıştırın:

   ```sql
   update public.profiles set is_admin = true where id =
     (select id from auth.users where email = 'admin@scaldcoffee.com');
   ```

   (e-postayı kendi admin hesabınızla değiştirin.)

Bundan sonra bu kullanıcı admin panelde giriş yapabilir ve menü/şube/kampanya
içeriğini düzenleyebilir, kasada müşteri QR'ını okutup puan girebilir.
