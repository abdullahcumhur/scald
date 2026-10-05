# Scald Coffee — Admin Panel

Scald Coffee kafesi için basit bir iç admin paneli. Çalışanlar bu panel
üzerinden menü (kategori/ürün), şube ve kampanya içeriğini yönetir, kasada da
müşteri sadakat puanı girer. Next.js (App Router, TypeScript) + Tailwind CSS +
Supabase ile yazılmıştır.

Genel proje bağlamı için bkz. [`../ROADMAP.md`](../ROADMAP.md). Veritabanı
şeması ve RLS/yetkilendirme modeli için bkz.
[`../backend/supabase/`](../backend/supabase/).

## Kurulum

```bash
cd admin
npm install
```

### Ortam değişkenleri

`.env.local.example` dosyasını kopyalayıp `.env.local` olarak kaydedin ve
kendi Supabase projenizin değerleriyle doldurun:

```bash
cp .env.local.example .env.local
```

Gerekli değerler **Supabase Dashboard → Project Settings → API** sayfasında
bulunur:

- `NEXT_PUBLIC_SUPABASE_URL` → "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → "anon public" API key
- `SUPABASE_SERVICE_ROLE_KEY` → "service_role" key (**gizli**, bkz. aşağıda)

> **Not:** Next.js'te tarayıcıya açık env değişkenleri `NEXT_PUBLIC_` prefix'i
> ister. Bu, `mobile/` (Expo) tarafındaki `EXPO_PUBLIC_` prefix'inden
> farklıdır — iki projeye de env eklerken bu farkı karıştırmayın.
>
> `.env.local` dosyası `.gitignore`'dadır ve commit edilmemelidir.

#### `SUPABASE_SERVICE_ROLE_KEY` neden gerekli?

`push_tokens` tablosunda RLS, kullanıcının sadece kendi token'ını görmesine
izin verir — admin için bir "tüm satırları gör" politikası yoktur (bkz.
`backend/supabase/migrations/0001_init.sql`). Kampanya bildirimini **tüm**
kayıtlı kullanıcılara göndermek için RLS'i bypass edip `push_tokens`
tablosunun tamamını okumak gerekir; bu yüzden `app/api/send-notification`
route'u, normal (anon) `lib/supabase.ts` client'ı yerine `SUPABASE_SERVICE_ROLE_KEY`
ile oluşturulmuş `lib/supabase-admin.ts` client'ını kullanır.

