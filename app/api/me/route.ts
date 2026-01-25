import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    user: data?.user ?? null,
    error: error ? { message: error.message } : null,
  });
}
