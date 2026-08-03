"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MENU_BUCKET } from "@/lib/storage";

function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MENU_BUCKET}/`;
  if (!url.startsWith(marker)) return null;
  return url.slice(marker.length);
}

type DishFields = {
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  thumbnail_url: string | null;
  model_glb_url: string;
  model_usdz_url: string | null;
  tags: string[];
};

async function resolveRestaurantId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_user_id", userId)
    .single();
  return data?.id ?? null;
}

async function assertOwnsDish(
  userId: string,
  dishId: string
): Promise<{ restaurantId: string } | { error: string }> {
  const restaurantId = await resolveRestaurantId(userId);
  if (!restaurantId) return { error: "No restaurant for this account." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("dishes")
    .select("id")
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!data) return { error: "Dish not found." };
  return { restaurantId };
}

export async function createDish(
  fields: DishFields
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const name = fields.name.trim();
  if (!name || !fields.model_glb_url) {
    return { error: "Dish name and a GLB model are required." };
  }

  const ownerId = await resolveRestaurantId(user.id);
  if (!ownerId) return { error: "Create your restaurant first." };

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", ownerId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("dishes")
    .insert({
      restaurant_id: ownerId,
      name,
      description: fields.description?.trim() || null,
      price: fields.price,
      category: fields.category?.trim() || null,
      thumbnail_url: fields.thumbnail_url || null,
      model_glb_url: fields.model_glb_url,
      model_usdz_url: fields.model_usdz_url || null,
      tags: fields.tags ?? [],
      is_available: true,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return null;
}

export async function updateDish(
  dishId: string,
  fields: DishFields
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!fields.name.trim() || !fields.model_glb_url) {
    return { error: "Dish name and a GLB model are required." };
  }

  const owned = await assertOwnsDish(user.id, dishId);
  if ("error" in owned) return owned;

  const supabase = await createClient();
  const { error } = await supabase
    .from("dishes")
    .update({
      name: fields.name.trim(),
      description: fields.description?.trim() || null,
      price: fields.price,
      category: fields.category?.trim() || null,
      thumbnail_url: fields.thumbnail_url || null,
      model_glb_url: fields.model_glb_url,
      model_usdz_url: fields.model_usdz_url || null,
      tags: fields.tags ?? [],
    })
    .eq("id", dishId)
    .eq("restaurant_id", owned.restaurantId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return null;
}

export async function deleteDish(
  dishId: string
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const owned = await assertOwnsDish(user.id, dishId);
  if ("error" in owned) return owned;

  const supabase = await createClient();

  const { data: dish } = await supabase
    .from("dishes")
    .select(
      "thumbnail_url, model_glb_url, model_usdz_url"
    )
    .eq("id", dishId)
    .eq("restaurant_id", owned.restaurantId)
    .maybeSingle();

  const { error } = await supabase
    .from("dishes")
    .delete()
    .eq("id", dishId)
    .eq("restaurant_id", owned.restaurantId);

  if (error) return { error: error.message };

  const objectPaths = [
    storagePathFromUrl(dish?.thumbnail_url ?? null),
    storagePathFromUrl(dish?.model_glb_url ?? null),
    storagePathFromUrl(dish?.model_usdz_url ?? null),
  ].filter((p): p is string => p !== null);

  if (objectPaths.length > 0) {
    await supabase.storage.from(MENU_BUCKET).remove(objectPaths);
  }

  revalidatePath("/dashboard");
  return null;
}

export async function setDishAvailability(
  dishId: string,
  isAvailable: boolean
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const owned = await assertOwnsDish(user.id, dishId);
  if ("error" in owned) return owned;

  const supabase = await createClient();
  const { error } = await supabase
    .from("dishes")
    .update({ is_available: isAvailable })
    .eq("id", dishId)
    .eq("restaurant_id", owned.restaurantId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return null;
}

export async function cloneDish(
  dishId: string
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const owned = await assertOwnsDish(user.id, dishId);
  if ("error" in owned) return owned;

  const supabase = await createClient();

  const { data: source } = await supabase
    .from("dishes")
    .select(
      "name, description, price, category, thumbnail_url, model_glb_url, model_usdz_url, tags"
    )
    .eq("id", dishId)
    .eq("restaurant_id", owned.restaurantId)
    .maybeSingle();
  if (!source) return { error: "Dish not found." };

  const { data: maxRow } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", owned.restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("dishes")
    .insert({
      restaurant_id: owned.restaurantId,
      name: `${source.name} (copy)`,
      description: source.description,
      price: source.price,
      category: source.category,
      thumbnail_url: source.thumbnail_url,
      model_glb_url: source.model_glb_url,
      model_usdz_url: source.model_usdz_url,
      tags: source.tags ?? [],
      is_available: false,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return null;
}

export async function moveDish(
  dishId: string,
  direction: "up" | "down"
): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const owned = await assertOwnsDish(user.id, dishId);
  if ("error" in owned) return owned;

  const supabase = await createClient();
  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, sort_order")
    .eq("restaurant_id", owned.restaurantId)
    .order("sort_order", { ascending: true });

  if (!dishes || dishes.length === 0) return null;

  const index = dishes.findIndex((d) => d.id === dishId);
  if (index === -1) return { error: "Dish not found." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= dishes.length) return null;

  const current = dishes[index].sort_order;
  const neighbor = dishes[swapWith].sort_order;

  const { error } = await supabase
    .from("dishes")
    .update({ sort_order: neighbor })
    .eq("id", dishes[index].id)
    .eq("restaurant_id", owned.restaurantId);

  if (!error) {
    const swapError = await supabase
      .from("dishes")
      .update({ sort_order: current })
      .eq("id", dishes[swapWith].id)
      .eq("restaurant_id", owned.restaurantId);
    if (swapError.error) return { error: swapError.error.message };
  } else {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return null;
}