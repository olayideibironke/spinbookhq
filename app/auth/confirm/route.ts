import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/dashboard/profile";
  const safeNext = next.startsWith("/") ? next : "/dashboard/profile";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      buildLoginRedirect(
        url.origin,
        "Invalid or expired confirmation link. Please request a new one."
      )
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(
      buildLoginRedirect(url.origin, error.message)
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}