"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement>,
        ModelViewerElement
      >;
    }
  }
}

export type ARViewerProps = {
  src: string;
  iosSrc?: string | null;
  alt?: string;
  className?: string;
  /**
   * Fires once the model finishes loading. `dimensions` (meters) may be null
   * for malformed GLBs. `el` is the underlying viewer element — e.g. for
   * `el.toDataURL()` to grab a thumbnail.
   */
  onModelLoaded?: (info: {
    el: ModelViewerElement;
    dimensions: { x: number; y: number; z: number } | null;
  }) => void;
};

type LoadStatus = "loading" | "loaded" | "error";
type ArStatus =
  | "not-presenting"
  | "session-starting"
  | "object-placing"
  | "object-placed"
  | "failed"
  | null;

function formatSize(dims: { x: number; y: number; z: number }): string {
  const sorted = [dims.x, dims.y, dims.z].sort((a, b) => b - a);
  const largest = Math.max(1, Math.round(sorted[0] * 100));
  const second = Math.max(1, Math.round(sorted[1] * 100));
  return `≈ ${largest} × ${second} cm`;
}

export function ARViewer({
  src,
  iosSrc,
  alt,
  className,
  onModelLoaded,
}: ARViewerProps) {
  const ref = useRef<ModelViewerElement>(null);
  const [libReady, setLibReady] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const [dimensions, setDimensions] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arStatus, setArStatus] = useState<ArStatus>(null);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setLibReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!libReady) return;
    const el = ref.current;
    if (!el) return;

    el.setAttribute("src", src);
    el.setAttribute("ar", "");
    el.setAttribute("ar-scale", "fixed");
    el.setAttribute("ar-modes", "webxr scene-viewer quick-look");
    el.setAttribute("camera-controls", "");
    el.setAttribute("auto-rotate", "");
    el.setAttribute("loading", "eager");
    el.setAttribute("class", "h-full w-full");
    if (alt) {
      el.setAttribute("alt", alt);
    } else {
      el.removeAttribute("alt");
    }
    if (iosSrc) {
      el.setAttribute("ios-src", iosSrc);
    } else {
      el.removeAttribute("ios-src");
    }

    setLoadStatus("loading");
    setDimensions(null);
    setArStatus(null);

    const onLoad = () => {
      setLoadStatus("loaded");
      let dims: { x: number; y: number; z: number } | null = null;
      try {
        const d = el.getDimensions();
        if (d && typeof d.x === "number") {
          dims = { x: d.x, y: d.y, z: d.z };
        }
      } catch {
        // Older/malformed GLBs may not expose dimensions; skip the chip.
      }
      if (dims) setDimensions(dims);
      setArSupported(el.canActivateAR ?? false);
      onModelLoaded?.({ el, dimensions: dims });
    };
    const onError = () => setLoadStatus("error");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);

    const observer = new MutationObserver(() => {
      setArStatus((el.getAttribute("ar-status") as ArStatus) ?? null);
    });
    observer.observe(el, { attributes: true, attributeFilter: ["ar-status"] });

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      observer.disconnect();
    };
  }, [libReady, src, iosSrc, alt, retryKey, onModelLoaded]);

  function handleRetry() {
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("src");
    setRetryKey((k) => k + 1);
  }

  const placing = arStatus === "object-placing";
  const failed = arStatus === "failed";
  const showArHint = arSupported !== false;
  const showDimensionChip =
    loadStatus === "loaded" && dimensions !== null && !placing && !failed;

  return (
    <div className={`relative ${className ?? ""}`}>
      <model-viewer ref={ref} />
      {loadStatus === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      )}
      {loadStatus === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 p-4 text-center">
          <p className="text-sm font-medium text-zinc-900">
            Couldn&apos;t load this 3D model.
          </p>
          <p className="text-xs text-zinc-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )}

      {loadStatus === "loaded" && arSupported === false && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-zinc-900/80 px-4 py-2 text-center text-xs text-white backdrop-blur">
          True-to-scale AR works best on a phone with ARCore or ARKit. The 3D
          model above is still a good look at the dish.
        </div>
      )}

      {loadStatus === "loaded" && showArHint && failed && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-red-600/90 px-4 py-2 text-center text-xs font-medium text-white">
          Couldn&apos;t place the dish. Try again in a well-lit area with a flat
          surface.
        </div>
      )}

      {loadStatus === "loaded" && showArHint && placing && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-zinc-900/80 px-4 py-2 text-center text-xs font-medium text-white backdrop-blur">
          Move your phone slowly to scan the area, then tap to place the dish.
        </div>
      )}

      {showDimensionChip && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
          {formatSize(dimensions!)}
        </div>
      )}
    </div>
  );
}