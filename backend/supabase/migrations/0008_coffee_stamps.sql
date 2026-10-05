-- Scald Coffee — kahve damgası kartı (ayrı, harcama tutarından bağımsız
-- sadakat mekaniği)
--
-- Mevcut sadakat sistemi (profiles.loyalty_points, bkz. 0002_admin_and_loyalty.sql
-- + 0006_loyalty_guard.sql) harcanan tutara bağlı puan biriktiriyor. Sahibin
-- istediği bu YENİ mekanik ise tamamen ayrı ve harcama tutarından bağımsız:
-- müşteri her kahve aldığında bir "damga" kazanıyor, 6 damgada sayaç sıfırlanıp
-- 1 ücretsiz kahve hakkı kazanılıyor. Barista bu ücretsiz hakkı, müşterinin
-- (zaten var olan) sadakat QR'ını tekrar okutarak tüketiyor.
--
-- Bu iki sistem kasıtlı olarak birbirinden habersiz: coffee_stamps/free_coffees
-- loyalty_points'i hiç etkilemiyor, loyalty_transactions da coffee_stamp_transactions'ı
-- hiç etkilemiyor.

-- ---------------------------------------------------------------------------
-- profiles.coffee_stamps / profiles.free_coffees
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists coffee_stamps integer not null default 0;

alter table public.profiles
  add column if not exists free_coffees integer not null default 0;

-- coffee_stamps hiçbir zaman 6'da (hatta geçici olarak dahi) oturmamalı:
-- apply_coffee_stamp_transaction() 6'ya ulaşacak değeri aynı update içinde
-- 0'a yuvarlayıp free_coffees'i artırıyor (bkz. aşağıdaki trigger fonksiyonu).
-- Bu CHECK, o mantığın bir bug sonucu bozulması durumunda (örn. ileride biri
-- trigger'ı değiştirip yuvarlamayı unutursa) veritabanının sessizce 6'da
-- kalmasını/üstüne çıkmasını engeller — aynı 0006_loyalty_guard.sql'deki
-- "bakiye kontrolü veritabanı seviyesinde garanti edilsin" felsefesi.
alter table public.profiles drop constraint if exists profiles_coffee_stamps_range;
alter table public.profiles
  add constraint profiles_coffee_stamps_range check (coffee_stamps >= 0 and coffee_stamps <= 5);

-- free_coffees için de loyalty_points'teki non-negative bakiye korumasının
-- aynısı: bir barista yanlışlıkla müşterinin sahip olmadığı bir ücretsiz
-- kahveyi harcayamasın (redeem_free_coffee trigger'ı free_coffees'i azaltıyor,
-- bu constraint ihlal edilirse Postgres insert'i transactional olarak geri alır).
alter table public.profiles drop constraint if exists profiles_free_coffees_non_negative;
alter table public.profiles
  add constraint profiles_free_coffees_non_negative check (free_coffees >= 0);

-- ---------------------------------------------------------------------------
-- coffee_stamp_transactions — loyalty_transactions (0001_init.sql) ile aynı
-- şekle sahip, ayrı ve bağımsız bir audit/ledger tablosu
-- ---------------------------------------------------------------------------
create table if not exists public.coffee_stamp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('stamp', 'redeem_free_coffee')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists coffee_stamp_transactions_user_id_idx
  on public.coffee_stamp_transactions (user_id);
create index if not exists coffee_stamp_transactions_created_at_idx
  on public.coffee_stamp_transactions (created_at);

-- ---------------------------------------------------------------------------
-- coffee_stamp_transactions eklendiğinde profiles.coffee_stamps/free_coffees'i
-- otomatik güncelle (apply_loyalty_transaction() ile aynı desen, bkz.
-- 0002_admin_and_loyalty.sql)
-- ---------------------------------------------------------------------------
create or replace function public.apply_coffee_stamp_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_next_stamps integer;
begin
  if new.type = 'stamp' then
    select coffee_stamps + 1 into v_next_stamps
    from public.profiles
    where id = new.user_id;

    if v_next_stamps >= 6 then
      -- 6. damga: sayaç 0'a yuvarlanır ve 1 ücretsiz kahve hakkı kazanılır.
      -- Bu rollover tek bir update içinde oluyor, coffee_stamps hiçbir zaman
      -- (geçici olarak dahi) 6 değerini almıyor.
      update public.profiles
      set coffee_stamps = 0,
          free_coffees = free_coffees + 1
      where id = new.user_id;
    else
      update public.profiles
      set coffee_stamps = v_next_stamps
      where id = new.user_id;
    end if;
  elsif new.type = 'redeem_free_coffee' then
    -- free_coffees >= 0 CHECK constraint'i (yukarıda), müşterinin sahip
    -- olmadığı bir ücretsiz kahveyi harcamaya çalışırsa bu insert'i açık bir
    -- Postgres hatasıyla reddeder — burada ayrıca bir manuel raise'e ihtiyaç
    -- yok (0006_loyalty_guard.sql'deki yaklaşımla aynı).
    update public.profiles
    set free_coffees = free_coffees - 1
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists apply_coffee_stamp_transaction on public.coffee_stamp_transactions;
create trigger apply_coffee_stamp_transaction
  after insert on public.coffee_stamp_transactions
  for each row execute function public.apply_coffee_stamp_transaction();

-- ---------------------------------------------------------------------------
-- Row Level Security — loyalty_transactions politikalarıyla birebir aynı desen
-- (0001_init.sql + 0002_admin_and_loyalty.sql)
-- ---------------------------------------------------------------------------
alter table public.coffee_stamp_transactions enable row level security;

drop policy if exists "coffee_stamp_transactions_select_own" on public.coffee_stamp_transactions;
create policy "coffee_stamp_transactions_select_own"
  on public.coffee_stamp_transactions for select
  using (auth.uid() = user_id);

-- Pratikte bu insert'i şu an sadece admin panel yapıyor, ama
-- loyalty_transactions_insert_own ile birebir parite/ileriye dönük uyumluluk
-- için (örn. müşteri tarafı bir self-serve akış) aynı politikayı tutuyoruz.
drop policy if exists "coffee_stamp_transactions_insert_own" on public.coffee_stamp_transactions;
create policy "coffee_stamp_transactions_insert_own"
  on public.coffee_stamp_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "coffee_stamp_transactions_admin_all" on public.coffee_stamp_transactions;
create policy "coffee_stamp_transactions_admin_all"
  on public.coffee_stamp_transactions for all
  using (public.is_admin())
  with check (public.is_admin());
