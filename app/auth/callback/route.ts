import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // Only allow relative redirects (prevents open-redirect issues)
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=missing_code`, url.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Keep error small + URL-safe
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_failed&message=${msg}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
