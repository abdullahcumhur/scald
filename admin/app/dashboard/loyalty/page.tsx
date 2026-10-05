"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import type { LoyaltyTransactionType, Profile } from "@/lib/database.types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mobil uygulamadaki sadakat QR kodu, kullanıcının Supabase Auth user id'sini
// ham bir UUID string olarak kodluyor (bkz. mobile/src/app/(tabs)/profile.tsx
// içindeki `<QRCode value={user.id} ... />`) — başka bir format/prefix yok.
const QR_READER_ELEMENT_ID = "loyalty-qr-reader";

export default function LoyaltyPage() {
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [type, setType] = useState<LoyaltyTransactionType>("earn");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultProfile, setResultProfile] = useState<Profile | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccessId, setScanSuccessId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Kahve damgası kartı — puan sisteminden tamamen ayrı, aynı taranan/elle
  // girilen `userId`'yi kullanır (bkz. backend/supabase/migrations/0008_coffee_stamps.sql).
  const [coffeeProfile, setCoffeeProfile] = useState<Profile | null>(null);
  const [stampSubmitting, setStampSubmitting] = useState(false);
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);

  // Kamera tarayıcıyı sadece `scanning` true olduğunda başlatıyoruz, ve
  // component unmount olduğunda (ya da `scanning` false'a döndüğünde) her
  // zaman stop/clear çağırıp kamerayı kapatıyoruz.
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;
    const html5Qrcode = new Html5Qrcode(QR_READER_ELEMENT_ID);
    scannerRef.current = html5Qrcode;

    async function run() {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (cancelled) return;
            const trimmed = decodedText.trim();
            if (!UUID_RE.test(trimmed)) {
              setScanError("Geçersiz QR kodu: beklenen UUID formatında değil.");
              return;
            }
            cancelled = true;
            setUserId(trimmed);
            setScanSuccessId(trimmed);
            setScanError(null);
            setScanning(false);
          },
          () => {
            // Her karede QR bulunamadığında tetiklenir, görmezden geliyoruz.
          }
        );
      } catch (err) {
        if (!cancelled) {
          setScanError(
            `Kameraya erişilemedi: ${err instanceof Error ? err.message : String(err)}`
          );
          setScanning(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      scannerRef.current = null;
      if (html5Qrcode.isScanning) {
        html5Qrcode
          .stop()
          .then(() => html5Qrcode.clear())
          .catch(() => {
            // Taramayı durdururken hata olsa da sayfadan ayrılıyoruz, yutuyoruz.
          });
      } else {
        html5Qrcode.clear();
      }
    };
  }, [scanning]);

  // `userId` geçerli bir UUID'ye dönüştüğünde (QR tarandığında ya da elle
  // tam girildiğinde) kahve damgası kartı için müşterinin güncel
  // coffee_stamps/free_coffees'ini otomatik çeker. Puan formunun submit akışından
  // tamamen bağımsız — barista sadece damga eklemek/ücretsiz kahve kullanmak
  // istediğinde puan formuna hiç dokunmayabilir.
  useEffect(() => {
    const trimmed = userId.trim();
    if (!UUID_RE.test(trimmed)) {
      // Girdi henüz tam/geçerli bir UUID değil (ör. kullanıcı elle yazıyor) —
      // bir önceki müşterinin kartını burada temizlemiyoruz (setState'i effect
      // gövdesinde senkron çağırmamak için); yeni bir tarama başladığında
      // startScan() zaten kartı sıfırlıyor.
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", trimmed)
      .single<Profile>()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        setCoffeeProfile(fetchError ? null : data);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function fetchCoffeeProfile(id: string): Promise<Profile | null> {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single<Profile>();

    if (fetchError) {
      setError(fetchError.message);
      return null;
    }
    return data;
  }

  // Kahve damgası 6'ya ulaşıp bir ücretsiz kahve kazanıldığında müşteriye push
  // bildirimi gönderir (fire-and-forget) — notifyOrderStatus
  // (admin/app/dashboard/orders/page.tsx) ile aynı non-blocking desen.
  function notifyCoffeeReward(targetUserId: string) {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) return;

      await fetch("/api/notify-coffee-reward", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: targetUserId }),
      });
    })().catch((err) => console.error("notify-coffee-reward failed", err));
  }

  async function handleAddStamp() {
    const trimmedUserId = userId.trim();
    if (!UUID_RE.test(trimmedUserId)) {
      setError("Müşteri User ID geçerli bir UUID olmalı.");
      return;
    }

    setError(null);
    setStampSubmitting(true);

    const previousFreeCoffees = coffeeProfile?.free_coffees ?? 0;

    const { error: insertError } = await supabase.from("coffee_stamp_transactions").insert({
      user_id: trimmedUserId,
      type: "stamp",
    });

    if (insertError) {
      setError(insertError.message);
      setStampSubmitting(false);
      return;
    }

    // apply_coffee_stamp_transaction() trigger'ı (bkz. 0008_coffee_stamps.sql)
    // coffee_stamps/free_coffees'i otomatik günceller — burada güncel değeri
    // tekrar okuyup, bir rollover (6. damga -> 0'a sıfırlanma + free_coffees++)
    // olup olmadığını anlıyoruz.
    const updatedProfile = await fetchCoffeeProfile(trimmedUserId);
    if (updatedProfile) {
      setCoffeeProfile(updatedProfile);
      if (updatedProfile.coffee_stamps === 0 && updatedProfile.free_coffees > previousFreeCoffees) {
        notifyCoffeeReward(trimmedUserId);
      }
    }

    setStampSubmitting(false);
  }

  async function handleRedeemFreeCoffee() {
    const trimmedUserId = userId.trim();
    if (!UUID_RE.test(trimmedUserId)) {
      setError("Müşteri User ID geçerli bir UUID olmalı.");
      return;
    }

    setError(null);
    setRedeemSubmitting(true);

    const { error: insertError } = await supabase.from("coffee_stamp_transactions").insert({
      user_id: trimmedUserId,
      type: "redeem_free_coffee",
    });

    if (insertError) {
      // ör. profiles_free_coffees_non_negative CHECK constraint'i (müşterinin
      // hiç ücretsiz kahve hakkı yokken bu butona basılmış olması — race condition).
      setError(insertError.message);
      setRedeemSubmitting(false);
      return;
    }

    const updatedProfile = await fetchCoffeeProfile(trimmedUserId);
    if (updatedProfile) {
      setCoffeeProfile(updatedProfile);
    }

    setRedeemSubmitting(false);
  }

  function startScan() {
    setScanError(null);
    setScanSuccessId(null);
    setScanning(true);
    // Yeni bir tarama, yeni bir müşteri demek — önceki müşterinin kahve
    // damgası kartını temizle.
    setCoffeeProfile(null);
  }

  function cancelScan() {
    setScanning(false);
  }

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

    // Müşterinin güncel profilini önceden okuyoruz: "harca" (redeem) işleminde
    // bakiyeyi aşan bir tutar girilmişse formu DB'ye gitmeden reddedebiliriz.
    // Bu sadece bir UX kolaylığı — asıl garanti profiles.loyalty_points üzerindeki
    // CHECK constraint'ten gelir (bkz. backend/supabase/migrations/0006_loyalty_guard.sql),
    // bu kontrol atlansa/bug'lı olsa bile veritabanı bakiyeyi negatife düşürmez.
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", trimmedUserId)
      .single<Profile>();

    if (currentProfileError) {
      setError(`Müşteri profili okunamadı: ${currentProfileError.message}`);
      setSubmitting(false);
      return;
    }

    if (type === "redeem" && pointsValue > currentProfile.loyalty_points) {
      setError(
        `Yetersiz bakiye: müşterinin ${currentProfile.loyalty_points} puanı var, ${pointsValue} puan harcanamaz.`
      );
      setSubmitting(false);
      return;
    }

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
        Müşterinin mobil uygulamadaki sadakat QR kodunu kamerayla tarayarak
        User ID&apos;yi otomatik doldurabilir, ya da elle girebilirsiniz.
      </p>

      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        {!scanning ? (
          <button
            type="button"
            onClick={startScan}
            className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            📷 QR Kodu Tara
          </button>
        ) : (
          <div>
            <div
              id={QR_READER_ELEMENT_ID}
              className="mx-auto w-full max-w-[400px] overflow-hidden rounded-md bg-neutral-900"
            />
            <button
              type="button"
              onClick={cancelScan}
              className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              İptal
            </button>
          </div>
        )}

        {scanError && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {scanError}
          </p>
        )}

        {scanSuccessId && !scanning && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            QR okundu: {scanSuccessId.slice(0, 8)}…
          </p>
        )}
      </div>

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
          className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
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

      {/* Kahve Damgası — mevcut puan sisteminden tamamen ayrı bir mekanik.
          Yukarıdaki QR tarayıcı/userId ile ortak çalışır, kendi formu yok. */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">☕ Kahve Damgası</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Harcanan tutardan bağımsız, ayrı bir sadakat mekaniği: her kahve
          alımında 1 damga eklenir, 6 damgada sayaç sıfırlanır ve müşteri 1
          ücretsiz kahve kazanır.
        </p>

        {coffeeProfile ? (
          <div className="mb-4 space-y-1">
            <p className="text-sm text-neutral-700">
              {coffeeProfile.full_name ?? "Müşteri"}:{" "}
              <span className="font-semibold">{coffeeProfile.coffee_stamps} / 6</span> damga
            </p>
            {coffeeProfile.free_coffees > 0 && (
              <p className="text-sm text-amber-700">
                🎁 {coffeeProfile.free_coffees} ücretsiz kahve hakkı var
              </p>
            )}
          </div>
        ) : (
          <p className="mb-4 text-sm text-neutral-400">
            Yukarıdan müşterinin User ID&apos;sini girin ya da QR&apos;ını okutun.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddStamp}
            disabled={stampSubmitting}
            className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {stampSubmitting ? "Kaydediliyor..." : "☕ Kahve İçti (+1 Damga)"}
          </button>

          {coffeeProfile && coffeeProfile.free_coffees > 0 && (
            <button
              type="button"
              onClick={handleRedeemFreeCoffee}
              disabled={redeemSubmitting}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              {redeemSubmitting ? "Kaydediliyor..." : "🎁 Ücretsiz Kahveyi Kullan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
