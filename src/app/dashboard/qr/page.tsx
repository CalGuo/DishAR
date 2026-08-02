import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUser, getRestaurantForUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { signOut } from "@/lib/actions/restaurant";

export const dynamic = "force-dynamic";

export default async function DashboardQrPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) redirect("/onboarding");

  const siteUrl = await getSiteUrl();
  const menuUrl = `${siteUrl}/r/${restaurant.slug}`;

  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{restaurant.name} — QR code</h1>
          <p className="text-sm text-zinc-500">
            Print this and put it at every table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Back to dishes
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
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
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <a
            href={qrDataUrl}
            download={`${restaurant.slug}-qr.png`}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Download QR code
          </a>
          <Link
            href={menuUrl}
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            Open public menu
          </Link>
        </div>
      </div>
    </div>
  );
}