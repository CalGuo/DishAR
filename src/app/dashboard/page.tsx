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