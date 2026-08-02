"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRestaurant } from "@/lib/actions/restaurant";

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();

    if (!name || !slug) {
      setError("Name and slug are required.");
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setError("Slug may only contain lowercase letters, numbers, and hyphens.");
      return;
    }

    setPending(true);
    const result = await createRestaurant(name, slug);

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Restaurant name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. La Trattoria"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium">
          Menu URL
        </label>
        <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-zinc-500">
          <span className="pl-3 text-sm text-zinc-500">…/r/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="la-trattoria"
            className="w-full px-2 py-2 text-sm outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Lowercase letters, numbers, and hyphens. Used in your table QR code.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create restaurant"}
      </button>
    </form>
  );
}