Bu key **tüm RLS politikalarını bypass eder** ve asla tarayıcıya
sızdırılmamalıdır — bilerek `NEXT_PUBLIC_` prefix'i taşımaz, böylece Next.js
onu client bundle'ına dahil etmez. `lib/supabase-admin.ts` sadece server-side
kod (API route'lar) içinde import edilmelidir.

### Geliştirme sunucusunu çalıştırma

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini açın — oturum
yoksa otomatik olarak `/login`'e yönlendirilirsiniz.

### Typecheck ve lint

```bash
npx tsc --noEmit
npm run lint
```

(Next.js 16 ile birlikte `next lint` komutu kaldırıldı; `npm run lint` artık
doğrudan `eslint`'i çalıştırır.)

## İlk admin kullanıcısını oluşturma

`profiles.is_admin` varsayılan olarak `false`'tur ve panelden kendini admin
yapma yolu yoktur (bilinçli bir güvenlik kararı). İlk admin kullanıcısını
Supabase SQL Editor'dan elle işaretlemeniz gerekir — adımlar için bkz.
[`../backend/supabase/README.md`](../backend/supabase/README.md), "İlk admin
kullanıcısını oluşturma" bölümü. Özetle:

1. Önce bu panelden (veya mobil uygulamadan) normal şekilde e-posta/şifre ile
   kayıt olun — bu otomatik olarak bir `profiles` satırı oluşturur.
2. Supabase Dashboard → SQL Editor'da çalıştırın:
   ```sql
   update public.profiles set is_admin = true where id =
     (select id from auth.users where email = 'admin@scaldcoffee.com');
   ```
3. Bu kullanıcı artık admin panelde giriş yapabilir.

## Yapı

```
admin/
  app/
    login/page.tsx            → e-posta + şifre girişi, is_admin kontrolü
    dashboard/
      layout.tsx               → üst menü + client-side oturum/admin koruması
      page.tsx                 → ana sayfa (kartlar)
      categories/page.tsx      → kategori CRUD
      products/page.tsx        → ürün CRUD (kategori seçimi dropdown ile)
      locations/page.tsx       → şube CRUD (opening_hours JSON textarea)
      promotions/page.tsx      → kampanya CRUD (tarih aralığı) + push bildirimi gönderme
    api/
      send-notification/route.ts → kampanyayı tüm kayıtlı mobil kullanıcılara
                                    Expo push bildirimi olarak gönderen route handler
  lib/
    supabase.ts                → Supabase client (NEXT_PUBLIC_* env değişkenleri, browser)
    supabase-admin.ts          → Supabase service-role client (SERVER-ONLY, RLS bypass)
    database.types.ts          → tablo tipleri (categories, products, ...)
    useRequireAdmin.ts         → /dashboard/* için client-side oturum/admin hook'u
```

## Auth akışı

- Giriş `supabase.auth.signInWithPassword` ile yapılır.
- Girişten hemen sonra `profiles.is_admin` sorgulanır; `false`/`null` ise
  "Bu hesabın admin yetkisi yok" mesajı gösterilir ve `signOut()` çağrılır.
- `true` ise `/dashboard`'a yönlendirilir.
- `/dashboard/*` altındaki tüm sayfalar `app/dashboard/layout.tsx` içindeki
  `useRequireAdmin()` hook'u ile korunur: oturum yoksa veya kullanıcı admin
  değilse otomatik olarak `/login`'e yönlendirilir. Bu bir iç admin aracı
  olduğundan ağır bir SSR/middleware kurulumu yerine basit bir client-side
  kontrol tercih edilmiştir.
- Tüm veri yazma işlemleri (CRUD, puan girişi), Supabase RLS politikalarıyla
  zaten sunucu tarafında da `is_admin()` kontrolünden geçer (bkz.
  `backend/supabase/migrations/0002_admin_and_loyalty.sql`) — panel tarafındaki
  kontrol sadece UX içindir, gerçek güvenlik RLS'dedir.

## Sadakat puanı girişi

`/dashboard/loyalty` sayfası `loyalty_transactions` tablosuna
`(user_id, points, type, note)` ile bir satır ekler. `profiles.loyalty_points`
alanı **manuel güncellenmez** — insert sonrası veritabanındaki
`apply_loyalty_transaction` trigger'ı bunu otomatik yapar. Panel, işlem
başarılı olduktan sonra müşterinin güncel puanını görmek için `profiles`
tablosunu tekrar sorgular.

Müşteri User ID'si şimdilik elle (UUID olarak) girilir; ileride mobil
uygulamada bu bir QR kod olarak gösterilecek ve panel QR okutarak dolduracak
şekilde genişletilebilir.

## Yayına alma (Render)

Panel Render'da standart bir Node **Web Service** olarak çalışır (`npm run
build` → `npm run start`) — **Static Site OLARAK ÇALIŞMAZ**, çünkü
`app/api/*` altında server-side route'lar (bildirim gönderme, sipariş durumu
bildirimi) var; Static Site sadece dosya sunar, sunucu kodu çalıştırmaz.
Render'ın "Free" planı hem Web Service hem Static Site için mevcuttur, yani
ücretsiz kalmak için Static Site seçmenize gerek yok — doğru seçim Web
Service + Free plan. Repoda bir `render.yaml` (Blueprint) hazır, `plan: free`
olarak ayarlı:

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
   → bu GitHub reposunu seçin. Render, `admin/render.yaml`'ı otomatik bulur
   ve doğru servis tipini (Web Service) + ücretsiz planı kendisi kurar
   (repo kökünde değil `admin/` altında olduğu için "Root Directory" alanını
   `admin` olarak ayarlamanız gerekebilir — Blueprint sihirbazında sorulur).
   - *Blueprint yerine elle "New → Web Service" ile kurarsanız:* Root
     Directory `admin`, Build Command `npm install && npm run build`, Start
     Command `npm run start`, Instance Type **Free** seçin.
2. Servis oluşturulurken `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` ortam
   değişkenlerini girin (Supabase Dashboard → Project Settings → API'den
   alınır, bkz. yukarıdaki "Ortam değişkenleri" bölümü).
3. İlk deploy birkaç dakika sürer; bittiğinde `https://scald-admin.onrender.com`
   gibi bir URL verir.
4. **Free plan notu:** 15 dakika kullanılmayınca servis uyur, sıradaki istek
   ~30-60 saniye gecikmeli açılır. Günlük sık kullanılan bir araç için bu
   can sıkıcıysa ileride ücretli Starter plana geçilebilir — ama başlangıç
   için Free tamamen yeterli.

### Kendi domaininize bağlama

Bir domaininiz varsa (ör. `scaldcoffee.com`), admin paneli için bir alt alan
adı kullanmanızı öneririz (ör. `admin.scaldcoffee.com`) — ana siteyle
karışmaz ve ayrı bir DNS kaydıyla yönetilir:

1. Render'da servise gidin → **Settings** → **Custom Domains** → **Add
   Custom Domain** → `admin.scaldcoffee.com` girin.
2. Render size bir CNAME hedefi verir (ör. `scald-admin.onrender.com`).
3. Domaininizi yönettiğiniz DNS sağlayıcısında (ör. Namecheap, GoDaddy,
   Cloudflare) şu kaydı ekleyin:
   ```
   Tip: CNAME
   Ad/Host: admin
   Değer: scald-admin.onrender.com
   ```
4. DNS yayılması genelde birkaç dakika–birkaç saat sürer. Render SSL
   sertifikasını otomatik sağlar.
