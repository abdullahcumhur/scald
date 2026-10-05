# Scald Coffee — Mobil Uygulama Yol Haritası

> Kaynak: https://scaldcoffee.com/ (marka, fotoğraf ve içerik referansı)
> Durum: Faz 0, Faz 1, Faz 2, Faz 2.5 tamamlandı. Faz 3 büyük ölçüde tamamlandı (segment bazlı gönderim hariç). Kahve damga kartı (bkz. §2.3) planın önüne alınıp uygulandı. Faz 4 henüz başlanmadı.

## 1. Kapsam (bu aşamada karar verilen)

- **Platform / Stack:** React Native (Expo) + TypeScript — tek kod tabanından iOS ve Android.
- **Backend:** Sıfırdan, Supabase (Postgres + Auth + Storage + Realtime) üzerine kurulacak.
- **Giriş yöntemi:** E-posta + şifre (Supabase Auth).
- **İçerik yönetimi:** Basit bir admin panel (`admin/`) — çalışanlar menü/şube/kampanya içeriğini ve sadakat puanlarını buradan yönetecek. Yetkilendirme `profiles.is_admin` alanı ile RLS üzerinden sağlanıyor (bkz. `backend/supabase/migrations/0002_admin_and_loyalty.sql`).
- **Kapsam dışı (şimdilik):** Uygulama içi online sipariş ve ödeme. İleride ayrı bir faz olarak eklenebilir.
- **Kapsam içi özellikler:**
  1. Fotoğraflı menü (kategoriler, ürünler, fiyatlar)
  2. Sadakat programı / puan sistemi (kasada QR okutma)
  3. Şube bulucu + harita + push bildirimler (kampanya/duyuru)
  4. Basit admin paneli (menü/şube/kampanya CRUD + puan girişi)

## 2. Rakip Uygulama Analizi (Starbucks, Kahve Dünyası, Coffy)

Türkiye ve global pazardaki üç farklı kahve zinciri uygulamasını inceledik. Özet:

| Uygulama | Sadakat Modeli | Sipariş | Dikkat Çeken Diğer Özellikler |
|---|---|---|---|
| **Starbucks** | "Stars" — 2 yıldız/$ (kart/app ile), 1 yıldız/$ (kart ile). 2 kademe: Green (300 yıldıza kadar) → Gold. Doğum günü ödülü, kademeli harcama (60/100/200/300/400 yıldız) | Order Ahead: sepete ekle, öde, mağazada sıra beklemeden al | Kişiselleştirilmiş "Double Star Days", satın alma geçmişine göre öneriler, dijital cüzdan (ön yüklemeli kart) |
| **Kahve Dünyası** | "Çekirdek" puanı (1 çekirdek ≈ 1 TL), ayrıca damga kartı (6 damga = 1 kahve). Kasada QR okutarak kazanılıyor | "Hazır Al": uygulamadan sepete ekle, şubeye vardığında teslim numarasını söyle, sırasız teslim al | Şube detayı (oturma planı, otopark, wifi durumu), hediye gönderme (başka birine kahve hediye etme), kişiye özel indirimler |
| **Coffy** | Her 5 siparişte 1 ücretsiz kahve veya 2 çekirdek/sipariş, 7 çekirdek = 1 kahve | "Beklemeden Al": sepete ekle, ne zaman teslim alacağını seç (X dakika/saat sonra), mağazaya yaklaşırken sipariş ver | Tek fiyat modeli (marka konumlandırması), planlanan abonelik modeli (aylık sabit ücretle sınırsız kahve) |

**Scald için çıkarımlar:**

