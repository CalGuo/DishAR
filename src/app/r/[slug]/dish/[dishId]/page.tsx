import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ARViewer } from "@/components/ar-viewer";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string; dishId: string }>;
};

export default async function DishDetailPage({ params }: Params) {
  const { slug, dishId } = await params;
  const supabase = await createPublicClient();

  const { data: restaurant, error } = await supabase.rpc(
    "get_public_restaurant",
    { p_slug: slug }
  );

  const restaurantRow = restaurant?.[0];
  if (error || !restaurantRow) notFound();

  const { data: dish } = await supabase
    .from("dishes")
    .select(
      "id, name, description, price, category, thumbnail_url, model_glb_url, model_usdz_url"
    )
    .eq("id", dishId)
    .eq("restaurant_id", restaurantRow.id)
    .eq("is_available", true)
    .single();

  if (!dish) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href={`/r/${slug}`}
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to menu
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <ARViewer
            src={dish.model_glb_url}
            iosSrc={dish.model_usdz_url}
            alt={dish.name}
          />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{dish.name}</h1>
          <p className="mt-1 text-lg text-zinc-600">
            ${Number(dish.price).toFixed(2)}
            {dish.category ? ` · ${dish.category}` : ""}
          </p>
          {dish.description && (
            <p className="mt-4 text-zinc-600">{dish.description}</p>
          )}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            <p>
              On a supported phone, tap{" "}
              <span className="font-medium text-zinc-900">View in AR</span> to
              see this dish life-size in your room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}