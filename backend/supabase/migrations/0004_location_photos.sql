-- Scald Coffee — gerçek şube fotoğrafları için Storage bucket + locations.image_url

alter table public.locations add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('location-photos', 'location-photos', true)
on conflict (id) do nothing;

drop policy if exists "location_photos_public_read" on storage.objects;
create policy "location_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'location-photos');

-- Şube fotoğraflarını sadece admin yükleyebilir/değiştirebilir/silebilir.
drop policy if exists "location_photos_admin_write" on storage.objects;
create policy "location_photos_admin_write"
  on storage.objects for all
  using (bucket_id = 'location-photos' and public.is_admin())
  with check (bucket_id = 'location-photos' and public.is_admin());
