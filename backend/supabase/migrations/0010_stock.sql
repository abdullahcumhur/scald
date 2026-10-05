-- Scald Coffee — şube bazlı stok/envanter takibi
--
-- Buraya kadar products (müşterinin sipariş ettiği menü kalemleri) hiçbir
-- stok/malzeme kavramına sahip değildi. Sahibin istediği bu modül ise farklı
-- bir katman: kahve çekirdeği, süt, bardak gibi SARF MALZEMELERİNİN şube
-- başına miktar takibi — teslimatla artan, kullanım/fire ile azalan, ve
-- azaldığında görünür şekilde uyarı veren bir envanter.
--
-- stock_items / products tamamen ayrı ve birbirinden habersiz: bir stock_item
-- hiçbir product'a bağlı değil (ör. "süt" tek bir stok kalemi iken birden
-- çok üründe kullanılıyor olabilir, ama bu migration'da ürün-malzeme
-- reçetesi/tüketim ilişkisi kurulmuyor — sadece ham stok seviyesi).
--
-- Desen: loyalty_transactions -> profiles.loyalty_points (0001_init.sql +
-- 0002_admin_and_loyalty.sql) ve coffee_stamp_transactions ->
-- profiles.coffee_stamps (0008_coffee_stamps.sql) ile birebir aynı
-- "ledger tablosu + running-total kolonunu güncelleyen trigger" deseni.

-- ---------------------------------------------------------------------------
-- stock_items — şube başına stok kalemi (ör. "Kahve Çekirdeği", "Süt", "Bardak")
-- ---------------------------------------------------------------------------
create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  unit text not null default 'adet',
  quantity numeric(10, 2) not null default 0,
  low_stock_threshold numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_items_location_id_idx on public.stock_items (location_id);

-- quantity hiçbir zaman negatife düşmemeli (ör. elde olmayan sütü "kullanım"
-- olarak düşmeye çalışmak gibi bir veri hatası). 0006_loyalty_guard.sql'deki
-- "bakiye kontrolü veritabanı seviyesinde garanti edilsin" felsefesiyle aynı:
-- apply_stock_transaction() trigger'ı zaten `quantity = quantity - ...`
-- çalıştırdığından, bu CHECK ihlal edildiğinde Postgres net bir hata fırlatır
-- ve ihlale sebep olan stock_transactions insert'i transactional olarak
-- tamamen geri alınır.
alter table public.stock_items drop constraint if exists stock_items_quantity_non_negative;
alter table public.stock_items
  add constraint stock_items_quantity_non_negative check (quantity >= 0);

drop trigger if exists set_updated_at on public.stock_items;
create trigger set_updated_at
  before update on public.stock_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stock_transactions — loyalty_transactions/coffee_stamp_transactions ile aynı
-- şekle sahip, ayrı bir audit/ledger tablosu
-- ---------------------------------------------------------------------------
create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(10, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stock_transactions_stock_item_id_idx on public.stock_transactions (stock_item_id);

-- ---------------------------------------------------------------------------
-- stock_transactions eklendiğinde stock_items.quantity'yi otomatik güncelle
-- (apply_loyalty_transaction() / apply_coffee_stamp_transaction() ile aynı
-- desen, bkz. 0002_admin_and_loyalty.sql ve 0008_coffee_stamps.sql)
--
-- ÖNEMLİ: 'in' ve 'out' birer DELTA (mevcut miktara ekleme/çıkarma) iken,
-- 'adjustment' bir DELTA DEĞİL — doğrudan bir MUTLAK DEĞER ATAMASIDIR
-- (quantity = new.quantity). 'adjustment', fiziksel sayım sonrası stok
-- miktarını "şu an elde tam olarak bu kadar var" diye düzeltmek için var;
-- bir teslimat/kullanım kaydı değil. Bu üçü birbirine benzediği için
-- karıştırılmaya çok açık — dikkat.
-- ---------------------------------------------------------------------------
create or replace function public.apply_stock_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.type = 'in' then
    update public.stock_items
    set quantity = quantity + new.quantity
    where id = new.stock_item_id;
  elsif new.type = 'out' then
    -- stock_items_quantity_non_negative CHECK'i (yukarıda), elde olandan
    -- fazla bir 'out' işlemini açık bir Postgres hatasıyla reddeder — burada
    -- ayrıca bir manuel raise'e ihtiyaç yok (0006_loyalty_guard.sql'deki
    -- yaklaşımla aynı).
    update public.stock_items
    set quantity = quantity - new.quantity
    where id = new.stock_item_id;
  elsif new.type = 'adjustment' then
    -- Delta DEĞİL: fiziksel sayım sonrası mutlak düzeltme.
    update public.stock_items
    set quantity = new.quantity
    where id = new.stock_item_id;
  end if;

  return new;
end;
$$;

drop trigger if exists apply_stock_transaction on public.stock_transactions;
create trigger apply_stock_transaction
  after insert on public.stock_transactions
  for each row execute function public.apply_stock_transaction();

-- ---------------------------------------------------------------------------
-- Row Level Security — stok, loyalty_transactions'ın aksine HİÇBİR müşteri
-- angajmanına sahip değil: tamamen admin-only (customer-facing hiçbir SELECT
-- politikası yok).
-- ---------------------------------------------------------------------------
alter table public.stock_items enable row level security;
alter table public.stock_transactions enable row level security;

drop policy if exists "stock_items_admin_all" on public.stock_items;
create policy "stock_items_admin_all"
  on public.stock_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "stock_transactions_admin_all" on public.stock_transactions;
create policy "stock_transactions_admin_all"
  on public.stock_transactions for all
  using (public.is_admin())
  with check (public.is_admin());
