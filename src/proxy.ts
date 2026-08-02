import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 "proxy" (formerly middleware): refreshes the Supabase session cookie
 * and does coarse route redirects. This is a routing convenience only — real
 * authorization is enforced server-side in layouts, pages, and server actions.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|usdz|css|js)$).*)",
  ],
};