// Scald Coffee admin panel — kampanya push bildirimi gönderme endpoint'i.
//
// Akış:
//   1. İsteğin `Authorization: Bearer <access_token>` header'ındaki Supabase
//      access token'ı doğrulanır (supabaseAdmin.auth.getUser).
//   2. Doğrulanan kullanıcının `profiles.is_admin` alanı kontrol edilir.
//      (push_tokens tablosunda admin için RLS select-all politikası
//      olmadığından, bu kontrolü service role client ile burada, server-side
//      yapıyoruz — anon/authenticated client ile push_tokens'ın tamamı
//      okunamaz.)
//   3. `push_tokens` tablosundaki TÜM `expo_push_token` değerleri (service
//      role client ile, RLS bypass edilerek) çekilir.
//   4. `sendExpoPushNotifications` ile Expo Push API'sine (tek istekte en
//      fazla 100 mesaj) 100'lük gruplar halinde gönderilir.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendExpoPushNotifications } from "@/lib/expo-push";

type SendNotificationBody = {
  title?: unknown;
  body?: unknown;
};

export async function POST(request: Request) {
  try {
    // --- 1 & 2. Admin doğrulaması ---------------------------------------
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
    const accessToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Yetkilendirme header'ı eksik (Authorization: Bearer <token>)." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş oturum." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gerekiyor." },
        { status: 403 }
      );
    }

    // --- Body doğrulaması -------------------------------------------------
    const body = (await request.json()) as SendNotificationBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.body === "string" ? body.body.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Bildirim başlığı (title) gerekli." }, { status: 400 });
    }

    // --- 3. Tüm push token'ları çek (service role, RLS bypass) ------------
    const { data: tokenRows, error: tokensError } = await supabaseAdmin
      .from("push_tokens")
      .select("expo_push_token");

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }

    const tokens = (tokenRows ?? [])
      .map((row) => row.expo_push_token)
      .filter((token): token is string => typeof token === "string" && token.length > 0);

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0 });
    }

    // --- 4. Expo Push API'sine 100'lük gruplar halinde gönder --------------
    const { sent, failed } = await sendExpoPushNotifications(tokens, title, message);

    return NextResponse.json({ sent, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
