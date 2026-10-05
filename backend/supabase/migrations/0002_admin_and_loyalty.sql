-- Scald Coffee — Faz 1/2: Admin paneli ve sadakat puanı otomasyonu
-- Bu migration, basit bir admin panelinin (çalışanların menü/şube/kampanya
-- içeriğini ve sadakat puanlarını yönetebilmesi için) güvenlik temelini kurar.

-- ---------------------------------------------------------------------------
-- profiles.is_admin — admin panelden kimlerin yazma yetkisi olacağını belirler
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- is_admin() — RLS politikalarında kullanılan yardımcı fonksiyon
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- loyalty_transactions eklendiğinde profiles.loyalty_points'i otomatik güncelle
-- ---------------------------------------------------------------------------
create or replace function public.apply_loyalty_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set loyalty_points = loyalty_points + (case when new.type = 'earn' then new.points else -new.points end)
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists apply_loyalty_transaction on public.loyalty_transactions;
create trigger apply_loyalty_transaction
  after insert on public.loyalty_transactions
  for each row execute function public.apply_loyalty_transaction();

-- ---------------------------------------------------------------------------
-- Admin yazma politikaları: categories / products / locations / promotions
-- (select politikaları 0001'de herkese açık olarak zaten tanımlı)
-- ---------------------------------------------------------------------------
drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "locations_write_admin" on public.locations;
create policy "locations_write_admin"
  on public.locations for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "promotions_write_admin" on public.promotions;
create policy "promotions_write_admin"
  on public.promotions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin, kasada müşteri QR'ını okutunca onun adına puan işlemi girebilmeli
-- ve müşteri profilini arayabilmeli (QR sadece user id taşıyacak).
-- ---------------------------------------------------------------------------
drop policy if exists "loyalty_transactions_admin_all" on public.loyalty_transactions;
create policy "loyalty_transactions_admin_all"
  on public.loyalty_transactions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());
