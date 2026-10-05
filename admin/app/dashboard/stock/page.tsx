"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Location } from "@/lib/database.types";

// Scald Coffee admin panel — şube bazlı stok/envanter modülü.
// Şema: backend/supabase/migrations/0010_stock.sql
//
// products (menü kalemleri) ile hiçbir ilişkisi yok: burada takip edilen
// "stock_items" kahve çekirdeği, süt, bardak gibi SARF MALZEMELERİ — müşterinin
// sipariş ettiği ürünler değil. quantity, stock_transactions tablosuna atılan
// satırlara bağlı bir trigger (apply_stock_transaction) tarafından otomatik
// güncelleniyor; bu sayfa hiçbir zaman quantity'yi doğrudan update etmiyor —
// "sayım düzeltmesi" (adjustment) dahil her değişiklik bir transaction satırı
// eklenerek yapılıyor.
//
// Bu dosyadaki tipler kasıtlı olarak lokal: admin/lib/database.types.ts bu
// modül için güncellenmedi (aynı checkout'ta eşzamanlı çalışan diğer
// agent'larla çakışmayı önlemek için).

type StockItem = {
  id: string;
  location_id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

type StockTransactionType = "in" | "out" | "adjustment";

type ItemFormState = {
  name: string;
  unit: string;
  location_id: string;
  quantity: string;
  low_stock_threshold: string;
};

const EMPTY_ITEM_FORM: ItemFormState = {
  name: "",
  unit: "adet",
  location_id: "",
  quantity: "0",
  low_stock_threshold: "0",
};

type TxnFormState = {
  stock_item_id: string;
  type: StockTransactionType;
  quantity: string;
  note: string;
};

const EMPTY_TXN_FORM: TxnFormState = {
  stock_item_id: "",
  type: "in",
  quantity: "",
  note: "",
};

export default function StockPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [savingItem, setSavingItem] = useState(false);

  const [showTxnForm, setShowTxnForm] = useState(false);
  const [txnForm, setTxnForm] = useState<TxnFormState>(EMPTY_TXN_FORM);
  const [savingTxn, setSavingTxn] = useState(false);

  async function fetchLocations() {
    const { data, error: fetchError } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Location[];
    setLocations(rows);
    if (rows.length > 0) {
      setSelectedLocationId((prev) => prev || rows[0].id);
    } else {
      // Hiç şube yoksa gösterilecek bir stok listesi de yok.
      setItems([]);
      setLoading(false);
    }
  }

  async function fetchItems(locationId: string) {
    if (!locationId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("stock_items")
      .select("*")
      .eq("location_id", locationId)
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems((data ?? []) as StockItem[]);
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

  useEffect(() => {
    if (!selectedLocationId) return;

    async function run() {
      await fetchItems(selectedLocationId);
    }
    run();
  }, [selectedLocationId]);

  function openCreateItemForm() {
    setItemForm({ ...EMPTY_ITEM_FORM, location_id: selectedLocationId });
    setShowItemForm(true);
  }

  async function handleItemSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingItem(true);
    setError(null);

    const payload = {
      name: itemForm.name.trim(),
      unit: itemForm.unit.trim() || "adet",
      location_id: itemForm.location_id,
      quantity: Number(itemForm.quantity) || 0,
      low_stock_threshold: Number(itemForm.low_stock_threshold) || 0,
    };

    const { error: insertError } = await supabase.from("stock_items").insert(payload);

    if (insertError) {
      setError(insertError.message);
      setSavingItem(false);
      return;
    }

    setSavingItem(false);
    setShowItemForm(false);
    setItemForm(EMPTY_ITEM_FORM);
    await fetchItems(selectedLocationId);
  }

  function openTxnForm(stockItemId?: string) {
    setTxnForm({ ...EMPTY_TXN_FORM, stock_item_id: stockItemId ?? "" });
    setShowTxnForm(true);
  }

  async function handleTxnSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!txnForm.stock_item_id) {
      setError("Bir stok kalemi seçin.");
      return;
    }

    const quantityValue = Number(txnForm.quantity);
    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      setError("Miktar negatif olmayan bir sayı olmalı.");
      return;
    }

    setSavingTxn(true);

    const { error: insertError } = await supabase.from("stock_transactions").insert({
      stock_item_id: txnForm.stock_item_id,
      type: txnForm.type,
      quantity: quantityValue,
      note: txnForm.note.trim() || null,
    });

    if (insertError) {
      // ör. stock_items_quantity_non_negative CHECK constraint'i ('out' işlemi
      // elde olandan fazlasını düşmeye çalıştığında tetiklenir, bkz.
      // backend/supabase/migrations/0010_stock.sql) — net bir Postgres hatası
      // burada doğrudan gösteriliyor.
      setError(insertError.message);
      setSavingTxn(false);
      return;
    }

    // apply_stock_transaction() trigger'ı (bkz. 0010_stock.sql) quantity'yi
    // otomatik güncelledi — listeyi yeniden çekip güncel değeri gösteriyoruz.
    setSavingTxn(false);
    setShowTxnForm(false);
    setTxnForm(EMPTY_TXN_FORM);
    await fetchItems(selectedLocationId);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Stok</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {locations.length === 0 && <option value="">Şube yok</option>}
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openTxnForm()}
            disabled={items.length === 0}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            Stok Hareketi Ekle
          </button>
          <button
            onClick={openCreateItemForm}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
          >
            + Stok Kalemi Ekle
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showItemForm && (
        <form
          onSubmit={handleItemSubmit}
          className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="font-medium text-neutral-900">Yeni stok kalemi</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Ad</label>
              <input
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="ör. Kahve Çekirdeği"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Birim</label>
              <input
                required
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                placeholder="ör. kg, lt, adet"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Şube</label>
              <select
                required
                value={itemForm.location_id}
                onChange={(e) => setItemForm({ ...itemForm, location_id: e.target.value })}
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
              <label className="mb-1 block text-sm text-neutral-700">Başlangıç Miktarı</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Kritik Stok Eşiği</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={itemForm.low_stock_threshold}
                onChange={(e) =>
                  setItemForm({ ...itemForm, low_stock_threshold: e.target.value })
                }
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingItem}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {savingItem ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowItemForm(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {showTxnForm && (
        <form
          onSubmit={handleTxnSubmit}
          className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="font-medium text-neutral-900">Stok hareketi ekle</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Stok Kalemi</label>
              <select
                required
                value={txnForm.stock_item_id}
                onChange={(e) => setTxnForm({ ...txnForm, stock_item_id: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Stok kalemi seçin</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">İşlem Türü</label>
              <select
                value={txnForm.type}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, type: e.target.value as StockTransactionType })
                }
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="in">Giriş (Teslimat)</option>
                <option value="out">Çıkış (Kullanım/Fire)</option>
                <option value="adjustment">Sayım Düzeltmesi</option>
              </select>
              {txnForm.type === "adjustment" && (
                <p className="mt-1 text-xs text-neutral-500">
                  Bu bir mutlak değer ataması: mevcut miktara eklenmez/çıkarılmaz,
                  miktar doğrudan girdiğiniz değere eşitlenir.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Miktar</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={txnForm.quantity}
                onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-neutral-700">Not (opsiyonel)</label>
              <input
                value={txnForm.note}
                onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })}
                placeholder="ör. Tedarikçi teslimatı"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingTxn}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {savingTxn ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowTxnForm(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">Bu şubede henüz stok kalemi yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Ad</th>
                <th className="px-4 py-2 font-medium">Miktar</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.quantity <= item.low_stock_threshold;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-neutral-100 last:border-0 ${isLow ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-2 text-neutral-900">{item.name}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2">
                      {isLow ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                          Kritik Stok
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Yeterli
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => openTxnForm(item.id)}
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        İşlem Ekle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
