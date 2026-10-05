"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Location, Profile } from "@/lib/database.types";

// Şema: backend/supabase/migrations/0011_shifts.sql — şube başına basit vardiya
// planlaması (kim, hangi şubede, hangi saatler arasında). Admin-only; personelin
// kendi vardiyasını gördüğü bir mobil akış yok/planlanmıyor.
type Shift = {
  id: string;
  staff_id: string;
  location_id: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
  created_at: string;
};

type ShiftWithDetails = Shift & {
  profiles: { full_name: Profile["full_name"] } | null;
  locations: { name: Location["name"] } | null;
};

type StaffOption = Pick<Profile, "id" | "full_name" | "staff_role">;

type FormState = {
  staff_id: string;
  location_id: string;
  starts_at: string;
  ends_at: string;
  note: string;
};

function emptyForm(locationId: string): FormState {
  return { staff_id: "", location_id: locationId, starts_at: "", ends_at: "", note: "" };
}

// Haftanın Pazartesi gününü (saat 00:00) döndürür.
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftWeek(weekStart: string, deltaDays: number): string {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toDateInputValue(d);
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const startLabel = start.toLocaleDateString("tr-TR", opts);
  const endLabel = end.toLocaleDateString("tr-TR", { ...opts, year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export default function ShiftsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [weekStart, setWeekStart] = useState(() => toDateInputValue(startOfWeek(new Date())));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchLocations() {
    const { data, error: fetchError } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const rows = (data ?? []) as Location[];
    setLocations(rows);
    setSelectedLocationId((prev) => prev || rows[0]?.id || "");
  }

  async function fetchStaff() {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, staff_role")
      .not("staff_role", "is", null)
      .order("full_name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setStaffOptions((data ?? []) as StaffOption[]);
  }

  async function fetchShifts() {
    if (!selectedLocationId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const rangeStart = new Date(`${weekStart}T00:00:00`);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    const { data, error: fetchError } = await supabase
      .from("shifts")
      .select("*, profiles(full_name), locations(name)")
      .eq("location_id", selectedLocationId)
      .gte("starts_at", rangeStart.toISOString())
      .lt("starts_at", rangeEnd.toISOString())
      .order("starts_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setShifts((data ?? []) as ShiftWithDetails[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await Promise.all([fetchLocations(), fetchStaff()]);
    }
    run();
  }, []);

  useEffect(() => {
    async function run() {
      await fetchShifts();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, weekStart]);

  function openCreateForm() {
    setForm(emptyForm(selectedLocationId));
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.staff_id || !form.location_id || !form.starts_at || !form.ends_at) {
      setError("Lütfen tüm gerekli alanları doldurun.");
      setSaving(false);
      return;
    }

    const payload = {
      staff_id: form.staff_id,
      location_id: form.location_id,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      note: form.note.trim() || null,
    };

    const { error: saveError } = await supabase.from("shifts").insert(payload);

    if (saveError) {
      if (
        saveError.code === "23514" ||
        saveError.message.includes("shifts_ends_after_starts")
      ) {
        setError("Bitiş saati başlangıçtan sonra olmalı.");
      } else {
        setError(saveError.message);
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setForm(emptyForm(selectedLocationId));
    await fetchShifts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu vardiyayı silmek istediğinize emin misiniz?")) return;
    const { error: deleteError } = await supabase.from("shifts").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchShifts();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Vardiyalar</h1>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Vardiya Ekle
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-700">Şube</label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-56"
          >
            {locations.length === 0 && <option value="">Şube yok</option>}
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-700">Hafta başlangıcı</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(toDateInputValue(startOfWeek(new Date(`${e.target.value}T00:00:00`))))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => shiftWeek(prev, -7))}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            ← Önceki hafta
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => shiftWeek(prev, 7))}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Sonraki hafta →
          </button>
        </div>

        <p className="ml-auto text-sm text-neutral-500">{formatWeekRange(weekStart)}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="font-medium text-neutral-900">Yeni vardiya</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Personel</label>
              <select
                required
                value={form.staff_id}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Personel seçin</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name ?? "(İsimsiz)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Şube</label>
              <select
                required
                value={form.location_id}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Şube seçin</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Başlangıç</label>
              <input
                required
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Bitiş</label>
              <input
                required
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Not (opsiyonel)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
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
              onClick={() => setShowForm(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : shifts.length === 0 ? (
        <p className="text-sm text-neutral-500">Bu hafta için vardiya yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Personel</th>
                <th className="px-4 py-2 font-medium">Şube</th>
                <th className="px-4 py-2 font-medium">Başlangıç</th>
                <th className="px-4 py-2 font-medium">Bitiş</th>
                <th className="px-4 py-2 font-medium">Not</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 text-neutral-900">
                    {shift.profiles?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{shift.locations?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {new Date(shift.starts_at).toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {new Date(shift.ends_at).toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{shift.note ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
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
