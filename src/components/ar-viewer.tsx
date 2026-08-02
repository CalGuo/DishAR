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
};

export function ARViewer({ src, iosSrc, alt, className }: ARViewerProps) {
  const ref = useRef<ModelViewerElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
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

    setStatus("loading");

    const onLoad = () => setStatus("loaded");
    const onError = () => setStatus("error");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [ready, src, iosSrc, alt]);

  function handleRetry() {
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("src");
    requestAnimationFrame(() => {
      el.setAttribute("src", src);
    });
    setStatus("loading");
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <model-viewer ref={ref} />
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      )}
      {status === "error" && (
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
    </div>
  );
}