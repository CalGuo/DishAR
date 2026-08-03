import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records an analytics event (menu scan / dish view) into `menu_events`.
 *
 * Intended for use in public (server) pages only. The service role writes;
 * RLS keeps reads owner-only. The restaurant is always resolved server-side
 * from the slug lookup — never from a client-supplied id. Failures are
 * swallowed so a telemetry hiccup can never take a public menu page down.
 */
export async function recordMenuEvent(opts: {
  restaurantId: string;
  dishId?: string;
  event: "menu_scan" | "dish_view";
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("menu_events").insert({
      restaurant_id: opts.restaurantId,
      dish_id: opts.dishId ?? null,
      event: opts.event,
    });
  } catch {
    // Analytics must never break the menu.
  }
}