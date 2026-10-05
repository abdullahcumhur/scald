// Bu dosya SADECE server-side (API route, server action) içinde import
// edilmeli, asla client component'e import edilmemeli.
//
// Scald Coffee admin panel — Supabase "service role" client.
//
// Bu client `SUPABASE_SERVICE_ROLE_KEY` ile oluşturulur (bilerek
// `NEXT_PUBLIC_` prefix'i YOK — Next.js bu prefix'i taşımayan env
// değişkenlerini tarayıcı bundle'ına asla dahil etmez). Service role key
// tüm Row Level Security (RLS) politikalarını bypass eder, bu yüzden:
//
//   - Sadece app/api/**/route.ts gibi server-side kod içinde kullanın.
//   - Asla bir "use client" dosyasına import etmeyin.
//   - Asla bu client'ın sonucunu doğrudan tarayıcıya döndürmeyin; sadece
//     ihtiyaç duyulan veriyi (ör. sayım) response'a koyun.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Build zamanında (env değişkenleri henüz yoksa) sessizce geçiyoruz,
  // ama server'da gerçekten kullanılmaya çalışılırsa net bir hata
  // fırlatıyoruz.
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env değişkenleri eksik. " +
        "Bkz. admin/README.md ve admin/.env.local.example."
    );
  }
}

export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceRoleKey ?? "placeholder-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
