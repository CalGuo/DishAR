import { redirect } from "next/navigation";
import { getCurrentUser, getRestaurantForUser } from "@/lib/auth";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await getRestaurantForUser(user.id);
  if (existing) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Create your restaurant</h1>
          <p className="mt-2 text-sm text-zinc-500">
            You&apos;re almost set up. Pick a name and a unique URL for your AR
            menu.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}