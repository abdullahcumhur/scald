// Scald Coffee admin panel — sipariş durumu değiştiğinde siparişi veren
// kullanıcıya hedefli push bildirimi gönderme endpoint'i.
//
// Akış:
//   1. İsteğin `Authorization: Bearer <access_token>` header'ındaki Supabase
//      access token'ı doğrulanır (supabaseAdmin.auth.getUser), aynı
//      `app/api/send-notification/route.ts` ile aynı admin doğrulama
//      deseniyle.
//   2. `orders` tablosundan `orderId` ile sipariş çekilir (`user_id`,
//      `status`, `pickup_code`).
//   3. `status`'a göre Türkçe bildirim metni oluşturulur. `pending` ve
//      `completed` için bildirim gönderilmez.
//   4. `push_tokens` tablosundan bu kullanıcıya ait TÜM token'lar (service
//      role client ile, RLS bypass edilerek) çekilir.
//   5. `sendExpoPushNotifications` ile gönderilir.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendExpoPushNotifications } from "@/lib/expo-push";
import type { OrderStatus } from "@/lib/database.types";

type NotifyOrderStatusBody = {
  orderId?: unknown;
};

const NOTIFIABLE_MESSAGES: Partial<
  Record<OrderStatus, (pickupCode: string) => { title: string; body: string }>
> = {
  preparing: () => ({
    title: "Siparişin Hazırlanıyor",
    body: "Scald Coffee'de siparişin hazırlanmaya başlandı.",
  }),
  ready: (pickupCode) => ({
    title: "Siparişin Hazır! ☕",
    body: `Teslim kodun: ${pickupCode}. Kasada bu kodu söyleyerek siparişini alabilirsin.`,
  }),
  cancelled: () => ({
    title: "Siparişin İptal Edildi",
    body: "Siparişinle ilgili bir sorun oldu, lütfen şubeyle iletişime geçin.",
  }),
};

export async function POST(request: Request) {
  try {
    // --- 1. Admin doğrulaması ---------------------------------------------
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

    // --- Body doğrulaması ---------------------------------------------------
    const body = (await request.json()) as NotifyOrderStatusBody;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json({ error: "orderId gerekli." }, { status: 400 });
    }

    // --- 2. Siparişi çek -----------------------------------------------------
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("user_id, status, pickup_code")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    // --- 3. Durum metnini oluştur ---------------------------------------------
    const buildMessage = NOTIFIABLE_MESSAGES[order.status as OrderStatus];
    if (!buildMessage) {
      return NextResponse.json({ sent: 0, skipped: true });
    }

    const { title, body: message } = buildMessage(order.pickup_code);

    // --- 4. Bu kullanıcıya ait push token'ları çek (service role, RLS bypass) --
    const { data: tokenRows, error: tokensError } = await supabaseAdmin
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_id", order.user_id);

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }

    const tokens = (tokenRows ?? [])
      .map((row) => row.expo_push_token)
      .filter((token): token is string => typeof token === "string" && token.length > 0);

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // --- 5. Expo Push API'sine gönder -----------------------------------------
    const { sent, failed } = await sendExpoPushNotifications(tokens, title, message);

    return NextResponse.json({ sent, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
