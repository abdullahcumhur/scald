"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LoyaltyTransactionType, Profile } from "@/lib/database.types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function LoyaltyPage() {
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [type, setType] = useState<LoyaltyTransactionType>("earn");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultProfile, setResultProfile] = useState<Profile | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResultProfile(null);

    const trimmedUserId = userId.trim();
    if (!UUID_RE.test(trimmedUserId)) {
      setError("Müşteri User ID geçerli bir UUID olmalı.");
      return;
    }

    const pointsValue = Number(points);
    if (!Number.isInteger(pointsValue) || pointsValue <= 0) {
      setError("Puan pozitif bir tam sayı olmalı.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("loyalty_transactions").insert({
      user_id: trimmedUserId,
      points: pointsValue,
      type,
      note: note.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // loyalty_transactions insert'ine bağlı trigger (apply_loyalty_transaction,
    // bkz. backend/supabase/migrations/0002_admin_and_loyalty.sql) profiles.loyalty_points'i
    // otomatik günceller — burada sadece güncel değeri tekrar okuyoruz.
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", trimmedUserId)
      .single<Profile>();

    if (profileError) {
      setError(
        `İşlem kaydedildi ama müşteri profili okunamadı: ${profileError.message}`
      );
      setSubmitting(false);
      return;
    }

    setResultProfile(profileRow);
    setPoints("");
    setNote("");
    setSubmitting(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Sadakat Puanı</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Kasada müşterinin User ID&apos;sini girip puan kazandırın veya harcayın.
        İleride mobil uygulamada bu bir QR kod olarak gösterilecek; şimdilik
        manuel UUID girişi yeterli.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-sm text-neutral-700">Müşteri User ID</label>
          <input
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ör. 123e4567-e89b-12d3-a456-426614174000"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-700">Puan</label>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-700">İşlem</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LoyaltyTransactionType)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="earn">Kazandır</option>
              <option value="redeem">Harca</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-700">Not (opsiyonel)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ör. Sipariş #1234"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Kaydediliyor..." : "İşlemi Kaydet"}
        </button>
      </form>

      {resultProfile && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            İşlem kaydedildi. {resultProfile.full_name ?? "Müşteri"}&apos;nin güncel puanı:
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-900">
            {resultProfile.loyalty_points}
          </p>
        </div>
      )}
    </div>
  );
}
