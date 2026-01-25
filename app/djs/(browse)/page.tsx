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
 * ✅ No-letterbox, no-crop layout:
 * - Foreground: object-contain (shows full photo)
 * - Background: same image, blurred + cover (fills space)
 * IMPORTANT: keep this component at z-0 so overlays can sit above it.
 */
function MediaNoGaps({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative z-0 h-full w-full overflow-hidden ${className}`}>
      {/* Blurred background fill */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

      {/* Foreground full image (no crop) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 z-0 h-full w-full object-contain"
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Browse DJs
        </h1>
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

    const imageSrc = (dj.avatar_url && dj.avatar_url.trim()) || fallback;

    return {
      ...dj,
      name,
      city,
      slug,
      price,
      imageSrc,
    };
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
              <span className="text-sm font-extrabold text-white">S</span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
                MARKETPLACE
              </p>
              <h1 className="truncate text-lg font-extrabold tracking-tight text-white">
                Browse DJs
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
              <span className="opacity-70">Live</span> {safeDjs.length}
            </span>

            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
            >
              ← Back home
            </Link>
          </div>
        </div>

        {/* Hero / Featured */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-fuchsia-300">
                FEATURED DJS
              </p>

              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Top-Rated{" "}
                <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
                  Talent
                </span>
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                Discover standout DJs with published profiles and a verified
                booking flow. Premium look, clean experience.
              </p>
            </div>

            <Link
              href="#all-djs"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-transparent px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-white/5"
            >
              View All DJs
            </Link>
          </div>

          {/* Featured cards */}
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {/* Big feature */}
            {featured[0] ? (
              <Link
                href={`/dj/${featured[0].slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
              >
                <div className="h-[320px] w-full sm:h-[420px]">
                  <MediaNoGaps
                    src={featured[0].imageSrc}
                    alt={`${featured[0].name} featured`}
                  />
                </div>

                {/* ✅ overlays always above images */}
                <div className="absolute left-5 top-5 z-20 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-fuchsia-500/90 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                    Featured
                  </span>
                </div>

                <div className="absolute right-5 top-5 z-20">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-extrabold text-white">
                    {formatFromPrice(featured[0].price)}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-extrabold text-white">
                        {featured[0].name}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/70">
                        {featured[0].city ? featured[0].city : "—"}
                      </p>
                    </div>

                    <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-5 text-sm font-extrabold text-white ring-1 ring-white/10 transition group-hover:bg-white/15">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-base font-semibold text-white">
                  No featured DJs yet
                </p>
                <p className="mt-2 text-sm text-white/65">
                  Publish a profile to appear in featured.
                </p>
              </div>
            )}

            {/* Two smaller */}
            <div className="grid gap-4">
              {[featured[1], featured[2]].map((dj, i) =>
                dj ? (
                  <Link
                    key={dj.user_id}
                    href={`/dj/${dj.slug}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
                  >
                    <div className="h-[152px] w-full sm:h-[200px]">
                      <MediaNoGaps src={dj.imageSrc} alt={`${dj.name} featured`} />
                    </div>

                    <div className="absolute right-4 top-4 z-20">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-extrabold text-white">
                        {formatFromPrice(dj.price)}
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-xl font-extrabold text-white">
                            {dj.name}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/70">
                            {dj.city ? dj.city : "—"}
                          </p>
                        </div>

                        <span className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 transition group-hover:bg-white/15">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={`empty-${i}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <p className="text-sm font-semibold text-white">
                      Add more DJs to feature
                    </p>
                    <p className="mt-2 text-sm text-white/65">
                      Publish at least 3 profiles to fill this space.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Empty state */}
        {safeDjs.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
            <p className="text-base font-semibold text-white">
              No DJs published yet
            </p>
            <p className="mt-2 text-sm text-white/65">
              When DJs publish their profiles, they’ll show up here.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110"
              >
                Join as a DJ
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.06]"
              >
                Learn more
              </Link>
            </div>
          </div>
        )}

        {/* All DJs */}
        <div id="all-djs" className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-white">
                All DJs
              </h3>
              <p className="mt-1 text-sm text-white/65">
                Browse published profiles. Click a DJ to view details and request
                booking.
              </p>
            </div>

            <div className="text-xs text-white/50">
              Showing{" "}
              <span className="font-semibold text-white/70">
                {safeDjs.length}
              </span>{" "}
              profiles
            </div>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeDjs.map((dj) => {
              const name = (dj.stage_name ?? "DJ").trim() || "DJ";
              const city = (dj.city ?? "").trim();
              const slug = (dj.slug ?? "").trim();

              return (
                <li
                  key={dj.user_id}
                  className={[
                    "group rounded-3xl border border-white/10 bg-white/[0.04] p-5",
                    "shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur transition",
                    "hover:-translate-y-[1px] hover:bg-white/[0.06]",
                  ].join(" ")}
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
                      <h2 className="truncate text-base font-extrabold text-white">
                        {name}
                      </h2>

                      <p className="mt-1 truncate text-sm text-white/65">
                        {city ? city : "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
                          Public profile
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
                          Deposit flow
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/dj/${slug}`}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition group-hover:brightness-110"
                    >
                      View Profile →
                    </Link>

                    <span className="text-xs text-white/50">
                      {slug ? `@${slug}` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="pointer-events-none mx-auto mt-12 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>
    </main>
  );
}
