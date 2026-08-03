"use client";

import { useState } from "react";

type Props = {
  name: string;
  url: string;
};

export function ShareLinks({ name, url }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — fall back to a prompt-style share.
      window.prompt("Copy the link:", url);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `${name} — see it in AR: ${url}`
        )}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}