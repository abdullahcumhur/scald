-- Scald Coffee — vardiya (shift) planlaması
--
-- Basit bir "kim hangi şubede, hangi saatler arasında çalışıyor" planlaması.
-- Şu an için tamamen admin-only: personelin kendi vardiyasını mobil taraftan
-- görebileceği bir self-servis akış yok/planlanmıyor, dolayısıyla RLS da
-- 0003_orders.sql / 0008_coffee_stamps.sql'deki admin-all desenine benziyor
-- ama "kullanıcı kendi satırını görebilir" politikası kasıtlı olarak yok.
--
-- staff_id -> public.profiles(id): personel seçimi admin panelde
-- profiles.staff_role is not null olan kayıtlardan yapılıyor (bkz.
-- 0009_staff_roles.sql), ama bu tabloda personel/müşteri ayrımını zorlayan bir
-- CHECK/trigger yok — admin panel tarafında garanti ediliyor.

-- ---------------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------------
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.shifts drop constraint if exists shifts_ends_after_starts;
alter table public.shifts add constraint shifts_ends_after_starts check (ends_at > starts_at);

create index if not exists shifts_staff_id_idx on public.shifts (staff_id);
create index if not exists shifts_location_id_idx on public.shifts (location_id);
create index if not exists shifts_starts_at_idx on public.shifts (starts_at);

-- ---------------------------------------------------------------------------
-- Row Level Security — admin-only (bkz. yukarıdaki not)
-- ---------------------------------------------------------------------------
alter table public.shifts enable row level security;

drop policy if exists "shifts_admin_all" on public.shifts;
create policy "shifts_admin_all"
  on public.shifts for all
  using (public.is_admin())
  with check (public.is_admin());
