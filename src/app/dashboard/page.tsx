import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/restaurant";
import { DishForm } from "@/app/dashboard/dish-form";
import { DishList } from "@/app/dashboard/dish-list";
import { SampleDishesButton } from "@/app/dashboard/sample-dishes-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, currency")
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) redirect("/onboarding");

  const { data: dishes } = await supabase
    .from("dishes")
    .select(
      "id, name, description, price, category, thumbnail_url, model_glb_url, model_usdz_url, is_available, sort_order, tags"
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  const [{ count: scanCount }, { count: viewCount }, { data: dishEvents }] =
    await Promise.all([
      supabase
        .from("menu_events")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .eq("event", "menu_scan"),
      supabase
        .from("menu_events")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .eq("event", "dish_view"),
      supabase
        .from("menu_events")
        .select("dish_id")
        .eq("restaurant_id", restaurant.id)
        .eq("event", "dish_view")
        .not("dish_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

  const topDishIds = dishEvents ?? [];
  const viewCounts = new Map<string, number>();
  for (const ev of topDishIds) {
    const id = ev.dish_id;
    if (!id) continue;
    viewCounts.set(id, (viewCounts.get(id) ?? 0) + 1);
  }
  const topDishes = [...viewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const dish = dishes?.find((d) => d.id === id);
      return { id, count, name: dish?.name ?? "Deleted dish" };
    });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          <p className="text-sm text-zinc-500">
            Public menu:{" "}
            <Link
              href={`/r/${restaurant.slug}`}
              className="underline hover:text-zinc-800"
            >
              /r/{restaurant.slug}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SampleDishesButton className="hidden sm:block" />
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/qr"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            View QR
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Menu activity</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-2xl font-semibold">{scanCount ?? 0}</p>
              <p className="text-sm text-zinc-500">Menu scans</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-2xl font-semibold">{viewCount ?? 0}</p>
              <p className="text-sm text-zinc-500">Dish views</p>
            </div>
          </div>
          {topDishes.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-zinc-700">
                Most viewed dishes
              </p>
              <ol className="mt-2 space-y-1">
                {topDishes.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-zinc-700">{d.name}</span>
                    <span className="ml-3 shrink-0 text-zinc-500">
                      {d.count} view{d.count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="mt-4 text-xs text-zinc-400">
            A scan is counted each time someone opens your public menu; a view
            is each dish page opened.
          </p>
        </section>

        <DishForm restaurantId={restaurant.id} />
        {dishes && dishes.length > 0 ? (
          <DishList
            restaurantId={restaurant.id}
            currency={restaurant.currency}
            dishes={dishes}
          />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
            <p className="text-sm text-zinc-600">
              No dishes yet. Add your first one above, or seed sample dishes to
              see the AR menu instantly.
            </p>
            <div className="mt-3 flex justify-center">
              <SampleDishesButton label="Add sample dishes" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}