import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDjProfile } from "@/lib/djProfiles";
import { createClient } from "@/lib/supabase/server";

type SocialPlatform = "instagram" | "facebook" | "x" | "snapchat" | "website";

type ParsedSocial = {
  platform: SocialPlatform;
  label: string;
  href: string;
  storage: string;
};

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function getProfileGallery(profile: any) {
  const rawGallery = Array.isArray(profile?.gallery_urls)
    ? profile.gallery_urls.filter(
        (url: unknown): url is string =>
          typeof url === "string" && url.trim().length > 0
      )
    : [];

  const avatar =
    isNonEmptyString(profile?.avatar_url) &&
    !rawGallery.includes(String(profile?.avatar_url))
      ? [String(profile?.avatar_url)]
      : [];

  return [...avatar, ...rawGallery];
}

function cleanHandle(value: string) {
  const stripped = value.trim().replace(/\s+/g, "").replace(/^@+/, "");
  if (!stripped) return "";
  return `@${stripped}`;
}

function extractPrimaryPathnamePart(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  return segments[0] ?? "";
}

function buildSocialHref(platform: SocialPlatform, labelOrUrl: string) {
  if (platform === "website") {
    return labelOrUrl;
  }

  const handle = labelOrUrl.replace(/^@/, "");

  if (platform === "instagram") {
    return `https://www.instagram.com/${handle}`;
  }

  if (platform === "facebook") {
    return `https://www.facebook.com/${handle}`;
  }

  if (platform === "x") {
    return `https://x.com/${handle}`;
  }

  return `https://www.snapchat.com/add/${handle}`;
}

