import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

type DjProfileRow = {
  user_id: string;
  stage_name: string | null;
  slug: string | null;
  city: string | null;
  bio: string | null;
  published: boolean | null;
  avatar_url: string | null;
  starting_price: number | null;
  gallery_urls: string[] | null;
  social_handle: string | null;
};

const MIN_BIO_WORDS = 60;

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function countWords(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getProfileGallery(profile: Partial<DjProfileRow> | null | undefined) {
  const rawGallery = Array.isArray(profile?.gallery_urls)
    ? profile.gallery_urls.filter((url): url is string => isNonEmptyString(url))
    : [];

  const avatar =
    isNonEmptyString(profile?.avatar_url) &&
    !rawGallery.includes(String(profile?.avatar_url))
      ? [String(profile?.avatar_url)]
      : [];

  return [...avatar, ...rawGallery];
}

function Card({
  title,
  children,
  right,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/65">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function DashboardProfilePage(props: {
  searchParams?: Promise<{ msg?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?dj=1");

  const supabase = await createClient();

  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const msg = resolvedSearchParams?.msg
    ? decodeURIComponent(resolvedSearchParams.msg)
    : null;

  const { data: profile } = await supabase
    .from("dj_profiles")
    .select(
      "user_id, stage_name, slug, city, bio, published, avatar_url, starting_price, gallery_urls, social_handle"
    )
    .eq("user_id", user.id)
    .maybeSingle<DjProfileRow>();

  const existingGalleryUrls = getProfileGallery(profile);
  const bioWordCount = countWords(profile?.bio);

  const isReady =
    Boolean(profile) &&
    isNonEmptyString(profile?.stage_name) &&
    isNonEmptyString(profile?.city) &&
    isNonEmptyString(profile?.social_handle) &&
    existingGalleryUrls.length >= 3 &&
    profile?.starting_price != null &&
    String(profile.starting_price).trim() !== "" &&
    bioWordCount >= MIN_BIO_WORDS;

  const hasSlug =
    profile && isNonEmptyString(profile?.slug) ? String(profile.slug).trim() : null;

  const isPublished = Boolean(profile?.published);

  return (
    <section className="w-full">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
          DASHBOARD
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Profile setup
        </h1>
        <p className="text-sm text-white/65">
          Signed in as{" "}
          <span className="font-semibold text-white/80">{user.email}</span>
        </p>
      </div>

      {msg ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/80">
          {msg}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title={profile ? "Edit your DJ profile" : "Create your DJ profile"}
            subtitle="Minimum 3 photos required. Starting price is required and must be at least $450. Bio is required and must be at least 60 words."
            right={
              isReady ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                  READY
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-extrabold text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  SETUP
                </span>
              )
            }
          >
            <ProfileForm
              initialProfile={profile}
              existingGalleryUrls={existingGalleryUrls}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card title="Quick actions" subtitle="Use these to verify your listing.">
            <div className="grid gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Back to dashboard →
              </Link>

              {hasSlug ? (
                <a
                  href={`/dj/${hasSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
                >
                  {isPublished ? "View your public page →" : "Preview (draft) →"}
                </a>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  Save your profile first to get your public page link.
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                Minimum onboarding requirements:
                <ul className="mt-2 space-y-1">
                  <li>• At least 3 photos</li>
                  <li>• Stage name</li>
                  <li>• Instagram / Facebook / X / Snapchat / Website</li>
                  <li>• City</li>
                  <li>• Starting price of at least $450</li>
                  <li>• Bio of at least 60 words</li>
                  <li>• Publish ON</li>
                </ul>
                <p className="mt-3 text-xs text-white/45">
                  Incomplete bios and below-standard pricing are not accepted for profile completion.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none mx-auto mt-10 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </section>
  );
}