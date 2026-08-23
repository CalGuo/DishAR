"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  deleteDish,
  setDishAvailability,
  moveDish,
  cloneDish,
} from "@/lib/actions/dish";
import { formatPrice } from "@/lib/format";
import { DishForm, type DishRow } from "@/app/dashboard/dish-form";

type Props = {
  currency: string;
  dishes: DishRow[];
};

export function DishList({ currency, dishes }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(
    action: () => Promise<{ error?: string } | null>
  ) {
    setError(null);
    const result = await action();
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const editingDish = dishes.find((d) => d.id === editingId);

  return (
    <div className="space-y-4">
      <ul className="divide-y overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800 shadow-sm">
        {dishes.map((dish, i) => (
          <li key={dish.id} className="flex items-center gap-4 p-4">
            {dish.thumbnail_url ? (
              <Image
                src={dish.thumbnail_url}
                alt={dish.name}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <span className="text-xs text-zinc-400">No img</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={`truncate font-medium ${
                    dish.is_available ? "text-white" : "text-zinc-400 line-through"
                  }`}
                >
                  {dish.name}
                </h3>
                {!dish.is_available && (
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    Hidden
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-300">
                {formatPrice(dish.price, currency)}
                {dish.category ? ` · ${dish.category}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={i === 0}
                onClick={() =>
                  runAction(() => moveDish(dish.id, "up"))
                }
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === dishes.length - 1}
                onClick={() =>
                  runAction(() => moveDish(dish.id, "down"))
                }
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction(() =>
                    setDishAvailability(dish.id, !dish.is_available)
                  )
                }
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
              >
                {dish.is_available ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(dish.id)}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => runAction(() => cloneDish(dish.id))}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
                title="Duplicate this dish"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(`Delete "${dish.name}"? This can't be undone.`)
                  ) {
                    runAction(() => deleteDish(dish.id));
                  }
                }}
                className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {editingId && editingDish && (
        <div className="rounded-2xl border-2 border-zinc-600 bg-zinc-800 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Edit {editingDish.name}</h2>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900"
            >
              Close
            </button>
          </div>
          <DishForm
            initial={editingDish}
            onDone={() => setEditingId(null)}
          />
        </div>
      )}
    </div>
  );
}