function parseSocialValue(value: unknown): ParsedSocial | null {
  if (!isNonEmptyString(value)) return null;

  const raw = String(value).trim();
  const prefixedMatch = raw.match(/^([a-zA-Z]+)\s*:\s*(.+)$/);

  if (prefixedMatch) {
    const prefix = prefixedMatch[1].toLowerCase();
    const payload = prefixedMatch[2].trim();

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
        const href = url.toString();
        return {
          platform: "website",
          label: url.hostname.replace(/^www\./i, ""),
          href,
          storage: `website:${href}`,
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

    const label = cleanHandle(payload);
    if (!label) return null;

    return {
      platform,
      label,
      href: buildSocialHref(platform, label),
      storage: `${platform}:${label}`,
    };
  }

  if (raw.startsWith("@")) {
    const label = cleanHandle(raw);
    if (!label) return null;

    return {
      platform: "instagram",
      label,
      href: buildSocialHref("instagram", label),
      storage: `instagram:${label}`,
    };
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");

      if (host.includes("instagram.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "instagram",
          label,
          href: buildSocialHref("instagram", label),
          storage: `instagram:${label}`,
        };
      }

      if (host === "fb.com" || host.includes("facebook.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "facebook",
          label,
          href: buildSocialHref("facebook", label),
          storage: `facebook:${label}`,
        };
      }

      if (host === "x.com" || host.includes("twitter.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "x",
          label,
          href: buildSocialHref("x", label),
          storage: `x:${label}`,
        };
      }

      if (host.includes("snapchat.com")) {
        const segments = url.pathname.split("/").filter(Boolean);
        const snapTarget =
          segments[0] === "add" && segments[1] ? segments[1] : segments[0] ?? "";
        const label = cleanHandle(snapTarget);
        if (!label) return null;

        return {
          platform: "snapchat",
          label,
          href: buildSocialHref("snapchat", label),
          storage: `snapchat:${label}`,
        };
      }

      return {
        platform: "website",
        label: url.hostname.replace(/^www\./i, ""),
        href: url.toString(),
        storage: `website:${url.toString()}`,
      };
    } catch {
      return null;
    }
  }

  return null;
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const wrap =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white";

  if (platform === "instagram") {
    return (
      <span className={wrap} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      </span>
    );
  }

  if (platform === "facebook") {
    return (
      <span className={wrap} aria-hidden="true">
        <span className="text-sm font-black leading-none">f</span>
      </span>
    );
  }

  if (platform === "x") {
    return (
      <span className={wrap} aria-hidden="true">
        <span className="text-sm font-black leading-none">X</span>
      </span>
    );
  }

  if (platform === "snapchat") {
    return (
      <span className={wrap} aria-hidden="true">
        <span className="text-[11px] font-black leading-none">SC</span>
      </span>
    );
  }

  return (
    <span className={wrap} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

export default async function DashboardPage(props: {
  searchParams?: Promise<{ msg?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?dj=1");

  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const msg = resolvedSearchParams?.msg
    ? decodeURIComponent(resolvedSearchParams.msg)
    : null;

  const profile = await getDjProfile(user.id);

  if (!profile) {
    redirect("/dashboard/profile");
  }

  const supabase = await createClient();
  const { count: newRequestsCount } = await supabase
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("dj_user_id", user.id)
    .eq("status", "new");

  const p = profile as any;
  const gallery = getProfileGallery(p);
  const social = parseSocialValue(p.social_handle);

  const checklist = [
    { label: "At least 3 photos", ok: gallery.length >= 3 },
    { label: "Stage name", ok: isNonEmptyString(p.stage_name) },
    { label: "Instagram / Facebook / X / Snapchat / Website", ok: isNonEmptyString(p.social_handle) },
    { label: "City", ok: isNonEmptyString(p.city) },
    {
      label: "Starting price",
      ok: p.starting_price != null && String(p.starting_price).trim() !== "",
    },
    { label: "Published", ok: Boolean(p.published) },
  ];

  const completedCount = checklist.filter((x) => x.ok).length;
  const totalCount = checklist.length;

  const isReady =
    gallery.length >= 3 &&
    isNonEmptyString(p.stage_name) &&
    isNonEmptyString(p.social_handle) &&
    isNonEmptyString(p.city) &&
    p.starting_price != null &&
    String(p.starting_price).trim() !== "" &&
    Boolean(p.published);

  const newCountSafe =
    typeof newRequestsCount === "number" && !Number.isNaN(newRequestsCount)
      ? newRequestsCount
      : 0;

  const slug = safeTrim(p.slug);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const publicPath = slug ? `/dj/${slug}` : "";
  const publicUrl = slug ? `${origin}${publicPath}` : "";

  const Card = ({ children }: { children: ReactNode }) => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      {children}
    </div>
  );

  const Pill = ({
    children,
    tone = "neutral",
  }: {
    children: ReactNode;
    tone?: "neutral" | "primary" | "success";
  }) => {
    const base =
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";
    const cls =
      tone === "primary"
        ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
        : tone === "success"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
        : "border-white/10 bg-white/[0.03] text-white/70";
    return <span className={`${base} ${cls}`}>{children}</span>;
  };

  return (
    <main className="mx-auto max-w-6xl px-2 sm:px-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-sm text-white/65">
          You are signed in as:{" "}
          <span className="font-semibold text-white/85">{user.email}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={isReady ? "success" : "neutral"}>
            Status: {isReady ? "Ready" : "Incomplete"}
          </Pill>

          {newCountSafe > 0 ? (
            <Pill tone="primary">{newCountSafe} NEW</Pill>
          ) : (
            <Pill>No new requests</Pill>
          )}
        </div>
      </div>

      {msg ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/80">
          {msg}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr,0.95fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
                YOUR DJ PROFILE
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                {p.stage_name || "Untitled DJ"}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                {p.city || "City not added yet"}
              </p>

              {social ? (
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/[0.06]"
                >
                  <SocialIcon platform={social.platform} />
                  <span>{social.label}</span>
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
              >
                Edit profile
              </Link>

              {slug ? (
                <Link
                  href={`/dj/${slug}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110"
                >
                  View public page →
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
            <div>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {gallery.map((url: string, index: number) => (
                    <div
                      key={`${url}-${index}`}
                      className={index === 0 ? "col-span-2" : ""}
                    >
                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                        <div className="aspect-[3/4] w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`DJ photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
                  No profile photos uploaded yet.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-white/55">
                  STARTING PRICE
                </p>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {p.starting_price ? `From $${p.starting_price}` : "Not added yet"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-white/55">
                  PUBLIC LINK
                </p>
                {slug ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="break-all font-mono text-xs text-white/80">
                      {publicUrl}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/65">
                    Your public link will appear after your slug is created.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-white/55">
                  BIO
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                  {isNonEmptyString(p.bio)
                    ? p.bio
                    : "No bio added yet. Add a short bio to make your DJ profile feel stronger and more credible."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Booking Requests</h2>
                <p className="mt-1 text-sm text-white/65">
                  New requests:{" "}
                  <span className="font-semibold text-white/85">
                    {newCountSafe}
                  </span>
                </p>
              </div>

              <Link
                href="/dashboard/requests"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110"
              >
                View requests →
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-semibold text-white/85">Quick tip</p>
              <p className="mt-2 text-sm text-white/65">
                Respond quickly to new requests. The faster you respond, the stronger your booking conversion chances.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Profile completion</h2>
                <p className="mt-1 text-sm text-white/65">
                  {completedCount}/{totalCount} complete •{" "}
                  <span className="font-semibold text-white/80">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </p>
              </div>

              <Pill tone={isReady ? "success" : "neutral"}>
                {isReady ? "Live-ready" : "Needs updates"}
              </Pill>
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-white/75">{item.label}</span>
                  <span className="text-xs text-white/70">{item.ok ? "✅" : "—"}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-white/65">
              More photos and a polished bio usually make the profile feel stronger to clients.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}