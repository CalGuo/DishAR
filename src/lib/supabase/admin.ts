import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Server-only Supabase client that uses the service role key.
 *
 * SECURITY: never import this from a Client Component, never expose the key
 * via NEXT_PUBLIC_*, and only use it for writes that must work for anonymous
 * visitors (e.g. analytics) or admin operations. RLS still applies to every
 * anon/authenticated client; the service role bypasses RLS, so every use must
 * derive any tenant scoping (restaurant_id, user id) from a trusted source —
 * a server-side lookup — never from client-supplied values.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}