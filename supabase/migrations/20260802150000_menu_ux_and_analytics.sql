-- ============================================================================
-- Migration: 20260802150000_menu_ux_and_analytics
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Adds the fields and tables for the menu UX + analytics workstream:
--   1. restaurants gains public contact/branding columns the /r/[slug] page
--      and /dashboard/settings manage: description, phone, address, hours,
--      currency (display only), accent_color.
--   2. dishes gains a tags text[] column for dietary/allergen badges.
--   3. menu_events gains an analytics table. Only the restaurant owner may
--      SELECT from it; all writes happen server-side with the service role
--      (no anon/authenticated INSERT policy) so unauthenticated visitors
--      cannot insert or forge events for other restaurants.
--
-- ----------------------------------------------------------------------------
-- ACCESS PATTERNS (human-checkable summary)
-- ----------------------------------------------------------------------------
-- restaurants   : RLS unchanged. New columns are owner-only read/write like
--                 the existing ones; public-safe values are exposed ONLY via
--                 the extended get_public_restaurant() function below.
-- dishes        : RLS unchanged. `tags` is just another column on dishes, so
--                 existing anon (is_available = true) and owner policies
--                 automatically cover it.
-- public read   : get_public_restaurant() rebuilt to also return
--                 description, phone, address, hours, currency, accent_color.
--                 Still SECURITY DEFINER, still never exposes owner_user_id
--                 or created_at. (Return type changed, so we DROP first.)
-- menu_events   : RLS enabled. SELECT allowed only for owners of the parent
--                 restaurant (via subquery on restaurants.owner_user_id).
--                 NO INSERT/UPDATE/DELETE policy of any kind for anon or
--                 authenticated — writes happen with the service role from
--                 server-side code only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. restaurants: profile + display columns (all nullable / defaulted).
-- ----------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists description text,
  add column if not exists phone        text,
  add column if not exists address      text,
  add column if not exists hours        text,
  add column if not exists currency     text not null default 'USD',
  add column if not exists accent_color text;

-- ----------------------------------------------------------------------------
-- 2. dishes: dietary / allergen tags.
-- ----------------------------------------------------------------------------
alter table public.dishes
  add column if not exists tags text[] not null default '{}';

-- ----------------------------------------------------------------------------
-- 3. Extend the curated public read path.
--    Postgres cannot ALTER a function's return type in place, so DROP and
--    recreate. Same hardened pattern as before: SECURITY DEFINER, returns ONLY
--    the columns the public menu / dish pages need. Never owner_user_id or
--    created_at. anon/authenticated keep no other read path into restaurants.
-- ----------------------------------------------------------------------------
drop function if exists public.get_public_restaurant(text);

create function public.get_public_restaurant(p_slug text)
returns table (
  id           uuid,
  slug         text,
  name         text,
  logo_url     text,
  description  text,
  phone        text,
  address      text,
  hours        text,
  currency     text,
  accent_color text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.slug, r.name, r.logo_url,
         r.description, r.phone, r.address, r.hours,
         r.currency, r.accent_color
  from public.restaurants r
  where r.slug = p_slug
$$;

revoke all on function public.get_public_restaurant(text) from public;
grant execute on function public.get_public_restaurant(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. menu_events: analytics. Owner-only reads, no client writes.
-- ----------------------------------------------------------------------------
create table public.menu_events (
  id            bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  dish_id       uuid references public.dishes (id) on delete cascade,
  event         text not null check (event in ('menu_scan', 'dish_view')),
  created_at    timestamptz not null default now()
);

create index menu_events_restaurant_created_idx
  on public.menu_events (restaurant_id, created_at desc);

create index menu_events_dish_idx
  on public.menu_events (dish_id);

alter table public.menu_events enable row level security;

-- Owner may read their own restaurant's events.
create policy "menu_events_owner_select_own"
  on public.menu_events
  for select
  to authenticated
  using (
    restaurant_id in (
      select id from public.restaurants where owner_user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies: writes are service-role server-side only.
-- anon and authenticated cannot write events at all, and can read only the
-- owner select above.