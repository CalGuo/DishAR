"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MENU_BUCKET,
  isValidImage,
  isValidModel,
  extensionForFileName,
} from "@/lib/storage";
import { createDish, updateDish } from "@/lib/actions/dish";

export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Halal",
  "Spicy",
  "Contains nuts",
] as const;

export type DishRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  thumbnail_url: string | null;
  model_glb_url: string;
  model_usdz_url: string | null;
  is_available: boolean;
  sort_order: number;
  tags: string[];
};

type Props = {
  restaurantId: string;
  initial?: DishRow;
  onDone?: () => void;
};

async function uploadFile(
  restaurantId: string,
  folder: "images" | "models",
  file: File
): Promise<{ url?: string; error?: string }> {
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

  const supabase = createClient();
  const path = `restaurants/${restaurantId}/${folder}/${crypto.randomUUID()}.${extensionForFileName(file.name, file.type)}`;

  const { error } = await supabase.storage
    .from(MENU_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export function DishForm({ restaurantId, initial, onDone }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const category = String(formData.get("category") ?? "").trim();

    if (!name) {
      setError("Name is required.");
      setPending(false);
      return;
    }
    if (!price || Number.isNaN(price) || price < 0) {
      setError("A valid price is required.");
      setPending(false);
      return;
    }

    const thumbnail = (formData.get("thumbnail") as File | null) ?? null;
    const glb = (formData.get("model_glb") as File | null) ?? null;
    const usdz = (formData.get("model_usdz") as File | null) ?? null;

    try {
      let thumbnail_url = initial?.thumbnail_url ?? null;
      if (thumbnail && thumbnail.size > 0) {
        const res = await uploadFile(restaurantId, "images", thumbnail);
        if (res.error) throw { message: res.error };
        thumbnail_url = res.url!;
      }

      let model_glb_url = initial?.model_glb_url ?? null;
      if (glb && glb.size > 0) {
        const res = await uploadFile(restaurantId, "models", glb);
        if (res.error) throw { message: res.error };
        model_glb_url = res.url!;
      }

      let model_usdz_url = initial?.model_usdz_url ?? null;
      if (usdz && usdz.size > 0) {
        const res = await uploadFile(restaurantId, "models", usdz);
        if (res.error) throw { message: res.error };
        model_usdz_url = res.url!;
      }

      const fields = {
        name,
        description: description || null,
        price,
        category: category || null,
        thumbnail_url,
        model_glb_url: model_glb_url!,
        model_usdz_url,
        tags,
      };

      const result = initial
        ? await updateDish(initial.id, fields)
        : await createDish(fields);

      if (result?.error) throw new Error(result.error);

      if (onDone) onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-2"
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initial?.name ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium">
          Price
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={initial?.price ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          defaultValue={initial?.category ?? ""}
          placeholder="e.g. Starters, Mains, Desserts"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium">
          Dietary &amp; allergen tags{" "}
          <span className="text-zinc-400">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="thumbnail" className="mb-1 block text-sm font-medium">
          Thumbnail image <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="thumbnail"
          name="thumbnail"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full text-sm"
        />
      </div>
      <div>
        <label htmlFor="model_glb" className="mb-1 block text-sm font-medium">
          3D model (GLB) <span className="text-red-500">*</span>
        </label>
        <input
          id="model_glb"
          name="model_glb"
          type="file"
          accept=".glb,model/gltf-binary"
          className="w-full text-sm"
        />
        {initial?.model_glb_url && (
          <p className="mt-1 text-xs text-zinc-500">
            Current model uploaded. Leave blank to keep it.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="model_usdz" className="mb-1 block text-sm font-medium">
          iOS model (USDZ){" "}
          <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="model_usdz"
          name="model_usdz"
          type="file"
          accept=".usdz,model/usdz+zip"
          className="w-full text-sm"
        />
        {initial?.model_usdz_url && (
          <p className="mt-1 text-xs text-zinc-500">
            Leave blank to keep the existing USDZ.
          </p>
        )}
        {!initial?.model_usdz_url && (
          <p className="mt-1 text-xs text-zinc-500">
            Optional for iOS Quick Look; can also be auto-generated later.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending
            ? "Uploading…"
            : initial
              ? "Save changes"
              : "Add dish"}
        </button>
      </div>
    </form>
  );
}