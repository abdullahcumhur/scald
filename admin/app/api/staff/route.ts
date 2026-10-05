// Scald Coffee admin panel — personel dizini (staff directory) endpoint'i.
//
// profiles tablosunda email yok (email Supabase Auth'ta yaşıyor, profiles'ta
// değil) — bu yüzden personel listesini oluşturmak için iki kaynağı birleştirmek
// gerekiyor: supabaseAdmin.auth.admin.listUsers() (id + email) ve
// profiles tablosu (ad/telefon/rol/şube/aktiflik). Bu join'i sadece server-side,
// service role client ile yapabiliriz (bkz. lib/supabase-admin.ts) — bu yüzden
// bu endpoint var.
//
// Admin doğrulama deseni, notify-order-status/notify-coffee-reward route'larıyla
// birebir aynı: Authorization: Bearer <access_token> -> supabaseAdmin.auth.getUser
// -> çağıranın kendi profiles.is_admin'i kontrol edilir.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Profile, StaffRole } from "@/lib/database.types";

type StaffMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  staff_role: StaffRole | null;
  location_id: string | null;
  is_active: boolean;
};

type CreateStaffBody = {
  email?: unknown;
  staffRole?: unknown;
  locationId?: unknown;
};

type UpdateStaffBody = {
  userId?: unknown;
  staffRole?: unknown;
  locationId?: unknown;
  isActive?: unknown;
};

const STAFF_ROLES: StaffRole[] = ["cashier", "manager", "owner"];

// --- Ortak admin doğrulaması -------------------------------------------------
// notify-order-status/route.ts ve notify-coffee-reward/route.ts ile aynı desen
// (bu dosyalar bir ortak helper'a çıkarılmamış, biz de aynı yerleşik deseni
// tekrar ediyoruz — iki ayrı agent'ın eşzamanlı çalıştığı bu checkout'ta
// paylaşılan bir lib dosyası eklemek yerine mevcut konvansiyona uyuyoruz).
async function requireAdmin(
  request: Request
): Promise<{ error: NextResponse } | { error: null }> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const accessToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!accessToken) {
    return {
      error: NextResponse.json(
        { error: "Yetkilendirme header'ı eksik (Authorization: Bearer <token>)." },
        { status: 401 }
      ),
    };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { error: NextResponse.json({ error: "Geçersiz veya süresi dolmuş oturum." }, { status: 401 }) };
  }

  const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (callerProfileError || !callerProfile?.is_admin) {
    return {
      error: NextResponse.json({ error: "Bu işlem için admin yetkisi gerekiyor." }, { status: 403 }),
    };
  }

  return { error: null };
}

// listUsers() sayfa başına en fazla 50 kullanıcı döndürüyor (varsayılan) —
// bu küçük işletme için neredeyse kesinlikle tek sayfa yeterli olacak, ama
// birden fazla sayfa olma ihtimaline karşı tüm sayfaları gezip birleştiriyoruz.
async function listAllAuthUsers(): Promise<Map<string, string | null>> {
  const emailById = new Map<string, string | null>();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      emailById.set(user.id, user.email ?? null);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return emailById;
}

