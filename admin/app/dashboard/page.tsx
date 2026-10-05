import Link from "next/link";

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

export default function DashboardHome() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Ana Sayfa</h1>
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
