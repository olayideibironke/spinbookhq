import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for Server Components.
 * IMPORTANT: Server Components can READ cookies but cannot reliably SET them.
 * Cookie writes must happen in Route Handlers / Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        // Do NOT attempt to set cookies in Server Components.
        // If we try + swallow errors, auth appears to succeed but session never sticks → redirect loops.
        setAll() {
          // Intentionally noop. Cookie writes must happen in a Route Handler.
        },
      },
    }
  );
}
