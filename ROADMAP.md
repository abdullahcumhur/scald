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

## 2. Mimarinin genel hatları

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
| `locations` | Şubeler | id, name, address, lat, lng, phone, opening_hours (jsonb) |
| `profiles` | Kullanıcı profili (Supabase Auth'a bağlı) | id, full_name, phone, loyalty_points |
| `loyalty_transactions` | Puan kazanım/harcama geçmişi | id, user_id, points, type (earn/redeem), note, created_at |
| `promotions` | Kampanya/duyuru içerikleri | id, title, body, image_url, starts_at, ends_at |
| `push_tokens` | Cihaz push token'ları | id, user_id, expo_push_token |

## 3. Fazlar

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

## 4. Sonraki faz adayları (kapsam dışı, ileride değerlendirilebilir)
- Uygulama içi sipariş + ödeme (Iyzico/Stripe gibi bir sağlayıcı ile)
- Masaya/Gel-al QR sipariş akışı
- Favoriler ve geçmiş siparişler
- Çoklu dil desteği (TR/EN)

## 5. Açık sorular
1. Sadakat puanları nasıl kazanılacak? (Kasiyer QR okutması / fiş numarası girme / NFC vb.)
2. Kullanıcı girişi için telefon numarası mı, e-posta mı tercih edilsin?
3. Kampanya/menü içeriğini kim güncelleyecek — basit bir admin panel gerekiyor mu, yoksa Supabase Studio yeterli mi?
4. App Store / Play Store hesapları mevcut mu, yoksa yeni mi açılacak?

## 6. Tahmini toplam süre
Faz 0–4 toplamda yaklaşık **7-10 hafta** (tek geliştirici, yarı zamanlı ilerlemeye göre değişebilir).

---
_Bu doküman proje ilerledikçe güncellenecektir._