1. **"Sırasız teslim al" (order-ahead/pickup) her üç uygulamada da merkezi özellik.** Şu an kapsam dışı bıraktığımız "online sipariş/ödeme" olmadan da hafif bir versiyonu uygulanabilir: kullanıcı sepete ekler, şubeye "rezervasyon" olarak gönderir, ödemeyi mağazada yapar. Bu, ödeme altyapısı kurmadan da büyük bir UX kazancı sağlar — **Faz 2.5 olarak roadmap'e eklenmesini öneririz** (bkz. Faz listesi).
2. **QR kod ile puan kazanma (Kahve Dünyası modeli) bizim "sıfırdan backend" kararımızla en uyumlu yöntem** — POS entegrasyonu gerektirmiyor, kasiyer müşterinin uygulamasındaki QR'ı okutuyor. Zaten Faz 2'de bunu planlamıştık, bu analiz kararı doğruluyor.
3. **Damga kartı (6 al 1 kazan) basit ve anlaşılır bir alternatif/ek gamification katmanı** — puan sistemine ek olarak düşünülebilir, kullanıcı için daha somut bir hedef oluşturuyor. **[x] Uygulandı** — `profiles.coffee_stamps`/`free_coffees` + `coffee_stamp_transactions` (bkz. `0008_coffee_stamps.sql`), harcama tutarından tamamen bağımsız: her kahvede 1 damga, 6 damgada 1 ücretsiz kahve + push bildirimi. Admin panelde "Sadakat Puanı" sayfasının altında ayrı bir "Kahve Damgası" bölümü var, mobilde ana sayfada dairesel bir ilerleme göstergesi (bkz. `mobile/src/components/coffee-stamp-card.tsx`).
4. **Şube detay bilgisi (wifi, otopark, oturma alanı)** — `locations` tablosuna ucuz bir `amenities jsonb` alanı eklenerek kolayca desteklenebilir, kullanıcı deneyimini güçlendirir.
5. **Doğum günü ödülü + davranışsal kişiselleştirme (Starbucks)** — `profiles` tablosuna `birthday` alanı eklenip `promotions`/push bildirim akışıyla birleştirilebilir, düşük maliyetli yüksek etkili bir dokunuş.
6. **Hediye gönderme ve abonelik modeli** ilginç farklılaştırıcılar ama ödeme altyapısı + daha karmaşık iş mantığı gerektiriyor — **backlog'a ileri faz adayı olarak eklendi.**

## 3. Mimarinin genel hatları

```
mobile/            → Expo (React Native + TypeScript) uygulaması
  app/              → ekranlar (expo-router)
  components/
  lib/
    supabase.ts     → Supabase client
  assets/           → scaldcoffee.com'dan alınan logo/fotoğraflar
backend/
  supabase/
    migrations/     → tablo şemaları
    seed.sql        → menü + şube başlangıç verisi
```

### Veri modeli (taslak Supabase tabloları)

