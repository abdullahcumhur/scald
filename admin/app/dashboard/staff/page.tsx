"use client";

// Scald Coffee admin panel — personel dizini.
//
// profiles tablosunda email yok (bkz. app/api/staff/route.ts'teki yorum),
// bu yüzden listeleme/ekleme/düzenleme hep service-role endpoint'i
// (/api/staff) üzerinden yapılıyor — normal `supabase` client (anon key) ile
// değil. Şubeler (locations) ise herkese açık SELECT RLS'i olduğu için
// doğrudan normal client ile çekiliyor (diğer sayfalarla aynı desen).
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Location, StaffRole } from "@/lib/database.types";

// API route'un döndürdüğü şekil — database.types.ts'teki Profile'dan farklı
// olarak email içeriyor (auth.users'tan join'lenmiş) ve sadece client'ın
// ihtiyacı olan alanları taşıyor (bkz. app/api/staff/route.ts).
type StaffMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  staff_role: StaffRole | null;
  location_id: string | null;
  is_active: boolean;
};

type FormState = {
  email: string;
  staffRole: StaffRole;
  locationId: string;
};

const EMPTY_FORM: FormState = {
  email: "",
  staffRole: "cashier",
  locationId: "",
};

const ROLE_LABEL: Record<StaffRole, string> = {
  cashier: "Kasiyer",
  manager: "Yönetici",
  owner: "Sahip",
};

const ROLE_BADGE_CLASS: Record<StaffRole, string> = {
  cashier: "bg-blue-100 text-blue-800",
  manager: "bg-purple-100 text-purple-800",
  owner: "bg-amber-100 text-amber-800",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function authHeader(): Promise<Record<string, string>> {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      throw new Error("Oturum bulunamadı, lütfen yeniden giriş yapın.");
    }
    return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
  }

  async function fetchStaff() {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/staff", { headers });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Personel listesi alınamadı.");
      setStaff(body.staff as StaffMember[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchLocations() {
    const { data, error: fetchError } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLocations((data ?? []) as Location[]);
    }
  }

  useEffect(() => {
    async function run() {
      await Promise.all([fetchStaff(), fetchLocations()]);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locationName(locationId: string | null) {
    if (!locationId) return "—";
    return locations.find((l) => l.id === locationId)?.name ?? "—";
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      email: member.email ?? "",
      staffRole: member.staff_role ?? "cashier",
      locationId: member.location_id ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const headers = await authHeader();

      if (editingId) {
        // Düzenleme: e-posta değiştirilemez (hesap değişmiyor, sadece
        // rol/şube güncelleniyor) — bkz. PATCH /api/staff.
        const res = await fetch("/api/staff", {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            userId: editingId,
            staffRole: form.staffRole,
            locationId: form.locationId || null,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Personel güncellenemedi.");
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: form.email.trim(),
            staffRole: form.staffRole,
            locationId: form.locationId || null,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Personel eklenemedi.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(member: StaffMember) {
    setBusyId(member.id);
    setError(null);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId: member.id, isActive: !member.is_active }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Durum güncellenemedi.");
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(member: StaffMember) {
    if (
      !confirm(
        `${member.full_name ?? member.email ?? "Bu kişinin"} personel yetkisini tamamen kaldırmak istediğinize emin misiniz? Bu kişi artık panele giriş yapamayacak.`
      )
    ) {
      return;
    }

    setBusyId(member.id);
    setError(null);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId: member.id, staffRole: null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Personel yetkisi kaldırılamadı.");
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Personel</h1>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Personel Ekle
        </button>
      </div>

      <p className="mb-4 text-sm text-neutral-500">
        Personel eklemek, o kişinin mobil uygulamadan zaten kayıtlı bir hesabı
        olmasını gerektirir — buradan yeni hesap oluşturulmaz, var olan bir
        müşteri hesabı e-posta ile bulunup personele yükseltilir.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="font-medium text-neutral-900">
            {editingId ? "Personeli düzenle" : "Yeni personel"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">E-posta</label>
              <input
                required
                type="email"
                disabled={!!editingId}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ör. personel@ornek.com"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-500"
              />
              {editingId && (
                <p className="mt-1 text-xs text-neutral-400">
                  Düzenlemede e-posta değiştirilemez.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Rol</label>
              <select
                value={form.staffRole}
                onChange={(e) => setForm({ ...form, staffRole: e.target.value as StaffRole })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="cashier">Kasiyer</option>
                <option value="manager">Yönetici</option>
                <option value="owner">Sahip</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Şube</label>
              <select
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Şube seçin (opsiyonel)</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz personel yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Ad</th>
                <th className="px-4 py-2 font-medium">E-posta</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Şube</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 text-neutral-900">{member.full_name ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600">{member.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    {member.staff_role ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[member.staff_role]}`}
                      >
                        {ROLE_LABEL[member.staff_role]}
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        Rol atanmadı
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{locationName(member.location_id)}</td>
                  <td className="px-4 py-2">
                    {member.is_active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEditForm(member)}
                      disabled={busyId === member.id}
                      className="mr-3 text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleToggleActive(member)}
                      disabled={busyId === member.id}
                      className="mr-3 text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                    >
                      {member.is_active ? "Pasife Al" : "Aktifleştir"}
                    </button>
                    <button
                      onClick={() => handleRevoke(member)}
                      disabled={busyId === member.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Yetkiyi Kaldır
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
