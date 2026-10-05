-- Scald Coffee — gerçek ürün fotoğrafları için Storage bucket (products.image_url
-- kolonu zaten 0001_init.sql'de mevcut)

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

drop policy if exists "product_photos_public_read" on storage.objects;
create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

-- Ürün fotoğraflarını sadece admin yükleyebilir/değiştirebilir/silebilir.
drop policy if exists "product_photos_admin_write" on storage.objects;
create policy "product_photos_admin_write"
  on storage.objects for all
  using (bucket_id = 'product-photos' and public.is_admin())
  with check (bucket_id = 'product-photos' and public.is_admin());
