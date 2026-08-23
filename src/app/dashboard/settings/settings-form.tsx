"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidImage } from "@/lib/storage";
import { uploadMenuAsset } from "@/lib/actions/assets";
import { updateRestaurantSettings } from "@/lib/actions/restaurant";

export type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  currency: string;
  accent_color: string | null;
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "CHF"];

export function SettingsForm({ restaurant }: { restaurant: RestaurantRow }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const logoFile = (formData.get("logo") as File | null) ?? null;

    try {
      let logo_url = restaurant.logo_url;
      if (logoFile && logoFile.size > 0) {
        if (!isValidImage(logoFile.type)) {
          throw new Error("Logo must be a PNG, JPEG, or WebP image.");
        }
        const uploadData = new FormData();
        uploadData.set("file", logoFile);
        const uploaded = await uploadMenuAsset("images", uploadData);
        if (uploaded.error) throw new Error(uploaded.error);
        logo_url = uploaded.url!;
      }

      const result = await updateRestaurantSettings({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        address: String(formData.get("address") ?? "") || null,
        hours: String(formData.get("hours") ?? "") || null,
        currency: String(formData.get("currency") ?? "USD") || "USD",
        accent_color: String(formData.get("accent_color") ?? "") || null,
        logo_url,
      });

      if (result?.error) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-zinc-700 bg-zinc-800 p-6 shadow-sm md:grid-cols-2">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
          Restaurant name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={restaurant.name}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium text-white">
          Menu URL
        </label>
        <div className="flex items-center rounded-lg border border-zinc-700 focus-within:border-zinc-500">
          <span className="pl-3 text-sm text-zinc-400">…/r/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={restaurant.slug}
            className="w-full rounded-lg bg-zinc-800 px-2 py-2 text-sm text-white outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Printed QR codes point to this. Changing it updates your menu URL.
        </p>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-white">
          Short description{" "}
          <span className="text-zinc-400">(shown on the public menu)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={restaurant.description ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-white">
          Phone <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={restaurant.phone ?? ""}
          placeholder="e.g. +1 555 010 2030"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-white">
          Address <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={restaurant.address ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="hours" className="mb-1 block text-sm font-medium text-white">
          Opening hours <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="hours"
          name="hours"
          type="text"
          defaultValue={restaurant.hours ?? ""}
          placeholder="e.g. Mon–Sun 11:00–22:00"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="currency" className="mb-1 block text-sm font-medium text-white">
          Currency
        </label>
        <input
          id="currency"
          name="currency"
          type="text"
          list="currency-options"
          defaultValue={restaurant.currency}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
        <datalist id="currency-options">
          {CURRENCIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <label htmlFor="accent_color" className="mb-1 block text-sm font-medium text-white">
          Highlight color
        </label>
        <div className="flex items-center gap-2">
          <input
            id="accent_color"
            name="accent_color"
            type="color"
            defaultValue={restaurant.accent_color || "#18181b"}
            className="h-9 w-14 rounded border border-zinc-700"
          />
          <span className="text-xs text-zinc-400">
            Used for buttons and active filters on your public menu.
          </span>
        </div>
      </div>
      <div>
        <label htmlFor="logo" className="mb-1 block text-sm font-medium text-white">
          Logo image <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full text-sm text-white"
        />
      </div>
      {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
