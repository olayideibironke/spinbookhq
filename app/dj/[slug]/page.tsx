import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { slug: string };

function pickDisplayName(profile: any, slug: string) {
  return (
    profile?.display_name ||
    profile?.stage_name ||
    profile?.dj_name ||
    profile?.name ||
    slug
  );
}

function isProfilePublished(profile: any) {
  // Supports either column name: published OR is_published
  const v = profile?.published ?? profile?.is_published ?? false;
  return Boolean(v);
}

function pickBio(profile: any) {
  return profile?.bio || profile?.about || profile?.description || null;
}

function pickLocation(profile: any) {
  return profile?.location || profile?.city || profile?.base_location || null;
}

function pickGenres(profile: any) {
  const genresRaw = profile?.genres ?? profile?.genre ?? null;
  const genres =
    Array.isArray(genresRaw)
      ? genresRaw
      : typeof genresRaw === "string"
      ? genresRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  return genres;
}

function shortText(input: string, max = 160) {
  const s = input.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

async function fetchDjBySlug(slug: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !profile) return null;
  return profile;
}

async function canViewerSeeProfile(profile: any) {
  if (!profile) return { allowed: false as const, isOwner: false as const };

  // Public if published
  if (isProfilePublished(profile)) {
    return { allowed: true as const, isOwner: false as const };
  }

  // If not published: allow ONLY the owner (logged in user matches profile.user_id)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(user?.id && profile?.user_id && user.id === profile.user_id);

  return { allowed: isOwner, isOwner };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params> | Params;
}): Promise<Metadata> {
  const { slug } =
    typeof (params as any)?.then === "function"
      ? await (params as Promise<Params>)
      : (params as Params);

  if (!slug) {
    return {
      title: "DJ not found | SpinBook HQ",
      description: "DJ profile not found.",
    };
  }

  const profile = await fetchDjBySlug(slug);
  const visibility = await canViewerSeeProfile(profile);

  if (!profile || !visibility.allowed) {
    return {
      title: "DJ not found | SpinBook HQ",
      description: "This DJ profile doesn’t exist or isn’t published yet.",
    };
  }

  const name = pickDisplayName(profile, slug);
  const location = pickLocation(profile);
  const bio = pickBio(profile);
  const genres = pickGenres(profile);

  const baseTitle = `${name} | SpinBook HQ`;
  const locationPart = location ? ` in ${location}` : "";
  const genresPart = genres.length ? ` • ${genres.slice(0, 3).join(", ")}` : "";

  const description = bio
    ? shortText(bio, 170)
    : `Book ${name}${locationPart}. Browse DJs and request bookings on SpinBook HQ.${genresPart}`;

  return {
    title: baseTitle,
    description,
    alternates: {
      canonical: `/dj/${slug}`,
    },
  };
}

export default async function DjPublicProfilePage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const { slug } =
    typeof (params as any)?.then === "function"
      ? await (params as Promise<Params>)
      : (params as Params);

  if (!slug) notFound();

  const profile = await fetchDjBySlug(slug);
  const visibility = await canViewerSeeProfile(profile);

  if (!profile || !visibility.allowed) notFound();

  const name = pickDisplayName(profile, slug);
  const bio = pickBio(profile);
  const location = pickLocation(profile);
  const genres = pickGenres(profile);

  const published = isProfilePublished(profile);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Top hero card */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-4xl font-extrabold tracking-tight text-white">
                {name}
              </h1>

              {published ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
                  Public profile
                </span>
              ) : visibility.isOwner ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
                  DRAFT (not published)
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-white/60">@{slug}</p>

            {(location || genres.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                {location && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/70">
                    {location}
                  </span>
                )}

                {genres.slice(0, 6).map((g: string) => (
                  <span
                    key={g}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/70"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={`/dj/${slug}/book`}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            >
              Request booking →
            </Link>

            <p className="text-xs text-white/55">
              Typical response: within 24–48 hrs
            </p>

            {!published && visibility.isOwner ? (
              <p className="mt-1 text-xs text-white/55">
                Only you can see this until you publish it.
              </p>
            ) : null}
          </div>
        </div>

        {/* Subtle divider */}
        <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Mini info row */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Booking flow</p>
            <p className="mt-1 text-sm text-white/80">
              Request → accept → deposit
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Deposits</p>
            <p className="mt-1 text-sm text-white/80">
              Secure checkout via Stripe
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Professional</p>
            <p className="mt-1 text-sm text-white/80">DJ profile</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <h2 className="text-xl font-extrabold tracking-tight text-white">
          About
        </h2>

        {bio ? (
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-white/75">
            {bio}
          </p>
        ) : (
          <p className="mt-4 text-sm text-white/60">
            This DJ hasn’t added a bio yet — send a booking request to get
            details.
          </p>
        )}
      </section>

      {/* Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
        <Link
          href="/djs/browse"
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
        >
          ← Back to DJs
        </Link>

        <Link
          href={`/dj/${slug}/book`}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110"
        >
          Request booking →
        </Link>
      </div>
    </main>
  );
}
