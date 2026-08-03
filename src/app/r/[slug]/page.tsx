import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { recordMenuEvent } from "@/lib/track";
import { MenuGrid } from "@/app/r/[slug]/menu-grid";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function RestaurantMenuPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createPublicClient();

  const { data: restaurant, error } = await supabase.rpc(
    "get_public_restaurant",
    { p_slug: slug }
  );

  const row = restaurant?.[0];
  if (error || !row) notFound();

  const { data: dishes } = await supabase
    .from("dishes")
    .select(
      "id, name, description, price, category, thumbnail_url, tags, sort_order"
    )
    .eq("restaurant_id", row.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  await recordMenuEvent({
    restaurantId: row.id,
    event: "menu_scan",
  });

  return (
    <MenuGrid
      slug={slug}
      restaurant={{
        name: row.name,
        logo_url: row.logo_url,
        description: row.description,
        phone: row.phone,
        address: row.address,
        hours: row.hours,
        currency: row.currency,
        accent_color: row.accent_color,
      }}
      dishes={dishes ?? []}
    />
  );
}