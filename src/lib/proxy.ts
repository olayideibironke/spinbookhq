// web/src/lib/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional helper for middleware/route handlers that need to refresh Supabase session cookies.
 * NOTE: This does NOT require middleware to exist; it just provides a safe implementation if used.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // ✅ Only set cookies on the RESPONSE (request cookies are not reliably mutable)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session when needed (updates cookies via setAll above)
  await supabase.auth.getUser();

  return response;
}
