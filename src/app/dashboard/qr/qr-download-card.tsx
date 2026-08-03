"use client";

import { useState } from "react";

type Props = {
  qrPng: string;
  qrSvg: string;
  logoUrl: string | null;
  slug: string;
};

function triggerDownload(source: string, filename: string) {
  const a = document.createElement("a");
  a.href = source;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function composePng(qrPng: string, logoUrl: string | null): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas is not supported here."));

    const finish = (image: HTMLImageElement | null) => {
      if (image) ctx.drawImage(image, 0, 0, 512, 512);
      if (logoUrl) {
        const logo = new Image();
        logo.onload = () => {
          const s = 112;
          const x = (512 - s) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(256, 256, 74, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.clip();
          ctx.drawImage(logo, x, x, s, s);
          ctx.restore();
          canvas.toBlob(
            (b) =>
              b ? resolve(b) : reject(new Error("PNG encoding failed.")),
            "image/png"
          );
        };
        logo.onerror = () => {
          canvas.toBlob(
            (b) =>
              b ? resolve(b) : reject(new Error("PNG encoding failed.")),
            "image/png"
          );
        };
        logo.src = logoUrl;
      } else {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("PNG encoding failed."))),
          "image/png"
        );
      }
    };

    const base = new Image();
    base.onload = () => finish(base);
    base.onerror = () => reject(new Error("Could not read the QR code."));
    base.src = qrPng;
  });
}

function composeSvg(qrSvg: string, logoUrl: string | null): string {
  if (!logoUrl) return qrSvg;
  const viewBox = qrSvg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);
  const size = viewBox
    ? Math.max(Number(viewBox[1]), Number(viewBox[2]))
    : 512;
  const logoSize = size * 0.22;
  const inset = (size - logoSize) / 2;
  const center = size / 2;
  const radius = logoSize * 0.72;
  const overlay = `<g><circle cx="${center}" cy="${center}" r="${radius}" fill="#ffffff"/><image x="${inset}" y="${inset}" width="${logoSize}" height="${logoSize}" href="${logoUrl}" preserveAspectRatio="xMidYMid slice"/></g>`;
  return qrSvg.replace(/<\/svg>/, `${overlay}</svg>`);
}

export function QrDownloadCard({
  qrPng,
  qrSvg,
  logoUrl,
  slug,
}: Props) {
  const [busy, setBusy] = useState<"png" | "svg" | null>(null);

  async function downloadPng() {
    setBusy("png");
    try {
      const blob = await composePng(qrPng, logoUrl);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${slug}-qr.png`);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  function downloadSvg() {
    setBusy("svg");
    try {
      const svg = composeSvg(qrSvg, logoUrl);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${slug}-qr.svg`);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy !== null}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {busy === "png" ? "Generating…" : `Download PNG${logoUrl ? " with logo" : ""}`}
      </button>
      <button
        type="button"
        onClick={downloadSvg}
        disabled={busy !== null}
        className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
      >
        {busy === "svg" ? "Generating…" : "Download SVG (print-ready)"}
      </button>
    </div>
  );
}