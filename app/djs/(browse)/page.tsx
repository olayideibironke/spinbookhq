import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjProfile = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  avatar_url: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "D";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function formatFromPrice(value: number) {
  return `From $${value}`;
}

/**
 * Media layout:
 * - Background: blurred cover
 * - Foreground: full image, no crop
 */
function MediaNoGaps({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
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
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

export default async function BrowseDjsPage() {
  const supabase = await createClient();

  const { data: djs, error } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, avatar_url")
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

  const safeDjs =
    djs?.filter(
      (dj) => typeof dj.slug === "string" && dj.slug.trim().length > 0
    ) ?? [];

  const featured = safeDjs.slice(0, 3).map((dj, idx) => {
    const name = (dj.stage_name ?? "DJ").trim() || "DJ";
    const city = (dj.city ?? "").trim();
    const slug = (dj.slug ?? "").trim();

    const price = idx === 0 ? 400 : idx === 1 ? 350 : 300;
    const fallback =
      idx === 0 ? "/dj-1.jpg" : idx === 1 ? "/dj-2.jpg" : "/dj-3.jpg";

    return {
      ...dj,
      name,
      city,
      slug,
      price,
      imageSrc: (dj.avatar_url && dj.avatar_url.trim()) || fallback,
    };
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
              DJ MARKETPLACE
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white">
              Find the right DJ for your event
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Browse published DJ profiles. View pricing, check availability,
              and request a booking in minutes.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/75">
            {safeDjs.length} DJs Available
          </span>
        </div>

        {/* Featured */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
          <h2 className="text-3xl font-extrabold text-white">
            Featured DJs
          </h2>
          <p className="mt-2 text-sm text-white/65">
            Popular DJs with active profiles and booking-ready setups.
          </p>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {featured[0] && (
              <Link
                href={`/dj/${featured[0].slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
              >
                <div className="h-[320px] sm:h-[420px]">
                  <MediaNoGaps
                    src={featured[0].imageSrc}
                    alt={`${featured[0].name} featured`}
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-extrabold text-white">
                        {featured[0].name}
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        {featured[0].city || "—"}
                      </p>
                    </div>

                    <span className="rounded-2xl bg-fuchsia-500 px-5 py-3 text-sm font-extrabold text-white">
                      Request Booking →
                    </span>
                  </div>
                </div>
              </Link>
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
                        <MediaNoGaps
                          src={dj.imageSrc}
                          alt={`${dj.name} featured`}
                        />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xl font-extrabold text-white">
                              {dj.name}
                            </p>
                            <p className="mt-1 text-sm text-white/70">
                              {dj.city || "—"}
                            </p>
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
          <p className="mt-1 text-sm text-white/65">
            Click a DJ to view their profile and request a booking.
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeDjs.map((dj) => {
              const name = (dj.stage_name ?? "DJ").trim() || "DJ";
              const city = (dj.city ?? "").trim();
              const slug = (dj.slug ?? "").trim();

              return (
                <li
                  key={dj.user_id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur transition hover:-translate-y-[1px]"
                >
                  <div className="flex items-start gap-4">
                    {dj.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dj.avatar_url}
                        alt={`${name} avatar`}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                        <span className="text-sm font-extrabold text-white/85">
                          {initials(name)}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-extrabold text-white">
                        {name}
                      </h4>
                      <p className="mt-1 truncate text-sm text-white/65">
                        {city || "—"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dj/${slug}`}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
                  >
                    Request Booking →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
