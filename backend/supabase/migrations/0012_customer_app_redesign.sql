-- Scald Coffee — müşteri uygulaması yeniden tasarımı için gereken küçük şema
-- eklemeleri: favoriler, sipariş teslim tipi, ürün seçenekleri (varyant).
--
-- Bu üçü birbirinden bağımsız, küçük ve geriye dönük uyumlu eklemeler.

-- ---------------------------------------------------------------------------
-- favorites — kullanıcının favori ürünleri (basit, loyalty_transactions gibi
-- bir ledger değil, doğrudan var/yok ilişkisi)
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- orders.order_type — "Şubeden Al" (pickup) vs "Masada Sipariş" (table).
-- Delivery yok (bilinçli kapsam dışı, ROADMAP'te de böyle).
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists order_type text not null default 'pickup'
    check (order_type in ('pickup', 'table'));

-- ---------------------------------------------------------------------------
-- products.options — ürün bazlı opsiyonel varyant tanımları (boyut, süt tipi,
-- extra shot, şurup vb.). NULL/boş = bu ürünün hiçbir seçeneği yok, ürün detay
-- ekranı seçenek göstermemeli. Şu anki seed verisindeki hiçbir üründe seçenek
-- yok; bu sütun ileride admin panelden doldurulabilecek şekilde esnek bırakıldı.
-- Beklenen şekil (örnek):
-- [{"name": "Boyut", "choices": ["Küçük", "Orta", "Büyük"]}, ...]
alter table public.products
  add column if not exists options jsonb;

-- ---------------------------------------------------------------------------
-- create_order(...) — order_type parametresi eklendi (0007_atomic_order_creation.sql'deki
-- fonksiyonun yerine geçer, aynı imza + bir opsiyonel parametre daha).
-- Mevcut mobil istemci çağrıları (p_order_type göndermeyenler) 'pickup'
-- varsayılanıyla çalışmaya devam eder — geriye dönük uyumlu.
-- ---------------------------------------------------------------------------
drop function if exists public.create_order(uuid, integer, jsonb);

create or replace function public.create_order(
  p_location_id uuid,
  p_requested_minutes integer,
  p_items jsonb,
  p_order_type text default 'pickup'
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_total numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'Bu işlem için giriş yapmış olmanız gerekiyor.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Sipariş en az bir ürün içermelidir.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Sipariş en az bir ürün içermelidir.';
  end if;

  if p_order_type not in ('pickup', 'table') then
    raise exception 'Geçersiz sipariş tipi: %', p_order_type;
  end if;

  select coalesce(sum((item->>'unit_price')::numeric * (item->>'quantity')::integer), 0)
  into v_total
  from jsonb_array_elements(p_items) as item;

  insert into public.orders (user_id, location_id, requested_minutes, total_amount, order_type)
  values (auth.uid(), p_location_id, p_requested_minutes, v_total, p_order_type)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select
    v_order.id,
    (item->>'product_id')::uuid,
    item->>'product_name',
    (item->>'unit_price')::numeric,
    (item->>'quantity')::integer
  from jsonb_array_elements(p_items) as item;

  return v_order;
end;
$$;

revoke all on function public.create_order(uuid, integer, jsonb, text) from public;
revoke all on function public.create_order(uuid, integer, jsonb, text) from anon;
grant execute on function public.create_order(uuid, integer, jsonb, text) to authenticated;
