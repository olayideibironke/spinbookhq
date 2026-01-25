import { createClient } from "@/lib/supabase/server";

/**
 * Auth helper (server-side).
 * Uses the canonical Supabase server client (SSR + cookies).
 */
export async function getUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user ?? null;
}
