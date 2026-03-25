// FILE: app/auth/callback/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildLoginRedirect(origin: string, message: string) {
  const params = new URLSearchParams();
  params.set("dj", "1");
  params.set("mode", "signin");
  params.set("status", "error");
  params.set("msg", message);
  return new URL(`/login?${params.toString()}`, origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard/profile";
  const safeNext = next.startsWith("/") ? next : "/dashboard/profile";

  if (!code) {
    return NextResponse.redirect(
      buildLoginRedirect(url.origin, "Missing authentication code.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      buildLoginRedirect(url.origin, error.message)
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}