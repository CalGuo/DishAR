"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

type Sample = {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  shape: string;
  color: string;
};

// Procedurally-generated GLB models served by /api/demo-model — no binary
// assets committed. These are cubes so the real-world scale is obvious in AR.
const SAMPLES: Sample[] = [
  {
    name: "Margherita",
    description: "Tomato, mozzarella, basil — our demo flat shape.",
    price: 9.8,
    category: "Pizza",
    tags: ["Vegetarian"],
    shape: "plate",
    color: "d94f4f",
  },
  {
    name: "Iced Matcha",
    description: "Cold matcha latte with oat milk — demo cup.",
    price: 5.2,
    category: "Drinks",
    tags: ["Vegan", "Dairy-free"],
    shape: "cup",
    color: "5fae6e",
  },
  {
    name: "Chocolate Gelato",
    description: "Old-fashioned bowl of gelato — demo bowl.",
    price: 4.5,
    category: "Desserts",
    tags: [],
    shape: "bowl",
    color: "7a5230",
  },
];

export async function seedSampleDishes(): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) return { error: "Create your restaurant first." };

  const siteUrl = await getSiteUrl();

  const { data: maxRow } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const rows = SAMPLES.map((sample) => ({
    restaurant_id: restaurant.id,
    name: sample.name,
    description: sample.description,
    price: sample.price,
    category: sample.category,
    tags: sample.tags,
    thumbnail_url:
      `${siteUrl}/api/demo-model?shape=${sample.shape}&color=${sample.color}&thumb=1`,
    model_glb_url:
      `${siteUrl}/api/demo-model?shape=${sample.shape}&color=${sample.color}`,
    is_available: true,
    sort_order: sortOrder++,
  }));

  const { error } = await supabase.from("dishes").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return null;
}