"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";

export type PublicRestaurant = {
  name: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  currency: string;
  accent_color: string | null;
};

export type PublicDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  thumbnail_url: string | null;
  tags: string[];
};

const TAG_ORDER = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Spicy",
  "Contains nuts",
  "Seafood",
];

type Props = {
  slug: string;
  restaurant: PublicRestaurant;
  dishes: PublicDish[];
};

function Chip({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent: string | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition"
      style={
        active
          ? {
              backgroundColor: accent ?? "#18181b",
              borderColor: accent ?? "#18181b",
              color: "#fff",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

export function MenuGrid({ slug, restaurant, dishes }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");

  const accent = restaurant.accent_color || null;

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const dish of dishes) {
      const key = dish.category?.trim() || "Menu";
      if (!seen.includes(key)) seen.push(key);
    }
    return seen;
  }, [dishes]);

  const availableTags = useMemo(() => {
    const present = new Set<string>();
    for (const dish of dishes) for (const t of dish.tags) present.add(t);
    return TAG_ORDER.filter((t) => present.has(t));
  }, [dishes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (category !== "all") {
        const key = dish.category?.trim() || "Menu";
        if (key !== category) return false;
      }
      if (tag !== "all" && !dish.tags.includes(tag)) return false;
      if (q) {
        const haystack =
          `${dish.name} ${dish.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [dishes, query, category, tag]);

  const phoneDigits = restaurant.phone?.replace(/[^\d]/g, "") || null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10 text-center">
        {restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
          />
        )}
        <h1 className="text-3xl font-semibold">{restaurant.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tap a dish to see it in true-to-scale AR.
        </p>
        {restaurant.description && (
          <p className="mx-auto mt-4 max-w-xl text-zinc-600">
            {restaurant.description}
          </p>
        )}
        {(restaurant.address || restaurant.hours || restaurant.phone) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-600">
            {restaurant.address && <span>📍 {restaurant.address}</span>}
            {restaurant.hours && <span>🕒 {restaurant.hours}</span>}
          </div>
        )}
        {restaurant.phone && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <a
              href={`tel:${restaurant.phone}`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: accent ?? "#18181b" }}
            >
              Call the restaurant
            </a>
            {phoneDigits && (
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                WhatsApp
              </a>
            )}
            {restaurant.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  restaurant.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Directions
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mb-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={tag === "all"} accent={accent} onClick={() => setTag("all")}>
              All
            </Chip>
            {availableTags.map((t) => (
              <Chip
                key={t}
                active={tag === t}
                accent={accent}
                onClick={() => setTag(tag === t ? "all" : t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Chip
            active={category === "all"}
            accent={accent}
            onClick={() => setCategory("all")}
          >
            Whole menu
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c}
              active={category === c}
              accent={accent}
              onClick={() => setCategory(category === c ? "all" : c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No dishes match right now.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((dish) => (
            <Link
              key={dish.id}
              href={`/r/${slug}/dish/${dish.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {dish.thumbnail_url ? (
                <Image
                  src={dish.thumbnail_url}
                  alt={dish.name}
                  width={640}
                  height={480}
                  className="aspect-[4/3] w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-100">
                  <span className="text-sm text-zinc-400">3D model</span>
                </div>
              )}
              <div className="p-3">
                <h2 className="truncate font-medium text-zinc-900">{dish.name}</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {formatPrice(dish.price, restaurant.currency)}
                </p>
                {dish.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {dish.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
