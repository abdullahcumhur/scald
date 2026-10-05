# Scald Coffee — Mobil Uygulama Yol Haritası

> Kaynak: https://scaldcoffee.com/ (marka, fotoğraf ve içerik referansı)
> Durum: Proje henüz başlamadı — bu doküman kapsam ve fazları tanımlar.

## 1. Kapsam (bu aşamada karar verilen)

- **Platform / Stack:** React Native (Expo) + TypeScript — tek kod tabanından iOS ve Android.
- **Backend:** Sıfırdan, Supabase (Postgres + Auth + Storage + Realtime) üzerine kurulacak.
- **Kapsam dışı (şimdilik):** Uygulama içi online sipariş ve ödeme. İleride ayrı bir faz olarak eklenebilir.
- **Kapsam içi özellikler:**
  1. Fotoğraflı menü (kategoriler, ürünler, fiyatlar)
  2. Sadakat programı / puan sistemi
  3. Şube bulucu + harita + push bildirimler (kampanya/duyuru)

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
3. **Damga kartı (6 al 1 kazan) basit ve anlaşılır bir alternatif/ek gamification katmanı** — puan sistemine ek olarak düşünülebilir, kullanıcı için daha somut bir hedef oluşturuyor.
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
| `locations` | Şubeler | id, name, address, lat, lng, phone, opening_hours (jsonb), amenities (jsonb — wifi/otopark/oturma alanı) |
| `profiles` | Kullanıcı profili (Supabase Auth'a bağlı) | id, full_name, phone, birthday, loyalty_points |
| `loyalty_transactions` | Puan kazanım/harcama geçmişi | id, user_id, points, type (earn/redeem), note, created_at |
| `promotions` | Kampanya/duyuru içerikleri | id, title, body, image_url, starts_at, ends_at |
| `push_tokens` | Cihaz push token'ları | id, user_id, expo_push_token |

## 4. Fazlar

### Faz 0 — Hazırlık (1 hafta)
- [ ] scaldcoffee.com üzerinden marka varlıklarını toplama: logo, renk paleti, fontlar, ürün fotoğrafları, şube adres/saatleri, sosyal medya linkleri
  - *Not:* Bu ortamdan siteye doğrudan erişim şu an ağ politikası tarafından engelli. Ya ortam ayarlarından scaldcoffee.com'u izinli domain listesine ekleyip bana tekrar çektirebilirsiniz, ya da içerikleri/fotoğrafları siz paylaşırsınız.
- [ ] Expo projesinin iskeletinin kurulması (TypeScript, expo-router, ESLint/Prettier)
- [ ] Supabase projesinin açılması, `.env` ve bağlantı yapılandırması
- [ ] Figma veya basit bir tasarım referansı ile marka renkleri/tipografinin belirlenmesi

### Faz 1 — MVP: Menü + Şube Bulucu (2-3 hafta)
- [ ] Supabase şeması: `categories`, `products`, `locations` + seed data
- [ ] Ana sayfa: öne çıkan ürünler / kampanya banner'ı
- [ ] Menü ekranı: kategori sekmeleri, ürün kartları (foto, isim, fiyat), ürün detay sayfası
- [ ] Şubeler ekranı: liste + harita görünümü (react-native-maps), "yol tarifi al" butonu
- [ ] Temel tasarım sistemi: renkler, tipografi, bileşen kütüphanesi (buton, kart, header)
- [ ] iOS/Android'de test, TestFlight / Internal Testing track kurulumu

### Faz 2 — Sadakat Programı (2 hafta)
- [ ] Supabase Auth ile kullanıcı kayıt/giriş (telefon veya e-posta)
- [ ] `profiles` ve `loyalty_transactions` tabloları + puan kazanma kuralı (ör. her alışverişte QR kod okutma)
- [ ] QR kod tarama ekranı (kasiyer tarafında puan yükleme senaryosu netleşmeli — bkz. Açık Sorular)
- [ ] Puan geçmişi ve ödül/kademe ekranı
- [ ] Profil ekranı (ad, puan bakiyesi, geçmiş işlemler)

### Faz 2.5 — "Sırasız Teslim Al" (1-2 hafta) — Rakip analizine dayanan yeni öneri
- [ ] Sepete ürün ekleme akışı (ödeme yok — sadece "mağazada hazırlansın" rezervasyonu)
- [ ] Şube seçimi + tahmini hazır olma süresi seçimi (Coffy'deki "X dakika sonra" modeline benzer)
- [ ] Sipariş durumu ekranı (hazırlanıyor / hazır) ve bildirim
- [ ] Teslim numarası/kodu üretimi (kasada sözlü teyit için — Kahve Dünyası'nın "Hazır Al" modeli)
- [ ] *Not:* Ödeme mağazada nakit/kart ile yapılacağı varsayılıyor; gerçek ödeme entegrasyonu Faz 5+ kapsamında.

### Faz 3 — Bildirimler ve Kampanyalar (1-2 hafta)
- [ ] Expo Push Notifications kurulumu, `push_tokens` kaydı
- [ ] `promotions` tablosu + admin tarafından (Supabase Studio veya basit bir panel) kampanya girme
- [ ] Bildirim izinleri akışı, bildirim geçmişi ekranı
- [ ] Segment bazlı gönderim (opsiyonel — örn. sadece belirli şubeye yakın kullanıcılar)

### Faz 4 — Cilalama ve Yayın (1-2 hafta)
- [ ] Onboarding / splash ekranları, boş durum (empty state) tasarımları
- [ ] Erişilebilirlik ve performans kontrolü
- [ ] App Store Connect + Google Play Console kayıtları, mağaza görselleri/metinleri
- [ ] Analytics (ör. PostHog/Amplitude) ve hata takibi (Sentry) entegrasyonu
- [ ] Yayına alma ve mağaza inceleme süreci

## 5. Sonraki faz adayları (kapsam dışı, ileride değerlendirilebilir)
- Uygulama içi tam sipariş + ödeme (Iyzico/Stripe gibi bir sağlayıcı ile)
- Hediye gönderme (başka bir kullanıcıya ürün hediye etme) — bkz. Rakip Analizi
- Abonelik modeli (aylık sabit ücretle sınırsız/indirimli kahve) — bkz. Rakip Analizi
- Masaya/Gel-al QR sipariş akışı
- Favoriler ve geçmiş siparişler
- Çoklu dil desteği (TR/EN)

## 6. Açık sorular
1. Sadakat puanları nasıl kazanılacak? (Kasiyer QR okutması / fiş numarası girme / NFC vb.)
2. Kullanıcı girişi için telefon numarası mı, e-posta mı tercih edilsin?
3. Kampanya/menü içeriğini kim güncelleyecek — basit bir admin panel gerekiyor mu, yoksa Supabase Studio yeterli mi?
4. App Store / Play Store hesapları mevcut mu, yoksa yeni mi açılacak?
5. "Sırasız teslim al" (Faz 2.5) için: mağaza ödeme noktasıyla nasıl entegre olacağız — sadece sepet bilgisini kasada göstermek mi, yoksa kasa/POS ile bir API entegrasyonu mu gerekecek?

## 7. Tahmini toplam süre
Faz 0–4 (+ Faz 2.5) toplamda yaklaşık **9-12 hafta** (tek geliştirici, yarı zamanlı ilerlemeye göre değişebilir).

---
_Bu doküman proje ilerledikçe güncellenecektir._
