// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard/profile";

  // Only allow relative redirects (prevents open-redirect issues)
  const safeNext = next.startsWith("/") ? next : "/dashboard/profile";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=missing_code`, url.origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_failed&message=${msg}`, url.origin)
    );
  }

  // ✅ After confirm/signup callback, ALWAYS land inside onboarding
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