// --- GET: personel dizinini listele ------------------------------------------
// "Personel" olarak is_admin=true VEYA staff_role dolu olan profilleri
// gösteriyoruz (sıradan müşteri profillerini dışarıda bırakıyoruz) — böylece
// henüz bir role atanmamış eski is_admin hesapları da listede görünüp role
// atanabilir, ama müşteri dizini bu endpoint'i şişirmez.
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

    const [emailById, profilesResult] = await Promise.all([
      listAllAuthUsers(),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, staff_role, location_id, is_active, is_admin")
        .or("is_admin.eq.true,staff_role.not.is.null"),
    ]);

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
    }

    const staff: StaffMember[] = (profilesResult.data ?? []).map((profile) => ({
      id: profile.id,
      email: emailById.get(profile.id) ?? null,
      full_name: profile.full_name,
      phone: profile.phone,
      staff_role: (profile.staff_role as StaffRole | null) ?? null,
      location_id: profile.location_id,
      is_active: profile.is_active,
    }));

    return NextResponse.json({ staff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- POST: var olan bir hesabı personele yükselt -----------------------------
// Hesap oluşturmaz — mobil uygulamadan kayıt olmuş, zaten var olan bir
// müşteri hesabını e-posta ile bulup is_admin=true + staff_role atar. Hesap
// oluşturma akışı kasıtlı olarak mobil uygulamanın kendi kayıt akışında kalıyor.
export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

    const body = (await request.json()) as CreateStaffBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const staffRole = typeof body.staffRole === "string" ? (body.staffRole as StaffRole) : null;
    const locationId = typeof body.locationId === "string" && body.locationId ? body.locationId : null;

    if (!email) {
      return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
    }
    if (!staffRole || !STAFF_ROLES.includes(staffRole)) {
      return NextResponse.json(
        { error: "Rol gerekli ve 'cashier', 'manager' veya 'owner' olmalı." },
        { status: 400 }
      );
    }

    const emailById = await listAllAuthUsers();
    let targetUserId: string | null = null;
    for (const [id, userEmail] of emailById.entries()) {
      if (userEmail && userEmail.toLowerCase() === email) {
        targetUserId = id;
        break;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta ile kayıtlı bir hesap bulunamadı. Kullanıcının önce mobil uygulamadan kayıt olması gerekiyor.",
        },
        { status: 404 }
      );
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_admin: true,
        staff_role: staffRole,
        location_id: locationId,
        is_active: true,
      })
      .eq("id", targetUserId)
      .select("id, full_name, phone, staff_role, location_id, is_active, is_admin")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const staffMember: StaffMember = {
      id: updatedProfile.id,
      email,
      full_name: updatedProfile.full_name,
      phone: updatedProfile.phone,
      staff_role: (updatedProfile.staff_role as StaffRole | null) ?? null,
      location_id: updatedProfile.location_id,
      is_active: updatedProfile.is_active,
    };

    return NextResponse.json({ staff: staffMember });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- PATCH: var olan bir personelin rolünü/şubesini/aktifliğini güncelle ----
// staffRole: null gönderilmesi personel statüsünün TAMAMEN geri alınması
// anlamına gelir — bu durumda is_admin de false'a çekilir, sadece etiket
// temizlenmez (aksi halde rol kaldırılmış ama panel erişimi açık kalan bir
// hesap kalırdı).
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

    const body = (await request.json()) as UpdateStaffBody;
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};

    if ("staffRole" in body) {
      if (body.staffRole === null) {
        update.staff_role = null;
        update.is_admin = false;
      } else if (typeof body.staffRole === "string" && STAFF_ROLES.includes(body.staffRole as StaffRole)) {
        update.staff_role = body.staffRole;
      } else {
        return NextResponse.json(
          { error: "staffRole 'cashier', 'manager', 'owner' veya null olmalı." },
          { status: 400 }
        );
      }
    }

    if ("locationId" in body) {
      update.location_id =
        typeof body.locationId === "string" && body.locationId ? body.locationId : null;
    }

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive boolean olmalı." }, { status: 400 });
      }
      update.is_active = body.isActive;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek en az bir alan (staffRole, locationId, isActive) gerekli." },
        { status: 400 }
      );
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("id", userId)
      .select("id, full_name, phone, staff_role, location_id, is_active, is_admin")
      .single<Profile>();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const staffMember: StaffMember = {
      id: updatedProfile.id,
      email: null,
      full_name: updatedProfile.full_name,
      phone: updatedProfile.phone,
      staff_role: updatedProfile.staff_role,
      location_id: updatedProfile.location_id,
      is_active: updatedProfile.is_active,
    };

    return NextResponse.json({ staff: staffMember });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
