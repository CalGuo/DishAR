import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/restaurant";
import { SettingsForm } from "@/app/dashboard/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, slug, name, logo_url, description, phone, address, hours, currency, accent_color"
    )
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) redirect("/onboarding");

  return (
    <div className="min-h-svh bg-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Restaurant settings
            </h1>
            <p className="text-sm text-zinc-400">
              Public menu:{" "}
              <Link
                href={`/r/${restaurant.slug}`}
                className="underline text-white hover:text-zinc-300"
              >
                /r/{restaurant.slug}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Back to dishes
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <SettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}
