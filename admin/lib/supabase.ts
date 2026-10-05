// Scald Coffee admin panel — Supabase client.
//
// Not: Next.js'te tarayıcıya açık ("public") env değişkenleri
// `NEXT_PUBLIC_` prefix'i ister. Bu, mobile/ (Expo) tarafındaki
// `EXPO_PUBLIC_` prefix'inden farklıdır — karıştırmayın.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Build zamanında (env değişkenleri henüz yoksa) sessizce geçiyoruz,
  // ama tarayıcıda kullanılmaya çalışılırsa net bir hata fırlatıyoruz.
  if (typeof window !== "undefined") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY env değişkenleri eksik. " +
        "Bkz. admin/README.md ve admin/.env.local.example."
    );
  }
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key"
);
