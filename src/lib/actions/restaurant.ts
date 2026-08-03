"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createRestaurant(
  name: string,
  slug: string
): Promise<{ error?: string } | null> {
  const trimmedName = name.trim();
  const trimmedSlug = slug.trim().toLowerCase();

  if (!trimmedName) return { error: "Restaurant name is required." };
  if (!trimmedSlug) return { error: "A URL slug is required." };
  if (!SLUG_REGEX.test(trimmedSlug)) {
    return {
      error: "Slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurants")
    .insert({ name: trimmedName, slug: trimmedSlug, owner_user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("restaurants_one_per_owner_idx")) {
        return { error: "You already have a restaurant on this account." };
      }
      return { error: "That URL is already taken. Try another slug." };
    }
    return { error: error.message };
  }

  return null;
}

export type RestaurantSettings = {
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  currency: string;
  accent_color: string | null;
  logo_url: string | null;
};

export async function updateRestaurantSettings(
  fields: RestaurantSettings
): Promise<{ error?: string } | null> {
  const name = fields.name.trim();
  const slug = fields.slug.trim().toLowerCase();

  if (!name) return { error: "Restaurant name is required." };
  if (!slug) return { error: "A URL slug is required." };
  if (!SLUG_REGEX.test(slug)) {
    return {
      error: "Slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) return { error: "Create your restaurant first." };

  const { error } = await supabase
    .from("restaurants")
    .update({
      name,
      slug,
      description: fields.description?.trim() || null,
      phone: fields.phone?.trim() || null,
      address: fields.address?.trim() || null,
      hours: fields.hours?.trim() || null,
      currency: fields.currency?.trim() || "USD",
      accent_color: fields.accent_color?.trim() || null,
      logo_url: fields.logo_url || null,
    })
    .eq("id", restaurant.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That URL is already taken. Try another slug." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath(`/r/${restaurant.slug}`, "layout");
  if (slug !== restaurant.slug) revalidatePath(`/r/${slug}`, "layout");
  return null;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/dashboard", "layout");
}