import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getRestaurantForUser = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, slug, name, logo_url")
    .eq("owner_user_id", userId)
    .single();
  return data;
});

/**
 * Guard for authenticated pages. Redirects to /login if the visitor is signed
 * out, then to /onboarding if their account has no restaurant yet.
 */
export async function requireRestaurant() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) redirect("/onboarding");

  return { user, restaurant };
}