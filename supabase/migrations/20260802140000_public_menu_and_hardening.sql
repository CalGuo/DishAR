-- ============================================================================
-- Migration: 20260802140000_public_menu_and_hardening
-- App:       AR Restaurant Menu (multi-tenant)
--
-- Fixes found in security audit:
--   1. FATAL: public /r/[slug] pages were 404ing for everyone because there is
--      no anonymous read path into `restaurants`. With `FORCE ROW LEVEL
--      SECURITY` applied, even the table owner is subject to RLS, so a
--      SECURITY DEFINER helper function (the only anon-safe read path) cannot
--      bypass it. We drop the FORCE (RLS stays ENABLED on every table; the
--      app never runs as the table owner, and anon still has zero policies on
--      `restaurants`), then expose a curated SECURITY DEFINER function that
--      returns ONLY public columns (id, name, slug, logo_url) — never
--      owner_user_id / created_at.
--  2. HARDENING: no anonymous read except via the fixed function. anon still
--      cannot SELECT directly from restaurants (no policy), so it cannot call
--      the function to probe arbitrary slugs beyond what the function allows.
--     - public restaurant rows: SELECT only via get_public_restaurant().
--     - public dish rows: unchanged anon policy (is_available = true only).
--  3. Normalize: one restaurant per user so `.single()` lookups cannot 500.
--
-- ----------------------------------------------------------------------------
-- ACCESS PATTERNS (human-checkable summary)
-- ----------------------------------------------------------------------------
-- restaurants   : RLS stays enabled. Authenticated owner policies unchanged.
--                 anon has NO select/insert/update/delete policy on
--                 restaurants (direct reads return zero rows).
-- dishes        : RLS stays enabled. Owner policies unchanged. anon SELECT
--                 only where is_available = true.
-- public read   : anon may call get_public_restaurant(menu_slug text) which
--                 returns (id, slug, name, logo_url) for a single row. It is
--                 SECURITY DEFINER and runs as the migration owner (postgres),
--                 returning only the curated columns — owner_user_id and
--                 created_at are never exposed.
-- storage       : unchanged (see 20260802130000).
-- ============================================================================

-- Drop FORCE RLS so SECURITY DEFINER helpers can serve curated public data.
-- RLS remains ENABLED; all row policies continue to apply to anon/authenticated.
alter table public.restaurants no force row level security;
alter table public.dishes no force row level security;

-- Curated public read path for the /r/[slug] routes.
-- SECURITY DEFINER: runs as the function owner (postgres, table owner). Returns
-- only the columns the public menu and dish pages need. Anon/authenticated get
-- NO other way to read restaurants.
create or replace function public.get_public_restaurant(p_slug text)
returns table (id uuid, slug text, name text, logo_url text)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.slug, r.name, r.logo_url
  from public.restaurants r
  where r.slug = p_slug
$$;

revoke all on function public.get_public_restaurant(text) from public;
grant execute on function public.get_public_restaurant(text) to anon, authenticated;

-- One restaurant per owner: protects `.single()` lookups from throwing and
-- prevents a user creating unlimited rows that page() views with limit(1).
create unique index restaurants_one_per_owner_idx
  on public.restaurants (owner_user_id);