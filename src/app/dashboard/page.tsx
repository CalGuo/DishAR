import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getRestaurantForUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/restaurant";
import { DishForm } from "@/app/dashboard/dish-form";
import { DishList } from "@/app/dashboard/dish-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) redirect("/onboarding");

  const supabase = await createClient();
  const { data: dishes } = await supabase
    .from("dishes")
    .select(
      "id, name, description, price, category, thumbnail_url, model_glb_url, model_usdz_url, is_available, sort_order"
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

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
        <DishForm restaurantId={restaurant.id} />
        {dishes && dishes.length > 0 ? (
          <DishList restaurantId={restaurant.id} dishes={dishes} />
        ) : (
          <p className="text-sm text-zinc-600">
            No dishes yet. Add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}