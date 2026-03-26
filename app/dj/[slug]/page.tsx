import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { slug: string };
type SocialPlatform = "instagram" | "facebook" | "x" | "snapchat" | "website";

function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spinbookhq.com";
  return raw.replace(/\/+$/, "");
}

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
  const v = profile?.published ?? profile?.is_published ?? false;
  return Boolean(v);
}

function pickBio(profile: any) {
  return profile?.bio || profile?.about || profile?.description || null;
}

function pickLocation(profile: any) {
  const city =
    profile?.city ??
    profile?.town ??
    profile?.locality ??
    profile?.base_city ??
    null;

  const region =
    profile?.state ??
    profile?.region ??
    profile?.province ??
    profile?.state_province ??
    profile?.base_region ??
    null;

  const country =
    profile?.country ?? profile?.nation ?? profile?.base_country ?? null;

  const parts = [city, region, country]
    .map((v) => (typeof v === "string" ? v.trim() : v))
    .filter(Boolean) as string[];

  if (parts.length) {
    const unique: string[] = [];
    for (const p of parts) {
      if (!unique.some((u) => u.toLowerCase() === p.toLowerCase())) {
        unique.push(p);
      }
    }
    return unique.join(" • ");
  }

  const fallback =
    profile?.location || profile?.base_location || profile?.city || null;

  return typeof fallback === "string" ? fallback.trim() : fallback;
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

  const seen = new Set<string>();
  const clean: string[] = [];

  for (const g of genres) {
    const key = String(g).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    clean.push(String(g).trim());
  }

  return clean;
}

function pickStartingPrice(profile: any) {
  const raw = profile?.starting_price ?? profile?.price_from ?? profile?.price;
  const n =
    typeof raw === "string" ? Number(raw.replace(/[^\d]/g, "")) : Number(raw);

  if (!Number.isFinite(n)) return null;

  const int = Math.floor(n);
  return int > 0 ? int : null;
}

