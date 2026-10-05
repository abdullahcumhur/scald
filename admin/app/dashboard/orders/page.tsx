"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderItem, OrderStatus } from "@/lib/database.types";

// Admin panelde yönetilen siparişler her zaman şu durumlardan birinde:
// pending/preparing/ready. completed veya cancelled olan siparişler listeden
// otomatik düşer (kafe için "yapılacaklar" görünümü).
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Bekliyor",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  completed: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-100 text-red-700",
};

// Her durumdan bir sonraki adıma geçişi tanımlar.
const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "preparing", label: "Hazırlamaya Başla" },
  preparing: { status: "ready", label: "Hazır" },
  ready: { status: "completed", label: "Teslim Edildi" },
};

type OrderWithDetails = Order & {
  locations: { name: string } | null;
  order_items: OrderItem[];
};

const REFRESH_INTERVAL_MS = 15000;

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchOrders(options: { silent?: boolean } = {}) {
    if (!options.silent) setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*, locations(name), order_items(*)")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setOrders((data ?? []) as OrderWithDetails[]);
      setError(null);
    }

    if (!options.silent) setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await fetchOrders();
    }
    run();

    const interval = setInterval(() => {
      fetchOrders({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateError) {
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    await fetchOrders({ silent: true });
    setUpdatingId(null);
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Bu siparişi iptal etmek istediğinize emin misiniz?")) return;
    await handleUpdateStatus(orderId, "cancelled");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Siparişler</h1>
        <p className="text-xs text-neutral-400">Liste her 15 saniyede bir otomatik yenilenir.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">Bekleyen sipariş yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextStep = NEXT_STEP[order.status];
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold tracking-wide text-neutral-900">
                        #{order.pickup_code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[order.status]}`}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {order.locations?.name ?? "Bilinmeyen şube"} · {order.requested_minutes} dk
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-neutral-900">
                      {order.total_amount.toLocaleString("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      })}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                  {order.order_items.map((item) => (
                    <li key={item.id}>
                      {item.product_name} <span className="text-neutral-400">×</span>{" "}
                      {item.quantity}
                    </li>
                  ))}
                </ul>

                {order.note && (
                  <p className="mt-2 text-sm italic text-neutral-500">Not: {order.note}</p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  {nextStep && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, nextStep.status)}
                      disabled={isUpdating}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Güncelleniyor..." : nextStep.label}
                    </button>
                  )}
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={isUpdating}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    İptal Et
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
