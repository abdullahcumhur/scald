-- Scald Coffee — Faz 2.5 düzeltmesi: atomik sipariş oluşturma
-- Önceki akışta mobil uygulama önce `orders`'a, sonra `order_items`'a iki ayrı
-- insert atıyordu. İkinci insert herhangi bir sebeple (ağ kopması, RLS
-- hatası, validasyon, uygulama çökmesi) başarısız olursa, zaten oluşmuş olan
-- `orders` satırı hiç temizlenmiyordu: status='pending', gerçek bir
-- total_amount ama sıfır order_items ile ortada kalıyordu. Kullanıcı bir
-- sonraki ekran açılışında (useFocusEffect -> loadActiveOrder) bu "hayalet"
-- siparişi aktif sipariş olarak buluyor ve Sepet ekranı kalıcı olarak takip
-- görünümüne geçiyordu — ne iptal ne tekrar deneme imkanı vardı, sadece admin
-- panelinden manuel iptal mümkündü.
--
-- Çözüm: her iki insert'i tek bir `security definer` Postgres fonksiyonunda
-- birleştirip atomik hale getiriyoruz. Fonksiyon tek bir transaction içinde
-- çalıştığı için herhangi bir adımda hata/çökme olursa hiçbir satır kalıcı
-- olmaz (plpgsql fonksiyon gövdesi tek bir implicit transaction bloğudur).
-- Ayrıca total_amount artık istemcinin gönderdiği değere güvenilmeden,
-- p_items'tan sunucu tarafında hesaplanıyor.

create or replace function public.create_order(
  p_location_id uuid,
  p_requested_minutes integer,
  p_items jsonb -- [{product_id, product_name, unit_price, quantity}, ...]
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

  select coalesce(sum((item->>'unit_price')::numeric * (item->>'quantity')::integer), 0)
  into v_total
  from jsonb_array_elements(p_items) as item;

  insert into public.orders (user_id, location_id, requested_minutes, total_amount)
  values (auth.uid(), p_location_id, p_requested_minutes, v_total)
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

-- RPC üzerinden doğrudan çağrılabilir olduğu için (handle_new_user/is_admin
-- gibi tetikleyici/RLS-yardımcı fonksiyonlardan farklı olarak), yetkileri
-- açıkça sınırlıyoruz: sadece giriş yapmış kullanıcılar çağırabilir, anon
-- ve public çağıramaz (fonksiyon içinde de auth.uid() null kontrolü var,
-- bu grant/revoke ek bir savunma katmanıdır).
revoke all on function public.create_order(uuid, integer, jsonb) from public;
revoke all on function public.create_order(uuid, integer, jsonb) from anon;
grant execute on function public.create_order(uuid, integer, jsonb) to authenticated;
