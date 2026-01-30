import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "D";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function formatFromPrice(value: number) {
  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
    return `From ${formatted}`;
  } catch {
    return `From $${value}`;
  }
}

export default async function Home() {
  const INSTAGRAM_URL = "https://www.instagram.com/spinbookhq/";
  const supabase = await createClient();

  const { data: featuredDjs } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, avatar_url, starting_price")
    .eq("published", true)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen">
      {/* HERO (unchanged) */}
      {/* ... hero code remains exactly the same ... */}

      {/* FEATURED DJs */}
      {featuredDjs && featuredDjs.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">
              FEATURED DJS
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              Book trusted professionals
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/65">
              Popular DJs with active profiles and booking-ready availability.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDjs.map((dj) => {
              const name = dj.stage_name ?? "DJ";
              const city = dj.city ?? "";
              const price =
                typeof dj.starting_price === "number"
                  ? formatFromPrice(dj.starting_price)
                  : null;

              return (
                <li
                  key={dj.user_id}
                  className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur transition hover:-translate-y-[1px]"
                >
                  {price && (
                    <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-extrabold text-white/85">
                      {price}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {dj.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dj.avatar_url}
                        alt={`${name} avatar`}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                        <span className="text-sm font-extrabold text-white">
                          {initials(name)}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold text-white">
                        {name}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/65">
                        {city || "Available nationwide"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dj/${dj.slug}`}
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
                  >
                    View profile →
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 text-center">
            <Link
              href="/djs"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
            >
              Browse all DJs →
            </Link>
          </div>
        </section>
      )}

      {/* FAQ + Instagram footer remain unchanged */}
    </main>
  );
}
