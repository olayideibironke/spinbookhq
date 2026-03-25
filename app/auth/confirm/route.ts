// FILE: app/auth/confirm/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
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

function normalizeNext(next: string | null, type: EmailOtpType | null) {
  if (next && next.startsWith("/")) {
    return next;
  }

  if (type === "recovery") {
    return "/reset-password";
  }

  return "/dashboard/profile";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const safeNext = normalizeNext(next, type);

  if (!token_hash || !type) {
    return NextResponse.redirect(
      buildLoginRedirect(origin, "Missing confirmation details. Please request a new email.")
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      buildLoginRedirect(
        origin,
        "This email link is invalid or has expired. Please request a new one."
      )
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = safeNext;
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("next");

  return NextResponse.redirect(redirectUrl);
}