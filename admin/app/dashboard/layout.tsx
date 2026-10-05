"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/useRequireAdmin";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/dashboard/categories", label: "Kategoriler" },
  { href: "/dashboard/products", label: "Ürünler" },
  { href: "/dashboard/locations", label: "Şubeler" },
  { href: "/dashboard/promotions", label: "Kampanyalar" },
  { href: "/dashboard/loyalty", label: "Sadakat Puanı" },
  { href: "/dashboard/orders", label: "Siparişler" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, profile } = useRequireAdmin();

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Yükleniyor...
      </div>
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/scald-logo.png"
              alt="Scald Coffee"
              width={130}
              height={40}
              priority
              className="h-8 w-auto"
            />
            <span className="sr-only">Scald Coffee Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span>{profile.full_name ?? "Admin"}</span>
            <button
              onClick={handleSignOut}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-100"
            >
              Çıkış yap
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-neutral-600 transition hover:bg-brand/10 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
