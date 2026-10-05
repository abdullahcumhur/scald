# Scald Coffee — Mobil Uygulama

Scald Coffee müşterileri için Expo (React Native + TypeScript, expo-router)
ile yazılmış mobil uygulama. Genel proje bağlamı için bkz.
[`../ROADMAP.md`](../ROADMAP.md); backend şeması için
[`../backend/supabase/`](../backend/supabase/).

## Kurulum

```bash
cd mobile
npm install
cp .env.example .env   # ve kendi Supabase bilgilerinizi girin
npx expo start
```

Çıktıda çıkan QR kodu telefonunuzda **Expo Go** uygulamasıyla okutarak
uygulamayı gerçek cihazınızda anında test edebilirsiniz (mağazaya yüklemeye
gerek yok). `w` tuşuna basarak tarayıcıda da açabilirsiniz.

### Ortam değişkenleri

`.env.example` dosyasını referans alın; `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` değerleri Supabase Dashboard → Project
Settings → API'den alınır. `.env` dosyası `.gitignore`'dadır, commit
edilmez.

### Typecheck ve lint

```bash
npx tsc --noEmit
npx eslint .
```

## Web önizleme (Render)

Uygulamanın web çıktısı (`app.json`'da `web.output: "static"`) tamamen
statik dosyalar ürettiği için bir **Static Site** olarak deploy edilebilir —
tarayıcıdan açılabilen bir link verir, ekranları gezip test edebilirsiniz.

> **Önemli:** Bu sadece bir **önizleme**dir, gerçek yayın kanalı değildir.
> Harita (react-native-maps native-only, web'de placeholder gösterir) ve
> push bildirimleri (web'de token alınamaz) gibi native-only özellikler
> web'de çalışmaz/sınırlıdır. Tam deneyim için Expo Go veya gerçek bir
> build (EAS) gerekir.

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Static
   Site** → bu GitHub reposunu seçin.
2. **Root Directory**: `mobile`
3. **Build Command**: `npm install && npx expo export --platform web`
4. **Publish Directory**: `dist`
5. Environment Variables:
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://zhotyrulimzkyoceaawi.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_CqU2NYvIOPMDGmbwtoMo1w_jD0cl9R0`
6. **Deploy** — birkaç dakika içinde bir URL verir (ör.
   `https://scald-mobile-preview.onrender.com`).

Repoda bir `render.yaml` (Blueprint) de hazır — **New → Blueprint** ile bu
adımları otomatik kurar, ayrıca alt sayfalara (`/menu`, `/profil` vb.)
doğrudan/yenileme ile gidildiğinde çalışması için gerekli rewrite
kurallarını da içerir (Expo'nun statik export'u her route için ayrı bir
`.html` dosyası üretir, ör. `/menu.html`).

## Yapı

```
mobile/
  src/
    app/
      _layout.tsx        → Stack (auth gate) + (tabs) grubu + order-history
      (tabs)/             → NativeTabs ile gösterilen 5 sekme
        index.tsx          → Ana Sayfa (öne çıkanlar, kampanyalar, puan)
        menu.tsx            → Menü (kategori/ürün, sepete ekleme)
        locations.tsx        → Şubeler (harita + liste + fotoğraf)
        cart.tsx              → Sepet / aktif sipariş takibi
        profile.tsx            → Profil (puan QR'ı, sipariş geçmişi, çıkış)
      order-history.tsx   → Geçmiş siparişler (tab değil, push edilen ekran)
    components/           → Paylaşılan UI bileşenleri (ThemedText/View, auth ekranı, harita)
    lib/                  → Supabase client, auth/cart context'leri
    hooks/                → Supabase veri çekme hook'ları, push token kaydı
    data/mock.ts           → Supabase yapılandırılmadığında kullanılan demo veri
    constants/theme.ts      → Marka renkleri (scaldcoffee.com'dan), spacing, fontlar
```

## Marka varlıkları

Gerçek logo ve şube fotoğrafları `assets/images/brand/` altındadır
(scaldcoffee.com'dan alınmıştır). App icon/splash/favicon bu logodan
üretilmiştir — logo bir "wordmark" olduğundan küçük ikon boyutlarında
okunabilirliği sınırlıdır; ayrı bir kare amblem tasarlanırsa
`assets/images/icon.png` ve ilgili Android/splash dosyaları güncellenebilir.
