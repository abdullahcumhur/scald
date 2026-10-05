"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SECTIONS = [
  {
    href: "/dashboard/categories",
    title: "Kategoriler",
    description: "Menü kategorilerini (Kahve, Çay, Fırın...) yönet.",
  },
  {
    href: "/dashboard/products",
    title: "Ürünler",
    description: "Ürün adı, fiyat, açıklama, kategori ve stok durumu.",
  },
  {
    href: "/dashboard/locations",
    title: "Şubeler",
    description: "Şube adresleri, konum ve çalışma saatleri.",
  },
  {
    href: "/dashboard/promotions",
    title: "Kampanyalar",
    description: "Duyuru ve kampanya içerikleri, başlangıç/bitiş tarihleri.",
  },
  {
    href: "/dashboard/loyalty",
    title: "Sadakat Puanı",
    description: "Kasada müşteri hesabına puan kazandır veya harca.",
  },
  {
    href: "/dashboard/orders",
    title: "Siparişler",
    description: "Sırasız teslim al siparişlerini hazırla ve teslim et.",
  },
];

type Stats = {
  todayOrders: number | null;
  pendingOrders: number | null;
  totalMembers: number | null;
  activePromotions: number | null;
};

const EMPTY_STATS: Stats = {
  todayOrders: null,
  pendingOrders: null,
  totalMembers: null,
  activePromotions: null,
};

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00Z";
    const nowIso = new Date().toISOString();

    const [todayOrders, pendingOrders, totalMembers, activePromotions] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "preparing", "ready"]),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("promotions")
        .select("*", { count: "exact", head: true })
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`),
    ]);

    setStats({
      todayOrders: todayOrders.count ?? 0,
      pendingOrders: pendingOrders.count ?? 0,
      totalMembers: totalMembers.count ?? 0,
      activePromotions: activePromotions.count ?? 0,
    });
    setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await fetchStats();
    }
    run();
  }, []);

  const STAT_CARDS = [
    { label: "Bugünkü Sipariş", value: stats.todayOrders },
    { label: "Bekleyen Sipariş", value: stats.pendingOrders },
    { label: "Toplam Üye", value: stats.totalMembers },
    { label: "Aktif Kampanya", value: stats.activePromotions },
  ];

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Ana Sayfa</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold text-neutral-900">
              {loading || card.value === null ? "..." : card.value}
            </p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-400 hover:shadow"
          >
            <h2 className="mb-1 font-medium text-neutral-900">{section.title}</h2>
            <p className="text-sm text-neutral-500">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
