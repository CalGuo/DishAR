-- ============================================================================
-- Migration: 20260802120000_create_restaurants_and_dishes
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Creates the initial `restaurants` and `dishes` tables plus their Row Level
-- Security policies. RLS is enabled (and FORCEd) on every table.
--
-- ----------------------------------------------------------------------------
-- ACCESS PATTERNS (human-checkable summary)
-- ----------------------------------------------------------------------------
-- restaurants
--   SELECT  : ALLOWED for the owner only  -> WHERE owner_user_id = auth.uid()
--   INSERT  : ALLOWED for any authenticated user, but ONLY with
--             owner_user_id = auth.uid() (cannot create a row owned by
--             someone else)
--   UPDATE  : ALLOWED for the owner only  -> WHERE owner_user_id = auth.uid()
--   DELETE  : ALLOWED for the owner only  -> WHERE owner_user_id = auth.uid()
--   DENIED  : anonymous (anon) has NO access to restaurants at all.
--             authenticated users cannot read/write any restaurant they
--             do not own.
--
-- dishes
--   SELECT  : ALLOWED for the owner of the parent restaurant
--             (restaurant_id IN restaurants owned by auth.uid())
--   INSERT  : ALLOWED for the owner of the parent restaurant (same check)
--   UPDATE  : ALLOWED for the owner of the parent restaurant (same check)
--   DELETE  : ALLOWED for the owner of the parent restaurant (same check)
--   SELECT  : ALLOWED for anonymous (anon) ONLY on rows where
--             is_available = true  (policy: public_read_available_dishes)
--   DENIED  : anonymous cannot INSERT/UPDATE/DELETE dishes.
--             authenticated non-owners cannot read/write any dishes.
--
-- There is NO blanket public read and NO blanket authenticated read.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- restaurants
-- ----------------------------------------------------------------------------
create table public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  logo_url      text,
  owner_user_id uuid not null references auth.users (id),
  created_at    timestamptz not null default now()
);

-- RLS on, and force it so even the table owner (postgres) is subject to it.
alter table public.restaurants enable row level security;
alter table public.restaurants force row level security;

-- Owner can read their own restaurant row.
create policy "restaurants_owner_select_own"
  on public.restaurants
  for select
  to authenticated
  using (owner_user_id = auth.uid());

-- Authenticated user can create a restaurant, but only owned by themselves.
create policy "restaurants_owner_insert_own"
  on public.restaurants
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

-- Owner can update their own restaurant row (and cannot re-assign ownership).
create policy "restaurants_owner_update_own"
  on public.restaurants
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Owner can delete their own restaurant row.
create policy "restaurants_owner_delete_own"
  on public.restaurants
  for delete
  to authenticated
  using (owner_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- dishes
-- ----------------------------------------------------------------------------
create table public.dishes (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  name           text not null,
  description    text,
  price          numeric(10, 2) not null,
  category       text,
  thumbnail_url  text,
  model_glb_url  text not null,
  model_usdz_url text,
  is_available   boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Useful indexes (restaurants.slug is already unique via its constraint).
create index dishes_restaurant_id_idx
  on public.dishes (restaurant_id);

create index dishes_restaurant_availability_sort_idx
  on public.dishes (restaurant_id, is_available, sort_order);

-- RLS on, and force it so even the table owner (postgres) is subject to it.
alter table public.dishes enable row level security;
alter table public.dishes force row level security;

-- Owner access is derived from owning the parent restaurant.
create policy "dishes_owner_select_own"
  on public.dishes
  for select
  to authenticated
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

create policy "dishes_owner_insert_own"
  on public.dishes
  for insert
  to authenticated
  with check (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

create policy "dishes_owner_update_own"
  on public.dishes
  for update
  to authenticated
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  )
  with check (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

create policy "dishes_owner_delete_own"
  on public.dishes
  for delete
  to authenticated
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

-- Public anonymous read: ONLY available dishes, nothing else.
create policy "public_read_available_dishes"
  on public.dishes
  for select
  to anon
  using (is_available = true);