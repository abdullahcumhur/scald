-- Scald Coffee — personel dizini ve roller (cashier/manager/owner)
--
-- Bugüne kadar "admin panelde yazma yetkisi" tek bir boolean'dı
-- (profiles.is_admin, bkz. 0002_admin_and_loyalty.sql) ve is_admin olan
-- herkes panelde her şeyi yapabiliyordu — kasiyer ile sahip arasında hiçbir
-- fark yoktu, ayrı bir "personel dizini" de yoktu. Bu, ROADMAP.md §6'da
-- açık bir soru olarak bırakılmıştı: "Admin panel için ayrı bir 'personel'
-- hesabı modeli mi... yoksa roller mi olsun?"
--
-- Kasıtlı kapsam kararı: is_admin, "panele giriş yapabilir mi" sorusunun TEK
-- DB-seviyesi kapısı olarak kalıyor — public.is_admin() fonksiyonu
-- backend/supabase/migrations/*.sql içindeki pek çok RLS politikasında
-- kullanılıyor, o mekanizmayı değiştirmek bambaşka ve ilgisiz politikalara
-- dokunmak demek, bu migration'ın kapsamı dışında. Burada eklenen
-- staff_role, is_admin'in ÜSTÜNE panel içi ince yetkilendirme/UI
-- farklılaştırması için eklenen ek bir sütun.
--
-- staff_role NULL olabilir: NULL = "personel değil" (sıradan bir müşteri,
-- ya da henüz bir role atanmamış bir is_admin hesabı). location_id, personelin
-- bağlı olduğu ana şube (nullable — bir yönetici/sahip tek bir şubeye bağlı
-- olmayabilir). is_active, bir sahibin işten ayrılan personelin hesabını/
-- geçmişini silmeden panel erişimini geçici/kalıcı olarak kapatabilmesi için.

-- ---------------------------------------------------------------------------
-- profiles.staff_role / location_id / is_active
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists staff_role text check (staff_role in ('cashier', 'manager', 'owner'));

alter table public.profiles
  add column if not exists location_id uuid references public.locations(id) on delete set null;

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- profiles_update_admin — RLS politika boşluğu düzeltmesi
--
-- 0001_init.sql'deki profiles_update_own politikası, bir kullanıcının
-- SADECE kendi satırını (auth.uid() = id) güncelleyebilmesine izin veriyor.
-- Bugüne kadar bu yeterliydi çünkü hiçbir admin akışı başka bir kullanıcının
-- profilini DOĞRUDAN update etmiyordu (loyalty_points/coffee_stamps gibi
-- alanlar hep trigger'lar üzerinden, security definer fonksiyonlarla
-- güncelleniyordu — bkz. apply_loyalty_transaction/apply_coffee_stamp_transaction).
--
-- Personel dizini ise bir admin'in (anon client üzerinden, app/api/staff
-- değil — ama ileride normal client tarafından da kullanılabilir) başka bir
-- kullanıcının is_admin/staff_role/location_id/is_active alanlarını
-- güncelleyebilmesini gerektiriyor. profiles_select_admin politikasıyla
-- (0002_admin_and_loyalty.sql) aynı desen: public.is_admin() kontrolü.
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
