import { createClient } from "@/lib/server";

export async function getDjProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data; // null if none
}
