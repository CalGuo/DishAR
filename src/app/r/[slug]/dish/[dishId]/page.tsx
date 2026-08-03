import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteUrl } from "@/lib/site-url";
import { recordMenuEvent } from "@/lib/track";
import { formatPrice } from "@/lib/format";
import { ARViewer } from "@/components/ar-viewer";
import { ShareLinks } from "@/app/r/[slug]/dish/[dishId]/share-links";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; dishId: string }>;
};

async function loadDish(slug: string, dishId: string) {
  const supabase = await createPublicClient();

  const { data: restaurant, error } = await supabase.rpc(
    "get_public_restaurant",
    { p_slug: slug }
  );
  const restaurantRow = restaurant?.[0];
  if (error || !restaurantRow) return null;

  const { data: dish } = await supabase
    .from("dishes")
    .select(
      "id, name, description, price, category, thumbnail_url, model_glb_url, model_usdz_url, tags"
    )
    .eq("id", dishId)
    .eq("restaurant_id", restaurantRow.id)
    .eq("is_available", true)
    .single();

  if (!dish) return null;

  return { restaurant: restaurantRow, dish };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, dishId } = await params;
  const loaded = await loadDish(slug, dishId);
  if (!loaded) return { title: "Dish not found" };

  const siteUrl = await getSiteUrl();
  const { restaurant, dish } = loaded;
  const title = `${dish.name} · ${restaurant.name}`;
  const description =
    dish.description || `View ${dish.name} in true-to-scale AR.`;
  const url = `${siteUrl}/r/${slug}/dish/${dishId}`;

  return {
    title,
    description,
    openGraph: {
      title: `${dish.name} — view it in AR`,
      description,
      url,
      type: "website",
      images: dish.thumbnail_url
        ? [{ url: dish.thumbnail_url, alt: dish.name }]
        : undefined,
    },
    twitter: {
      card: dish.thumbnail_url ? "summary_large_image" : "summary",
      title,
      description,
      images: dish.thumbnail_url ? [dish.thumbnail_url] : undefined,
    },
  };
}

export default async function DishDetailPage({ params }: PageProps) {
  const { slug, dishId } = await params;
  const loaded = await loadDish(slug, dishId);
  if (!loaded) notFound();

  const { restaurant, dish } = loaded;
  await recordMenuEvent({
    restaurantId: restaurant.id,
    dishId: dish.id,
    event: "dish_view",
  });

  const siteUrl = await getSiteUrl();
  const dishUrl = `${siteUrl}/r/${slug}/dish/${dish.id}`;

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
            {formatPrice(dish.price, restaurant.currency)}
          </p>
          {dish.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dish.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
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
          <ShareLinks name={dish.name} url={dishUrl} />
        </div>
      </div>
    </div>
  );
}