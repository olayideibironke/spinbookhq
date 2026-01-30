import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjProfile = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  avatar_url: string | null;
  starting_price: number | null;
  genres?: unknown;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "D";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function toValidPrice(v: unknown): number | null {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v.replace(/[^\d]/g, ""))
      : Number(v);

  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  return int > 0 ? int : null;
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

function cleanStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function parseGenres(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Media layout:
 * - Background: blurred cover
 * - Foreground: full image, no crop
 */
function MediaNoGaps({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative z-0 h-full w-full overflow-hidden">
      {/* Background blur */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

      {/* Foreground */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain" />
    </div>
  );
}

export default async function BrowseDjsPage({
  searchParams,
}: {
  searchParams?: Promise<{ genre?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const selectedGenre = cleanStr(sp.genre);

  const supabase = await createClient();

  const { data: djs, error } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, avatar_url, starting_price, genres")
    .eq("published", true)
    .not("slug", "is", null)
    .order("stage_name", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-extrabold text-white">Browse DJs</h1>
        <p className="mt-4 text-sm text-red-300">
          Error loading DJs: <span className="font-mono">{error.message}</span>
        </p>
      </main>
    );
  }

  const safeDjs: DjProfile[] =
    djs?.filter((dj: any) => typeof dj.slug === "string" && dj.slug.trim().length > 0) ?? [];

  const enriched = safeDjs.map((dj) => {
    const name = (dj.stage_name ?? "DJ").toString().trim() || "DJ";
    const city = (dj.city ?? "").toString().trim();
    const slug = (dj.slug ?? "").toString().trim();
    const genres = parseGenres((dj as any).genres);
    const startingPrice = toValidPrice((dj as any).starting_price);
    return { ...dj, name, city, slug, genres, startingPrice };
  });

  const allGenres = Array.from(
    new Set(
      enriched
        .flatMap((dj) => dj.genres)
        .map((g) => g.trim())
        .filter(Boolean)
        .map((g) => g.toLowerCase())
    )
  )
    .map((lower) => {
      // restore nice casing by finding the first match from data
      const match = enriched.flatMap((dj) => dj.genres).find((g) => g.toLowerCase() === lower);
      return match ?? lower;
    })
    .sort((a, b) => a.localeCompare(b));

  const filtered =
    selectedGenre.length > 0
      ? enriched.filter((dj) => dj.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()))
      : enriched;

  const featured = filtered.slice(0, 3).map((dj, idx) => {
    const fallback = idx === 0 ? "/dj-1.jpg" : idx === 1 ? "/dj-2.jpg" : "/dj-3.jpg";
    return {
      ...dj,
      imageSrc: (dj.avatar_url && dj.avatar_url.trim()) || fallback,
    };
  });

  const pillBase =
    "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-extrabold text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.06]";
  const pillActive =
    "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-xs font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur";

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/60">DJ MARKETPLACE</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white">Find the right DJ for your event</h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Browse published DJ profiles. View pricing, check availability, and request a booking in minutes.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/75">
            {filtered.length} DJs Available
          </span>
        </div>

        {/* Genre filter */}
        {allGenres.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-white">Filter by genre</p>
                <p className="mt-1 text-xs text-white/60">
                  Select one genre to narrow results. More filters can come later.
                </p>
              </div>

              {selectedGenre ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70">
                  Showing: <span className="ml-2 font-extrabold text-white">{selectedGenre}</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70">
                  Showing: <span className="ml-2 font-extrabold text-white">All genres</span>
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/djs" className={!selectedGenre ? pillActive : pillBase}>
                All
              </Link>

              {allGenres.slice(0, 18).map((g) => {
                const active = selectedGenre.toLowerCase() === g.toLowerCase();
                return (
                  <Link key={g} href={`/djs?genre=${encodeURIComponent(g)}`} className={active ? pillActive : pillBase}>
                    {g}
                  </Link>
                );
              })}

              {/* If you have many genres, we keep it clean by limiting chips */}
              {allGenres.length > 18 ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold text-white/60">
                  More genres available
                </span>
              ) : null}
            </div>
          </section>
        )}

        {/* Featured */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Featured DJs</h2>
              <p className="mt-2 text-sm text-white/65">
                Popular DJs with active profiles and booking-ready setups.
              </p>
            </div>

            {selectedGenre ? (
              <Link
                href="/djs"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Clear filter
              </Link>
            ) : null}
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {featured[0] ? (
              <Link
                href={`/dj/${featured[0].slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
              >
                <div className="h-[320px] sm:h-[420px]">
                  <MediaNoGaps src={featured[0].imageSrc} alt={`${featured[0].name} featured`} />
                </div>

                {featured[0].startingPrice ? (
                  <div className="absolute right-5 top-5 z-20">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-extrabold text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                      {formatFromPrice(featured[0].startingPrice)}
                    </span>
                  </div>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 z-20 p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-extrabold text-white">{featured[0].name}</p>
                      <p className="mt-1 text-sm text-white/70">{featured[0].city || "—"}</p>
                      {featured[0].genres?.length ? (
                        <p className="mt-2 text-xs text-white/60">{featured[0].genres.slice(0, 3).join(", ")}</p>
                      ) : null}
                    </div>

                    <span className="rounded-2xl bg-fuchsia-500 px-5 py-3 text-sm font-extrabold text-white">
                      Request Booking →
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
                No featured DJs available yet.
              </div>
            )}

            <div className="grid gap-4">
              {[featured[1], featured[2]].map(
                (dj) =>
                  dj && (
                    <Link
                      key={dj.user_id}
                      href={`/dj/${dj.slug}`}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
                    >
                      <div className="h-[180px]">
                        <MediaNoGaps src={dj.imageSrc} alt={`${dj.name} featured`} />
                      </div>

                      {dj.startingPrice ? (
                        <div className="absolute right-4 top-4 z-20">
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-extrabold text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                            {formatFromPrice(dj.startingPrice)}
                          </span>
                        </div>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xl font-extrabold text-white">{dj.name}</p>
                            <p className="mt-1 text-sm text-white/70">{dj.city || "—"}</p>
                            {dj.genres?.length ? (
                              <p className="mt-2 text-xs text-white/60">{dj.genres.slice(0, 3).join(", ")}</p>
                            ) : null}
                          </div>

                          <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white">
                            View →
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
              )}
            </div>
          </div>
        </section>

        {/* All DJs */}
        <section className="mt-12">
          <h3 className="text-xl font-extrabold text-white">All DJs</h3>
          <p className="mt-1 text-sm text-white/65">Click a DJ to view their profile and request a booking.</p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dj) => {
              const startingPrice = dj.startingPrice;

              return (
                <li
                  key={dj.user_id}
                  className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur transition hover:-translate-y-[1px]"
                >
                  {startingPrice ? (
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-extrabold text-white/85 backdrop-blur">
                        {formatFromPrice(startingPrice)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-4">
                    {dj.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dj.avatar_url}
                        alt={`${dj.name} avatar`}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                        <span className="text-sm font-extrabold text-white/85">{initials(dj.name)}</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-extrabold text-white">{dj.name}</h4>
                      <p className="mt-1 truncate text-sm text-white/65">{dj.city || "—"}</p>

                      {dj.genres?.length ? (
                        <p className="mt-2 truncate text-xs text-white/55">{dj.genres.slice(0, 3).join(", ")}</p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={`/dj/${dj.slug}`}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
                  >
                    Request Booking →
                  </Link>
                </li>
              );
            })}
          </ul>

          {!filtered.length ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
              No DJs found for this filter. Try another genre.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
