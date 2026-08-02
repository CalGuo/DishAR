import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";

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
      "id, name, description, price, category, thumbnail_url, sort_order"
    )
    .eq("restaurant_id", row.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold">{row.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tap a dish to see it in true-to-scale AR.
        </p>
      </header>

      {!dishes || dishes.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No dishes available right now.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {dishes.map((dish) => (
            <Link
              key={dish.id}
              href={`/r/${slug}/dish/${dish.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {dish.thumbnail_url ? (
                <Image
                  src={dish.thumbnail_url}
                  alt={dish.name}
                  width={640}
                  height={480}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-100">
                  <span className="text-sm text-zinc-400">3D model</span>
                </div>
              )}
              <div className="p-3">
                <h2 className="truncate font-medium">{dish.name}</h2>
                <p className="text-sm text-zinc-500">
                  ${Number(dish.price).toFixed(2)}
                  {dish.category ? ` · ${dish.category}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}