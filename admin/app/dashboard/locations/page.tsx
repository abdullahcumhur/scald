"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Location } from "@/lib/database.types";

type FormState = {
  id: string | null;
  name: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
  opening_hours: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  address: "",
  lat: "",
  lng: "",
  phone: "",
  opening_hours: "",
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchLocations() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLocations((data ?? []) as Location[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await fetchLocations();
    }
    run();
  }, []);

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(location: Location) {
    setForm({
      id: location.id,
      name: location.name,
      address: location.address ?? "",
      lat: location.lat != null ? String(location.lat) : "",
      lng: location.lng != null ? String(location.lng) : "",
      phone: location.phone ?? "",
      opening_hours: location.opening_hours
        ? JSON.stringify(location.opening_hours, null, 2)
        : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let openingHours: unknown = null;
    if (form.opening_hours.trim()) {
      try {
        openingHours = JSON.parse(form.opening_hours);
      } catch {
        setError('"Çalışma saatleri" geçerli bir JSON olmalı, örn: {"mon_sun": "08:00-22:00"}');
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      lat: form.lat.trim() ? Number(form.lat) : null,
      lng: form.lng.trim() ? Number(form.lng) : null,
      phone: form.phone.trim() || null,
      opening_hours: openingHours,
    };

    const { error: saveError } = form.id
      ? await supabase.from("locations").update(payload).eq("id", form.id)
      : await supabase.from("locations").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    await fetchLocations();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu şubeyi silmek istediğinize emin misiniz?")) return;
    const { error: deleteError } = await supabase.from("locations").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchLocations();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Şubeler</h1>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Yeni şube
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="font-medium text-neutral-900">
            {form.id ? "Şubeyi düzenle" : "Yeni şube"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Ad</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Telefon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Adres</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Enlem (lat)</label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Boylam (lng)</label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">
                Çalışma saatleri (JSON)
              </label>
              <textarea
                value={form.opening_hours}
                onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                rows={3}
                placeholder='{"mon_sun": "08:00-22:00"}'
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
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
      ) : locations.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz şube yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Ad</th>
                <th className="px-4 py-2 font-medium">Adres</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 text-neutral-900">{location.name}</td>
                  <td className="px-4 py-2 text-neutral-600">{location.address ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600">{location.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => openEditForm(location)}
                      className="mr-3 text-neutral-600 hover:text-neutral-900"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
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
