"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  MENU_BUCKET,
  extensionForFileName,
  isValidImage,
  isValidModel,
} from "@/lib/storage";

export async function uploadMenuAsset(
  folder: "images" | "models",
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "A file is required." };
  }

  if (folder === "images" && !isValidImage(file.type)) {
    return { error: "Thumbnail must be a PNG, JPEG, or WebP image." };
  }
  if (folder === "models") {
    const lower = file.name.toLowerCase();
    const isGlbOrUsdz =
      lower.endsWith(".glb") ||
      lower.endsWith(".usdz") ||
      isValidModel(file.type);
    if (!isGlbOrUsdz) {
      return { error: "Model must be a .glb or .usdz file." };
    }
  }

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) return { error: "Create your restaurant first." };

  const ext = extensionForFileName(file.name, file.type);
  if (!ext) return { error: "File type not allowed." };

  const path = `restaurants/${restaurant.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MENU_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
