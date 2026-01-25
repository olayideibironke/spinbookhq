import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Legacy compatibility wrapper.
 * Keep this to avoid breaking older imports: "@/lib/server".
 * Canonical server client lives at: "@/lib/supabase/server".
 */
export async function createClient() {
  return createSupabaseServerClient();
}
