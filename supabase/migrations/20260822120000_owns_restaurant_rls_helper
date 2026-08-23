-- ============================================================================
-- Migration: 20260822120000_owns_restaurant_rls_helper
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Dish/storage INSERT policies used an EXISTS / IN subquery on
-- public.restaurants. That subquery is itself subject to restaurants RLS, and
-- storage.objects evaluation often cannot see the owner row — Postgres then
-- reports "new row violates row-level security policy" on upload or dish
-- insert even for the restaurant owner.
--
-- SECURITY DEFINER bypasses restaurants RLS (FORCE was dropped in
-- 20260802140000) and still filters on auth.uid(), so ownership is unchanged.
-- ============================================================================

create or replace function public.user_owns_restaurant(p_restaurant_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurants r
    where r.owner_user_id = auth.uid()
      and r.id::text = p_restaurant_id
  );
$$;

revoke all on function public.user_owns_restaurant(text) from public;
grant execute on function public.user_owns_restaurant(text) to authenticated;

-- dishes: same ownership rule, without a nested RLS subquery.
drop policy if exists "dishes_owner_select_own" on public.dishes;
drop policy if exists "dishes_owner_insert_own" on public.dishes;
drop policy if exists "dishes_owner_update_own" on public.dishes;
drop policy if exists "dishes_owner_delete_own" on public.dishes;

create policy "dishes_owner_select_own"
  on public.dishes
  for select
  to authenticated
  using (public.user_owns_restaurant(restaurant_id::text));

create policy "dishes_owner_insert_own"
  on public.dishes
  for insert
  to authenticated
  with check (public.user_owns_restaurant(restaurant_id::text));

create policy "dishes_owner_update_own"
  on public.dishes
  for update
  to authenticated
  using (public.user_owns_restaurant(restaurant_id::text))
  with check (public.user_owns_restaurant(restaurant_id::text));

create policy "dishes_owner_delete_own"
  on public.dishes
  for delete
  to authenticated
  using (public.user_owns_restaurant(restaurant_id::text));

-- storage.objects: same helper; keep the restaurants/<id>/ path prefix.
drop policy if exists "storage_owner_insert_own" on storage.objects;
drop policy if exists "storage_owner_update_own" on storage.objects;
drop policy if exists "storage_owner_delete_own" on storage.objects;
drop policy if exists "storage_authenticated_read_any" on storage.objects;

create policy "storage_authenticated_read_any"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'menu-assets');

create policy "storage_owner_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-assets'
    and (storage.foldername(name))[1] = 'restaurants'
    and public.user_owns_restaurant((storage.foldername(name))[2])
  );

create policy "storage_owner_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-assets'
    and (storage.foldername(name))[1] = 'restaurants'
    and public.user_owns_restaurant((storage.foldername(name))[2])
  )
  with check (
    bucket_id = 'menu-assets'
    and (storage.foldername(name))[1] = 'restaurants'
    and public.user_owns_restaurant((storage.foldername(name))[2])
  );

create policy "storage_owner_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-assets'
    and (storage.foldername(name))[1] = 'restaurants'
    and public.user_owns_restaurant((storage.foldername(name))[2])
  );