| Tablo | Amaç | Önemli alanlar |
|---|---|---|
| `categories` | Menü kategorileri (Kahve, Çay, Tatlı...) | id, name, sort_order |
| `products` | Menü ürünleri | id, category_id, name, description, price, image_url, is_available |
| `locations` | Şubeler | id, name, address, lat, lng, phone, opening_hours (jsonb), image_url — `amenities jsonb` (wifi/otopark/oturma) henüz eklenmedi, aşağıdaki "sonraki faz adayları"na taşındı |
| `profiles` | Kullanıcı profili (Supabase Auth'a bağlı) | id, full_name, phone, loyalty_points, is_admin, coffee_stamps, free_coffees — `birthday` henüz eklenmedi |
| `loyalty_transactions` | Puan kazanım/harcama geçmişi (harcama tutarına bağlı) | id, user_id, points, type (earn/redeem), note, created_at |
| `coffee_stamp_transactions` | Kahve damgası geçmişi (harcama tutarından bağımsız, kahve adedine göre) | id, user_id, type (stamp/redeem_free_coffee), note, created_at |
| `orders` / `order_items` | "Sırasız Teslim Al" rezervasyonları (Faz 2.5) | orders: id, user_id, location_id, status, pickup_code, requested_minutes, total_amount — order_items: order_id, product_name, unit_price, quantity (sipariş anındaki snapshot) |
| `promotions` | Kampanya/duyuru içerikleri | id, title, body, image_url, starts_at, ends_at |
| `push_tokens` | Cihaz push token'ları | id, user_id, expo_push_token |

## 4. Fazlar

### Faz 0 — Hazırlık (1 hafta)
- [x] scaldcoffee.com üzerinden marka varlıklarını toplama: logo, renk paleti, fontlar, şube fotoğrafları, şube adres/telefon, sosyal medya linki
  - Gerçek logo (`mobile/assets/images/brand/scald-logo.png`), marka rengi (`#140A61` lacivert/indigo — logo mürekkep rengi, `theme.ts`'e işlendi), fontlar (Cormorant Garamond başlıklar için, Manrope gövde metni için — **uygulamaya tamamen entegre edildi**: tüm ekranlar artık bu marka diliyle yeniden tasarlandı), 3 gerçek şube (Akçakoca, Wolf Garden, Kadıköy Yeldeğirmeni — adres/telefon/koordinat/fotoğraf ile, Supabase'de canlı), scaldcoffee.com ve Instagram'dan alınan ek mekan/ortam fotoğrafları (ana sayfa galerisi + header background), Instagram (@scald.coffee), e-posta (info@scaldcoffee.com) alındı.
  - App icon/splash/favicon gerçek logo ile güncellendi. **Not:** Logo bir "wordmark" (yazı tipi logosu), ayrı bir kare ikon/amblem yok — küçük boyutlarda (telefon ana ekranı) okunabilirliği sınırlı olabilir. İsterseniz sadece "C" amblemini kullanan ayrı bir app icon tasarlatabiliriz.
  - Sitede ürün/menü fiyat listesi bulunmuyor (API'leri boş döndü) — menü içeriği hâlâ placeholder, gerçek menü için ya admin panelden siz girersiniz ya da bana ürün/fiyat listesini iletirsiniz.
- [x] Expo projesinin iskeletinin kurulması (TypeScript, expo-router, ESLint/Prettier)
- [x] Supabase projesinin açılması, `.env` ve bağlantı yapılandırması
- [x] Marka renkleri/tipografinin belirlenmesi (gerçek logo renginden)

### Faz 1 — MVP: Menü + Şube Bulucu (2-3 hafta) ✅ tamamlandı
- [x] Supabase şeması: `categories`, `products`, `locations` + seed data
- [x] Ana sayfa: öne çıkan ürünler / kampanya banner'ı
- [x] Menü ekranı: kategori sekmeleri, ürün kartları (foto, isim, fiyat)
  - [ ] **Ürün detay sayfası — henüz yok.** Menüdeki bir ürüne dokununca ayrı bir detay ekranı açılmıyor, sadece listede gösteriliyor.
- [x] Şubeler ekranı: liste + harita görünümü (react-native-maps), "yol tarifi al" butonu — Google Maps API key tanımlı değilse artık kırık harita yerine zarif bir "Harita yakında" mesajı gösteriyor (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` ayarlanmalı)
- [x] Temel tasarım sistemi: renkler, tipografi, bileşen kütüphanesi (buton, kart, header) — tüm ekranlara uygulandı
- [ ] iOS/Android'de test, TestFlight / Internal Testing track kurulumu — **henüz yapılmadı**, bkz. Açık Sorular #4

### Faz 2 — Sadakat Programı (2 hafta) ✅ tamamlandı
- [x] Supabase Auth ile kullanıcı kayıt/giriş (e-posta + şifre)
- [x] `profiles` ve `loyalty_transactions` tabloları + puan kazanma kuralı (kasada QR kod okutma)
- [x] QR kod tarama ekranı (admin panelde kamera ile, `admin/app/dashboard/loyalty/page.tsx`)
- [x] Puan geçmişi ve bakiye gösterimi (profil ekranı) — ayrı bir kademe/tier ekranı yok, basit bakiye gösterimi var
- [x] Profil ekranı (ad, puan bakiyesi, QR kod, geçmiş siparişler linki)
- [x] **Bakiye negatife düşemez** — DB seviyesinde CHECK constraint + admin panelde önceden bakiye kontrolü (`0006_loyalty_guard.sql`)

### Faz 2.5 — "Sırasız Teslim Al" (1-2 hafta) ✅ tamamlandı
- [x] Sepete ürün ekleme akışı (ödeme yok — sadece "mağazada hazırlansın" rezervasyonu)
- [x] Şube seçimi + tahmini hazır olma süresi seçimi (10/20/30 dk)
- [x] Sipariş durumu ekranı (bekliyor/hazırlanıyor/hazır) ve admin'den push bildirimi
- [x] Teslim numarası/kodu üretimi (4 haneli `pickup_code`)
- [x] Sipariş oluşturma **atomik** hale getirildi (`create_order` RPC, `0007_atomic_order_creation.sql`) — eskiden sipariş kalemleri eklenirken hata olursa "hayalet" bir sipariş kalıp kullanıcıyı kilitliyordu, artık tek transaction
- [ ] *Not:* Ödeme hâlâ mağazada nakit/kart ile; gerçek ödeme entegrasyonu Faz 5+ kapsamında (değişmedi).

### Faz 2.6 — Kahve Damgası (plansız eklendi, §2'deki rakip analizine dayanıyor) ✅ tamamlandı
- [x] `coffee_stamps`/`free_coffees` alanları + `coffee_stamp_transactions` tablosu (`0008_coffee_stamps.sql`) — puan sisteminden tamamen bağımsız, harcama tutarına değil kahve adedine bağlı
- [x] Admin panelde ayrı "Kahve Damgası" bölümü: +1 damga ekle, (hak varsa) ücretsiz kahveyi kullan
- [x] 6. damgada otomatik push bildirimi ("1 Kahve Bizden! 🎉")
- [x] Mobilde ana sayfada dairesel ilerleme göstergesi (X/6)

### Faz 3 — Bildirimler ve Kampanyalar (1-2 hafta) — büyük ölçüde tamamlandı
- [x] Expo Push Notifications kurulumu, `push_tokens` kaydı
- [x] `promotions` tablosu + admin panelden kampanya girme ve gönderme
- [x] Bildirim izinleri akışı (`mobile/src/app/notification-settings.tsx`) + cihaz üzerinde bildirim geçmişi
- [ ] Segment bazlı gönderim (opsiyonel — örn. sadece belirli şubeye yakın kullanıcılar) — **hâlâ yapılmadı**, şu an tüm kampanyalar tüm kullanıcılara gidiyor

### Faz 4 — Cilalama ve Yayın (1-2 hafta) — henüz başlanmadı
- [ ] Onboarding / splash ekranları, boş durum (empty state) tasarımları
- [ ] Erişilebilirlik ve performans kontrolü
- [ ] App Store Connect + Google Play Console kayıtları, mağaza görselleri/metinleri — bkz. Açık Sorular #4
- [ ] Analytics (ör. PostHog/Amplitude) ve hata takibi (Sentry) entegrasyonu
- [ ] Yayına alma ve mağaza inceleme süreci
- [x] *Ek olarak tamamlandı (planda yoktu):* web preview (`mobile/render.yaml`) artık gerçek bir PWA — Chrome'da "Yükle" istemi çıkıyor, standalone açılıyor (bkz. `mobile/public/manifest.json`). Gerçek mağaza yayınının yerine geçmiyor, sadece web üzerinden hızlı önizleme/tanıtım için.

## 5. Sonraki faz adayları (kapsam dışı, ileride değerlendirilebilir)
- Uygulama içi tam sipariş + ödeme (Iyzico/Stripe gibi bir sağlayıcı ile)
- Hediye gönderme (başka bir kullanıcıya ürün hediye etme) — bkz. Rakip Analizi
- Abonelik modeli (aylık sabit ücretle sınırsız/indirimli kahve) — bkz. Rakip Analizi
- Masaya/Gel-al QR sipariş akışı
- **Ürün detay sayfası** (Faz 1'de planlanmıştı, henüz yapılmadı — bkz. Faz 1)
- Favoriler — profil menüsünde bir satır olarak duruyor ama şu an işlevsiz (dokununca hiçbir şey olmuyor), ileride gerçek bir favoriler listesine bağlanmalı
- Şube detay bilgisi: `locations.amenities` (wifi/otopark/oturma alanı) — §2'de önerilmişti, henüz eklenmedi
- Doğum günü ödülü: `profiles.birthday` + kampanya/push akışı — §2'de önerilmişti, henüz eklenmedi
- Çoklu dil desteği (TR/EN)

## 6. Açık sorular

**Karara bağlananlar:**
1. ~~Sadakat puanları nasıl kazanılacak?~~ → Kasada admin panel üzerinden müşterinin QR'ı (user id) okutularak/girilerek `loyalty_transactions` tablosuna kayıt düşülür, `profiles.loyalty_points` otomatik güncellenir (bkz. `0002_admin_and_loyalty.sql`).
2. ~~Kullanıcı girişi için telefon mu e-posta mı?~~ → E-posta + şifre.
3. ~~İçerik yönetimi?~~ → Basit admin panel (`admin/`).

4. ~~"Sırasız teslim al" (Faz 2.5) için: mağaza ödeme noktasıyla nasıl entegre olacağız?~~ → Uygulama sadece teslim kodu üretiyor (`pickup_code`), kasada sözlü teyit ediliyor; POS/kasa entegrasyonu yok, ödeme tamamen mağazada manuel yapılıyor. Faz 2.5 bu haliyle tamamlandı, POS entegrasyonu istenirse ayrı bir faz olarak ele alınmalı.

**Hâlâ açık:**
5. App Store / Play Store hesapları mevcut mu, yoksa yeni mi açılacak? (Faz 4'e kadar netleşmesi yeterli.) Google Maps için de ayrıca bir API key gerekiyor (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, Google Cloud Console'dan alınmalı).
6. Admin panel için ayrı bir "personel" hesabı modeli mi (tüm admin'ler her şeyi yapabilir), yoksa roller mi olsun (ör. sadece puan girebilen kasiyer vs. menü düzenleyebilen yönetici)? Şimdilik tek `is_admin` bayrağıyla basit tutuldu, ileride gerekirse rollere bölünebilir.
7. Kahve damgası (Faz 2.6) eşiği şu an sabit **6** olarak kodlandı (`coffee_stamps` 0-5 arası, 6.'da sıfırlanıp 1 ücretsiz kahve). İleride farklı şubeler/kampanyalar için değişken bir eşik istenirse, bu sabit değer admin'den ayarlanabilir bir alana taşınmalı.

## 7. Tahmini toplam süre
Faz 0–4 (+ Faz 2.5) toplamda yaklaşık **9-12 hafta** (tek geliştirici, yarı zamanlı ilerlemeye göre değişebilir).

---
_Bu doküman proje ilerledikçe güncellenecektir._
