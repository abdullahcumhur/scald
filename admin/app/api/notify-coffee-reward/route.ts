// Scald Coffee admin panel — kahve damgası 6'ya ulaşıp bir ücretsiz kahve
// kazanıldığında müşteriye hedefli push bildirimi gönderme endpoint'i.
//
// Akış (app/api/notify-order-status/route.ts ile aynı admin doğrulama
// desenini kullanır, tek farkı siparişe değil doğrudan `userId`'ye bağlı
// olması):
//   1. İsteğin `Authorization: Bearer <access_token>` header'ındaki Supabase
//      access token'ı doğrulanır (supabaseAdmin.auth.getUser).
//   2. Token'ı doğrulayan kullanıcının profiles.is_admin olduğu kontrol edilir.
//   3. `push_tokens` tablosundan bu kullanıcıya ait TÜM token'lar (service
//      role client ile, RLS bypass edilerek) çekilir.
//   4. `sendExpoPushNotifications` ile sabit kutlama mesajı gönderilir.
//
// Admin panel tarafı (app/dashboard/loyalty/page.tsx), coffee_stamp_transactions'a
// 'stamp' tipinde bir insert sonrası profiles.coffee_stamps 0'a yuvarlanıp
// free_coffees arttıysa (bkz. backend/supabase/migrations/0008_coffee_stamps.sql
// içindeki apply_coffee_stamp_transaction() trigger'ı) bu endpoint'i
// fire-and-forget çağırır — notifyOrderStatus (app/dashboard/orders/page.tsx)
// ile aynı non-blocking desen.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendExpoPushNotifications } from "@/lib/expo-push";

type NotifyCoffeeRewardBody = {
  userId?: unknown;
};

const COFFEE_REWARD_TITLE = "1 Kahve Bizden! 🎉";
const COFFEE_REWARD_BODY =
  "6 kahve içtin, 1 kahve ücretsiz kazandın! Bir sonraki ziyaretinde kullanabilirsin.";

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

    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (adminProfileError || !adminProfile?.is_admin) {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gerekiyor." },
        { status: 403 }
      );
    }

    // --- Body doğrulaması ---------------------------------------------------
    const body = (await request.json()) as NotifyCoffeeRewardBody;
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
    }

    // --- 2. Bu kullanıcıya ait push token'ları çek (service role, RLS bypass) --
    const { data: tokenRows, error: tokensError } = await supabaseAdmin
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_id", userId);

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }

    const tokens = (tokenRows ?? [])
      .map((row) => row.expo_push_token)
      .filter((token): token is string => typeof token === "string" && token.length > 0);

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // --- 3. Expo Push API'sine gönder -----------------------------------------
    const { sent, failed } = await sendExpoPushNotifications(
      tokens,
      COFFEE_REWARD_TITLE,
      COFFEE_REWARD_BODY
    );

    return NextResponse.json({ sent, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
