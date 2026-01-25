import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = {
  id: string;
};

export default async function LegacyDjUuidPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const { id } =
    typeof (params as any)?.then === "function" ? await (params as Promise<Params>) : (params as Params);

  // Safety: if no id, send to browse
  if (!id) redirect("/djs");

  const supabase = await createClient();

  /**
   * IMPORTANT:
   * This route exists ONLY to redirect legacy UUID links:
   *   /djs/<uuid>  -->  /dj/<slug>
   *
   * Adjust the table/columns below ONLY if your schema differs.
   */
  const { data, error } = await supabase
    .from("dj_profiles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.slug) {
    // If the UUID doesn't map to a DJ, send them to browse
    redirect("/djs");
  }

  redirect(`/dj/${data.slug}`);
}
