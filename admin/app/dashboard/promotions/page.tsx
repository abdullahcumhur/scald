"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Promotion } from "@/lib/database.types";

type FormState = {
  id: string | null;
  title: string;
  body: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  body: "",
  image_url: "",
  starts_at: "",
  ends_at: "",
};

// <input type="datetime-local"> "YYYY-MM-DDTHH:mm" bekler, Postgres timestamptz
// ise ISO string döner — ikisi arasında dönüştürüyoruz.
function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchPromotions() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPromotions((data ?? []) as Promotion[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await fetchPromotions();
    }
    run();
  }, []);

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(promotion: Promotion) {
    setForm({
      id: promotion.id,
      title: promotion.title,
      body: promotion.body ?? "",
      image_url: promotion.image_url ?? "",
      starts_at: toDatetimeLocal(promotion.starts_at),
      ends_at: toDatetimeLocal(promotion.ends_at),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      body: form.body.trim() || null,
      image_url: form.image_url.trim() || null,
      starts_at: fromDatetimeLocal(form.starts_at),
      ends_at: fromDatetimeLocal(form.ends_at),
    };

    const { error: saveError } = form.id
      ? await supabase.from("promotions").update(payload).eq("id", form.id)
      : await supabase.from("promotions").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    await fetchPromotions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
    const { error: deleteError } = await supabase.from("promotions").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchPromotions();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Kampanyalar</h1>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Yeni kampanya
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
            {form.id ? "Kampanyayı düzenle" : "Yeni kampanya"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Başlık</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Metin</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Görsel URL</label>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Başlangıç</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Bitiş</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
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
      ) : promotions.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz kampanya yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Başlık</th>
                <th className="px-4 py-2 font-medium">Başlangıç</th>
                <th className="px-4 py-2 font-medium">Bitiş</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 text-neutral-900">{promotion.title}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {promotion.starts_at
                      ? new Date(promotion.starts_at).toLocaleString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {promotion.ends_at
                      ? new Date(promotion.ends_at).toLocaleString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => openEditForm(promotion)}
                      className="mr-3 text-neutral-600 hover:text-neutral-900"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
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