function formatUsd(amount: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function shortText(input: string, max = 160) {
  const s = input.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function pickGallery(profile: any) {
  const gallery = Array.isArray(profile?.gallery_urls)
    ? profile.gallery_urls.filter(
        (url: unknown) => typeof url === "string" && url.trim().length > 0
      )
    : [];

  const avatar =
    typeof profile?.avatar_url === "string" && profile.avatar_url.trim().length > 0
      ? profile.avatar_url.trim()
      : null;

  if (avatar && !gallery.includes(avatar)) {
    return [avatar, ...gallery];
  }

  return gallery;
}

function pickMainImage(profile: any) {
  const gallery = pickGallery(profile);
  return gallery[0] ?? null;
}

function cleanHandle(value: string) {
  const stripped = value.trim().replace(/^@+/, "").replace(/\s+/g, "");
  if (!stripped) return "";
  return `@${stripped}`;
}

function extractPathPart(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[0] ?? "";
}

function parseSocial(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const prefixed = raw.match(/^([a-zA-Z]+)\s*:\s*(.+)$/);
  if (prefixed) {
    const prefix = prefixed[1].toLowerCase();
    const payload = prefixed[2].trim();

    if (
      prefix === "website" ||
      prefix === "site" ||
      prefix === "web" ||
      prefix === "url"
    ) {
      try {
        const url = new URL(
          /^https?:\/\//i.test(payload) ? payload : `https://${payload}`
        );
        return {
          platform: "website" as SocialPlatform,
          label: url.hostname.replace(/^www\./i, ""),
          href: url.toString(),
        };
      } catch {
        return null;
      }
    }

    const map: Record<string, SocialPlatform> = {
      instagram: "instagram",
      ig: "instagram",
      facebook: "facebook",
      fb: "facebook",
      x: "x",
      twitter: "x",
      snapchat: "snapchat",
      snap: "snapchat",
    };

    const platform = map[prefix];
    if (!platform) return null;

    if (/^https?:\/\//i.test(payload)) {
      try {
        const url = new URL(payload);
        const handle = cleanHandle(extractPathPart(url));
        if (!handle) return null;

        const href =
          platform === "instagram"
            ? `https://www.instagram.com/${handle.replace(/^@/, "")}`
            : platform === "facebook"
            ? `https://www.facebook.com/${handle.replace(/^@/, "")}`
            : platform === "x"
            ? `https://x.com/${handle.replace(/^@/, "")}`
            : `https://www.snapchat.com/add/${handle.replace(/^@/, "")}`;

        return { platform, label: handle, href };
      } catch {
        return null;
      }
    }

    const handle = cleanHandle(payload);
    if (!handle) return null;

    const href =
      platform === "instagram"
        ? `https://www.instagram.com/${handle.replace(/^@/, "")}`
        : platform === "facebook"
        ? `https://www.facebook.com/${handle.replace(/^@/, "")}`
        : platform === "x"
        ? `https://x.com/${handle.replace(/^@/, "")}`
        : `https://www.snapchat.com/add/${handle.replace(/^@/, "")}`;

    return { platform, label: handle, href };
  }

  if (/^https?:\/\//i.test(raw) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");

      if (host.includes("instagram.com")) {
        const handle = cleanHandle(extractPathPart(url));
        if (!handle) return null;
        return {
          platform: "instagram" as SocialPlatform,
          label: handle,
          href: `https://www.instagram.com/${handle.replace(/^@/, "")}`,
        };
      }

      if (host === "fb.com" || host.includes("facebook.com")) {
        const handle = cleanHandle(extractPathPart(url));
        if (!handle) return null;
        return {
          platform: "facebook" as SocialPlatform,
          label: handle,
          href: `https://www.facebook.com/${handle.replace(/^@/, "")}`,
        };
      }

      if (host === "x.com" || host.includes("twitter.com")) {
        const handle = cleanHandle(extractPathPart(url));
        if (!handle) return null;
        return {
          platform: "x" as SocialPlatform,
          label: handle,
          href: `https://x.com/${handle.replace(/^@/, "")}`,
        };
      }

      if (host.includes("snapchat.com")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const snapTarget =
          parts[0] === "add" && parts[1] ? parts[1] : parts[0] ?? "";
        const handle = cleanHandle(snapTarget);
        if (!handle) return null;
        return {
          platform: "snapchat" as SocialPlatform,
          label: handle,
          href: `https://www.snapchat.com/add/${handle.replace(/^@/, "")}`,
        };
      }

      return {
        platform: "website" as SocialPlatform,
        label: url.hostname.replace(/^www\./i, ""),
        href: url.toString(),
      };
    } catch {
      return null;
    }
  }

  if (raw.startsWith("@")) {
    const handle = cleanHandle(raw);
    if (!handle) return null;
    return {
      platform: "instagram" as SocialPlatform,
      label: handle,
      href: `https://www.instagram.com/${handle.replace(/^@/, "")}`,
    };
  }

  return null;
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M13.5 20v-6h2.2l.3-2.5h-2.5V9.9c0-.8.2-1.4 1.4-1.4H16V6.2c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.3v2.1H9v2.5h2.3v6h2.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (platform === "x") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M4 4h3.8l4.1 5.5L16.8 4H20l-6.5 7.3L20.6 20h-3.8l-4.4-5.9L7 20H3.8l6.9-7.7L4 4Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (platform === "snapchat") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M12 4.2c2.5 0 4.2 2 4.2 4.4v1.5c0 .4.2.8.5 1 .3.2.8.4 1.2.5.3.1.5.3.5.6 0 .7-1 .9-1.7 1.1-.5.1-.9.5-1 .9-.2.8-.7 1.2-1.5 1.2-.4 0-.6.2-.7.5l-.2.6c-.2.6-.7 1-1.3 1s-1.1-.4-1.3-1l-.2-.6c-.1-.3-.3-.5-.7-.5-.8 0-1.3-.4-1.5-1.2-.1-.4-.5-.8-1-.9-.7-.2-1.7-.4-1.7-1.1 0-.3.2-.5.5-.6.4-.1.9-.3 1.2-.5.3-.2.5-.6.5-1V8.6C7.8 6.2 9.5 4.2 12 4.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
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

  if (isProfilePublished(profile)) {
    return { allowed: true as const, isOwner: false as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(
    user?.id && profile?.user_id && user.id === profile.user_id
  );

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

  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/dj/${slug}`;
  const name = pickDisplayName(profile, slug);
  const location = pickLocation(profile);
  const bio = pickBio(profile);
  const startingPrice = pickStartingPrice(profile);
  const mainImage = pickMainImage(profile);

  const description = bio
    ? shortText(
        `${bio}${startingPrice ? ` • Starting at ${formatUsd(startingPrice)}` : ""}${
          location ? ` • ${location}` : ""
        }`,
        170
      )
    : `Book ${name}${
        location ? ` in ${location}` : ""
      }${startingPrice ? ` • Starting at ${formatUsd(startingPrice)}` : ""} on SpinBook HQ.`;

  return {
    title: `${name} | SpinBook HQ`,
    description,
    alternates: {
      canonical: `/dj/${slug}`,
    },
    openGraph: {
      title: `${name} | SpinBook HQ`,
      description,
      url: profileUrl,
      siteName: "SpinBook HQ",
      type: "profile",
      images: mainImage
        ? [
            {
              url: mainImage,
              width: 1200,
              height: 1600,
              alt: `${name} profile photo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: mainImage ? "summary_large_image" : "summary",
      title: `${name} | SpinBook HQ`,
      description,
      images: mainImage ? [mainImage] : undefined,
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
  const startingPrice = pickStartingPrice(profile);
  const priceLabel = startingPrice ? `From ${formatUsd(startingPrice)}` : null;
  const topGenres = genres.slice(0, 6);
  const mainImage = pickMainImage(profile);
  const social = parseSocial(profile?.social_handle);
  const extraGallery = pickGallery(profile).slice(1, 5);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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

            {social ? (
              <div className="mt-4">
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
                >
                  <span className="text-white/70">
                    <SocialIcon platform={social.platform} />
                  </span>
                  <span>{social.label}</span>
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/60">@{slug}</p>
            )}

            {location ? (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/70">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4 text-white/60"
                  >
                    <path
                      d="M12 21s-7-4.35-7-11a7 7 0 1 1 14 0c0 6.65-7 11-7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                  </svg>
                  {location}
                </span>
              </div>
            ) : null}

            {topGenres.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                  GENRES
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topGenres.map((g: string) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm font-semibold text-white/80"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
                Secure deposit
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
                Fast responses
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
                Booking-ready
              </span>
            </div>

            {bio ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-white/55">
                  ABOUT
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-white/75">
                  {bio}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              {mainImage ? (
                <div className="aspect-[4/5] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainImage}
                    alt={`${name} profile`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/[0.03] text-sm text-white/45">
                  No profile photo yet
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              {priceLabel ? (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                    STARTING PRICE
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-white">
                    {priceLabel}
                  </p>
                </div>
              ) : null}

              <Link
                href={`/dj/${slug}/book`}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
              >
                Request booking →
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/djs"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.06]"
                >
                  ← Browse DJs
                </Link>

                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.06]"
                >
                  About
                </a>
              </div>

              <p className="mt-4 text-xs text-white/55">
                Typical response: within 24–48 hrs
              </p>

              {!published && visibility.isOwner ? (
                <p className="mt-2 text-xs text-white/55">
                  Only you can see this until you publish it.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Booking flow</p>
            <p className="mt-1 text-sm text-white/80">Request → accept → deposit</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Deposits</p>
            <p className="mt-1 text-sm text-white/80">Secure checkout via Stripe</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold text-white/70">Confidence</p>
            <p className="mt-1 text-sm text-white/80">Clear profile + booking request</p>
          </div>
        </div>
      </section>

      {extraGallery.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Gallery
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extraGallery.map((url: string, index: number) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                <div className="aspect-[3/4] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${name} gallery photo ${index + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!bio ? (
        <section
          id="about"
          className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-white">About</h2>
          <p className="mt-4 text-sm text-white/60">
            This DJ hasn’t added a bio yet. Send a booking request to get details.
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
        <Link
          href="/djs"
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