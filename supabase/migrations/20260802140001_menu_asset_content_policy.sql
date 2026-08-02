-- ============================================================================
-- Migration: 20260802140001_menu_asset_content_policy
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Server-side backstop for the 'menu-assets' bucket: the dashboard validates
-- file types client-side, but a malicious client could otherwise upload
-- arbitrary content into their own public folder and have the CDN serve it.
-- This trigger rejects uploads whose filename extension is not in the
-- whitelist, before the object is written.
--
-- ACCESS SUMMARY:
--   INSERT/UPDATE on storage.objects (menu-assets bucket) allowed only for
--   names ending in .glb / .gltf / .usdz / .png / .jpg / .jpeg / .webp.
--   All other names raise an exception (any role).
-- ============================================================================
create or replace function storage.check_menu_asset_extension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  obj_name text := lower(new.name);
begin
  if new.bucket_id <> 'menu-assets' then
    return new;
  end if;

  if obj_name like '%.glb' or obj_name like '%.gltf'
     or obj_name like '%.usdz' or obj_name like '%.png'
     or obj_name like '%.jpg' or obj_name like '%.jpeg'
     or obj_name like '%.webp'
  then
    return new;
  end if;

  raise exception 'File type not allowed in menu-assets bucket';
end;
$$;

drop trigger if exists check_menu_asset_extension on storage.objects;

create trigger check_menu_asset_extension
  before insert or update on storage.objects
  for each row
  execute function storage.check_menu_asset_extension();