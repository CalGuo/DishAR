import { redirect } from "next/navigation";
import { getCurrentUser, getRestaurantForUser } from "@/lib/auth";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await getRestaurantForUser(user.id);
  if (existing) redirect("/dashboard");

  return <OnboardingForm />;
}
