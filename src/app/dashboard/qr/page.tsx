import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { signOut } from "@/lib/actions/restaurant";
import { QrDownloadCard } from "@/app/dashboard/qr/qr-download-card";

export const dynamic = "force-dynamic";

export default async function DashboardQrPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, logo_url")
    .eq("owner_user_id", user.id)
    .single();

  if (!restaurant) redirect("/onboarding");

  const siteUrl = await getSiteUrl();
  const menuUrl = `${siteUrl}/r/${restaurant.slug}`;

  const qrOptions = {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M" as const,
  };
  const qrDataUrl = await QRCode.toDataURL(menuUrl, qrOptions);
  const qrSvg = await QRCode.toString(menuUrl, { ...qrOptions, type: "svg" });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">QR code</h1>
          <p className="text-sm text-zinc-500">
            Print this and put it at every table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Back to dishes
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR code for ${restaurant.name}`}
          width={300}
          height={300}
          className="h-72 w-72"
        />
        <p className="text-sm text-zinc-600">
          Points to <span className="font-medium text-zinc-900">{menuUrl}</span>
        </p>
        {restaurant.logo_url && (
          <p className="text-sm text-zinc-500">
            Your logo is baked into every download.
          </p>
        )}
        <QrDownloadCard
          qrPng={qrDataUrl}
          qrSvg={qrSvg}
          logoUrl={restaurant.logo_url}
          slug={restaurant.slug}
        />
        <Link
          href={menuUrl}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Open public menu
        </Link>
      </div>
    </div>
  );
}
