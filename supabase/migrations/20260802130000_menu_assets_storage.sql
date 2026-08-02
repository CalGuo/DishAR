-- ============================================================================
-- Migration: 20260802130000_menu_assets_storage
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Creates the public `menu-assets` storage bucket and the Row Level Security
-- policies on `storage.objects` that govern who may read / upload / modify /
-- delete objects inside it.
--
-- Object path convention for this app:
--   restaurants/<restaurant_id>/<dish_id?>/<filename>
-- Uploads live in two subfolders per restaurant:
--   restaurants/<restaurant_id>/images/...   (thumbnail images)
--   restaurants/<restaurant_id>/models/...   (GLB models, optional USDZ)
--
-- ----------------------------------------------------------------------------
-- ACCESS PATTERNS (human-checkable summary)
-- ----------------------------------------------------------------------------
-- storage.objects (bucket: menu-assets)
--   SELECT  : ALLOWED for anonymous (anon) on ANY object in the bucket
--             (bucket_id = 'menu-assets'). This is what lets the public
--             /r/[slug] AR viewer and <img> thumbnails load objects.
--   INSERT  : ALLOWED for an authenticated user ONLY when the object path is
--             restaurants/<restaurant_id>/... AND that restaurant_id belongs
--             to a restaurant owned by auth.uid(). Uploading into any other
--             restaurant's folder (or any path not under restaurants/<id>/)
--             is DENIED.
--   UPDATE  : ALLOWED for the owner of the parent restaurant only (same
--             ownership check as INSERT, applied to both the existing row
--             and the new path).
--   DELETE  : ALLOWED for the owner of the parent restaurant only (same
--             ownership check as INSERT).
--   DENIED  : anonymous cannot INSERT/UPDATE/DELETE anything.
--             authenticated users cannot touch objects in any bucket other
--             than 'menu-assets', nor any path whose restaurants/<id>
--             segment maps to a restaurant they do not own.
--
-- storage.buckets
--   RLS is enabled by default in Supabase; we add no policies here. Bucket
--   creation is admin-only (this migration); the app never lists buckets at
--   runtime, so no app-facing bucket policy is needed.
--
-- There is NO blanket authenticated write and NO cross-bucket access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create the public bucket (idempotent).
--    public = true -> objects get public attachment URLs of the form
--    https://<project>.supabase.co/storage/v1/object/public/menu-assets/...
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-assets', 'menu-assets', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on storage.objects.
--    (storage.buckets RLS is already enabled by default in Supabase; we leave
--    it untouched. We do NOT force RLS here — the standard Supabase storage
--    convention is plain `enable row level security` on storage.objects.)
-- ----------------------------------------------------------------------------
alter table storage.objects enable row level security;

-- ----------------------------------------------------------------------------
-- 3. Policies on storage.objects for the 'menu-assets' bucket only.
--
-- Ownership check used by INSERT / UPDATE / DELETE:
--   storage.foldername(name) splits the object path into a 1-indexed array of
--   folder segments, e.g. for 'restaurants/<id>/images/foo.jpg' it returns
--   {restaurants, <id>, images}. So:
--     [1] = the literal 'restaurants' prefix
--     [2] = the restaurant id
--   We compare r.id::text to the segment instead of casting the segment to
--   uuid, so a non-uuid segment (e.g. 'images') simply fails to match rather
--   than raising an invalid-uuid cast error.
-- ----------------------------------------------------------------------------

-- Public read: anyone (anon) may read any object in the bucket.
create policy "storage_public_read_any"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'menu-assets');

-- Owner upload: authenticated user may insert ONLY into a path whose
-- restaurants/<restaurant_id> segment maps to a restaurant they own.
create policy "storage_owner_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-assets'
    and exists (
      select 1
      from public.restaurants r
      where r.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = 'restaurants'
        and r.id::text = (storage.foldername(name))[2]
    )
  );

-- Owner update: same ownership check on the existing row and the new path.
create policy "storage_owner_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-assets'
    and exists (
      select 1
      from public.restaurants r
      where r.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = 'restaurants'
        and r.id::text = (storage.foldername(name))[2]
    )
  )
  with check (
    bucket_id = 'menu-assets'
    and exists (
      select 1
      from public.restaurants r
      where r.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = 'restaurants'
        and r.id::text = (storage.foldername(name))[2]
    )
  );

-- Owner delete: same ownership check as INSERT.
create policy "storage_owner_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-assets'
    and exists (
      select 1
      from public.restaurants r
      where r.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = 'restaurants'
        and r.id::text = (storage.foldername(name))[2]
    )
  );