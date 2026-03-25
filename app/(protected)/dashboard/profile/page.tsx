import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SaveProfileButton from "./save-profile-button";

export const dynamic = "force-dynamic";

const MIN_REQUIRED_PHOTOS = 3;

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

function toPositiveIntOrNull(v: string) {
  const trimmed = v.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  const n = Number(digits);
  if (!Number.isFinite(n)) return null;

  const int = Math.floor(n);
  if (int <= 0) return null;

  return int;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

function parseSocialInput(value: string): ParsedSocial | null {
  const raw = value.trim();
  if (!raw) return null;

  const lowerRaw = raw.toLowerCase();

  const prefixedMatch = raw.match(/^([a-zA-Z]+)\s*:\s*(.+)$/);
  if (prefixedMatch) {
    const prefix = prefixedMatch[1].toLowerCase();
    const payload = prefixedMatch[2].trim();

    let platform: SocialPlatform | null = null;

    if (prefix === "instagram" || prefix === "ig") platform = "instagram";
    if (prefix === "facebook" || prefix === "fb") platform = "facebook";
    if (prefix === "x" || prefix === "twitter") platform = "x";
    if (prefix === "snapchat" || prefix === "snap") platform = "snapchat";
    if (
      prefix === "website" ||
      prefix === "site" ||
      prefix === "web" ||
      prefix === "url"
    ) {
      platform = "website";
    }

    if (!platform) return null;

    if (platform === "website") {
      try {
        const url = new URL(
          /^https?:\/\//i.test(payload) ? payload : `https://${payload}`
        );
        const href = url.toString();
        const label = url.hostname.replace(/^www\./i, "");
        return {
          platform,
          label,
          href,
          storage: `website:${href}`,
        };
      } catch {
        return null;
      }
    }

    if (/^https?:\/\//i.test(payload)) {
      try {
        const url = new URL(payload);
        const part = extractPrimaryPathnamePart(url);
        const label = cleanHandle(part || payload);
        if (!label) return null;

        return {
          platform,
          label,
          href: buildSocialHref(platform, label),
          storage: `${platform}:${label}`,
        };
      } catch {
        return null;
      }
    }

    const label = cleanHandle(payload);
    if (!label) return null;

    return {
      platform,
      label,
      href: buildSocialHref(platform, label),
      storage: `${platform}:${label}`,
    };
  }

  if (/^https?:\/\//i.test(raw) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
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

  if (lowerRaw.startsWith("@") || /^[a-z0-9._]+$/i.test(raw)) {
    const label = cleanHandle(raw);
    if (!label) return null;

    return {
      platform: "instagram",
      label,
      href: buildSocialHref("instagram", label),
      storage: `instagram:${label}`,
    };
  }

  return null;
}

function formatSocialInputForEditing(value: string | null | undefined) {
  if (!isNonEmptyString(value)) return "";
  return String(value);
}

async function buildUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stageName: string,
  currentSlug?: string | null
) {
  const baseSlug = normalizeSlug(stageName);

  if (!baseSlug) return null;

  const { data, error } = await supabase
    .from("dj_profiles")
    .select("user_id, slug")
    .ilike("slug", `${baseSlug}%`);

  if (error) return null;

  const rows = Array.isArray(data) ? data : [];
  const taken = new Set(
    rows
      .filter((row) => row.user_id !== userId && isNonEmptyString(row.slug))
      .map((row) => String(row.slug))
  );

  if (
    currentSlug &&
    normalizeSlug(currentSlug) === baseSlug &&
    !taken.has(baseSlug)
  ) {
    return baseSlug;
  }

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let i = 2;
  while (taken.has(`${baseSlug}-${i}`)) {
    i += 1;
  }

  return `${baseSlug}-${i}`;
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-white/85">{label}</label>
        {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
      </div>
      {children}
    </div>
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
  const existingPhotoCount = existingGalleryUrls.length;

  async function saveProfileAction(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) {
      redirect("/login?dj=1");
    }

    const stage_name = String(formData.get("stage_name") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const bioRaw = String(formData.get("bio") ?? "");
    const bio = bioRaw.trim().slice(0, 600);
    const published = String(formData.get("published") ?? "") === "on";
    const social_handle_input = String(formData.get("social_handle") ?? "").trim();

    const startingPriceRaw = String(formData.get("starting_price") ?? "");
    const starting_price = toPositiveIntOrNull(startingPriceRaw);

    const galleryFiles = formData
      .getAll("gallery")
      .filter((item): item is File => item instanceof File && item.size > 0);

    const { data: currentProfile } = await supabase
      .from("dj_profiles")
      .select("avatar_url, gallery_urls, slug")
      .eq("user_id", authedUser.id)
      .maybeSingle<{
        avatar_url: string | null;
        gallery_urls: string[] | null;
        slug: string | null;
      }>();

    const existingGallery = getProfileGallery(currentProfile);

    if (!stage_name || !city) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Stage name and city are required."
        )}`
      );
    }

    const parsedSocial = parseSocialInput(social_handle_input);

    if (!parsedSocial) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Enter your social or website in one of these formats: instagram:@djname, facebook:@djpage, x:@djname, snapchat:@djname, or website:https://yourwebsite.com. A plain @handle is treated as Instagram."
        )}`
      );
    }

    const totalPhotoCountAfterSave =
      galleryFiles.length > 0 ? galleryFiles.length : existingGallery.length;

    if (totalPhotoCountAfterSave < MIN_REQUIRED_PHOTOS) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "You must upload at least 3 photos to complete onboarding. More photos are recommended because they help DJs get more bookings."
        )}`
      );
    }

    if (published && !starting_price) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Starting price is required before publishing. Example: 450 (shown as “From $450”)."
        )}`
      );
    }

    const uniqueSlug = await buildUniqueSlug(
      supabase,
      authedUser.id,
      stage_name,
      currentProfile?.slug ?? null
    );

    if (!uniqueSlug) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "We could not generate a valid public profile link from your stage name. Please adjust your stage name and try again."
        )}`
      );
    }

    let gallery_urls = [...existingGallery];

    if (galleryFiles.length > 0) {
      const bucket = "avatars";
      const uploadedUrls: string[] = [];

      for (let i = 0; i < galleryFiles.length; i += 1) {
        const file = galleryFiles[i];

        const ext =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
            ? "webp"
            : "jpg";

        const path = `${authedUser.id}/gallery/${Date.now()}-${i + 1}.${ext}`;

        const upload = await supabase.storage.from(bucket).upload(path, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
        });

        if (upload.error) {
          redirect(
            `/dashboard/profile?msg=${encodeURIComponent(
              `Photo upload failed: ${upload.error.message}. Check that the Storage bucket "avatars" exists and is usable.`
            )}`
          );
        }

        const pub = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.data.publicUrl ?? null;

        if (!publicUrl) {
          redirect(
            `/dashboard/profile?msg=${encodeURIComponent(
              "A photo uploaded but its public URL could not be created. Check Storage public access."
            )}`
          );
        }

        uploadedUrls.push(publicUrl);
      }

      gallery_urls = uploadedUrls;
    }

    if (gallery_urls.length < MIN_REQUIRED_PHOTOS) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "You must have at least 3 photos saved on your profile to continue."
        )}`
      );
    }

    const avatar_url = gallery_urls[0] ?? null;

    const payload = {
      user_id: authedUser.id,
      stage_name,
      slug: uniqueSlug,
      city,
      bio: bio.length ? bio : null,
      published,
      avatar_url,
      starting_price,
      social_handle: parsedSocial.storage,
      gallery_urls,
    };

    const { error } = await supabase.from("dj_profiles").upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          `Save failed: ${error.message}`
        )}`
      );
    }

    redirect(
      `/dashboard?msg=${encodeURIComponent(
        published
          ? "Profile saved and published."
          : "Profile saved. Review your full DJ profile below."
      )}`
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  const textareaClass =
    "w-full min-h-[120px] resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  const startingPriceExisting =
    profile?.starting_price != null && String(profile.starting_price).trim() !== ""
      ? String(profile.starting_price)
      : "";

  const socialInputExisting = formatSocialInputForEditing(profile?.social_handle);

  const isReady =
    Boolean(profile) &&
    isNonEmptyString(profile?.stage_name) &&
    isNonEmptyString(profile?.city) &&
    isNonEmptyString(profile?.social_handle) &&
    existingGalleryUrls.length >= MIN_REQUIRED_PHOTOS &&
    profile?.starting_price != null &&
    String(profile.starting_price).trim() !== "";

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
            subtitle="Minimum 3 portrait-friendly photos required. More photos are recommended because they help DJs get more bookings. Social input now supports Instagram, Facebook, X, Snapchat, or Website."
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
            <form action={saveProfileAction} className="space-y-4">
              <Field
                label="Photos (minimum 3 required)"
                hint="Portrait photos recommended • JPG/PNG/WebP"
              >
                {existingGalleryUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {existingGalleryUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]"
                      >
                        <div className="aspect-[3/4] w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`DJ photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                    No photos uploaded yet.
                  </div>
                )}

                <input
                  className={inputClass}
                  type="file"
                  name="gallery"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                />

                <p className="mt-2 text-xs text-white/45">
                  You currently have{" "}
                  <span className="font-semibold text-white/75">
                    {existingPhotoCount}
                  </span>{" "}
                  saved photo{existingPhotoCount === 1 ? "" : "s"}. You need at least{" "}
                  <span className="font-semibold text-white/75">
                    {MIN_REQUIRED_PHOTOS}
                  </span>{" "}
                  total. On desktop, hold <span className="font-semibold text-white/75">Ctrl</span> or{" "}
                  <span className="font-semibold text-white/75">Shift</span> to select multiple photos at once.
                </p>

                <p className="text-xs text-white/45">
                  Selecting a new batch of photos will replace your current photo set, so upload your full preferred set together.
                </p>
              </Field>

              <Field
                label="Stage name"
                hint="Used to build your public profile URL automatically."
              >
                <input
                  className={inputClass}
                  name="stage_name"
                  placeholder="DJ Nova"
                  defaultValue={String(profile?.stage_name ?? "")}
                  required
                />
                <p className="mt-2 text-xs text-white/45">
                  Your public profile link will be generated automatically from your stage name.
                </p>
              </Field>

              <Field
                label="Instagram / Facebook / X / Snapchat / Website (required)"
                hint="Use a clear format so the correct icon can be shown on the DJ profile."
              >
                <input
                  className={inputClass}
                  name="social_handle"
                  placeholder="instagram:@djname or website:https://yourwebsite.com"
                  defaultValue={socialInputExisting}
                  required
                />
                <p className="mt-2 text-xs text-white/45">
                  Accepted formats: <span className="font-semibold text-white/75">instagram:@djname</span>,{" "}
                  <span className="font-semibold text-white/75">facebook:@djpage</span>,{" "}
                  <span className="font-semibold text-white/75">x:@djname</span>,{" "}
                  <span className="font-semibold text-white/75">snapchat:@djname</span>, or{" "}
                  <span className="font-semibold text-white/75">website:https://yourwebsite.com</span>.
                  A plain <span className="font-semibold text-white/75">@handle</span> is treated as Instagram.
                </p>
              </Field>

              <Field label="City" hint="Example: Washington, DC">
                <input
                  className={inputClass}
                  name="city"
                  placeholder="Washington, DC"
                  defaultValue={String(profile?.city ?? "")}
                  required
                />
              </Field>

              <Field label="Starting price (USD)" hint='Shows as “From $450”'>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-white/55">
                    $
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    name="starting_price"
                    inputMode="numeric"
                    placeholder="450"
                    defaultValue={startingPriceExisting}
                  />
                </div>
                <p className="mt-2 text-xs text-white/45">
                  Clients see this on your profile and in Browse DJs.
                </p>
              </Field>

              <Field label="Bio" hint="Short intro. 600 chars max.">
                <textarea
                  className={textareaClass}
                  name="bio"
                  placeholder="Tell clients what you play, your vibe, and what makes your sets unique..."
                  defaultValue={String(profile?.bio ?? "")}
                />
              </Field>

              <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      Publish profile
                    </p>
                    <p className="mt-1 text-sm text-white/65">
                      When published, you’ll appear on the Browse DJs page.
                    </p>

                    {existingPhotoCount < MIN_REQUIRED_PHOTOS ? (
                      <p className="mt-2 text-xs font-semibold text-amber-200/90">
                        Minimum 3 photos are required before your onboarding can be considered complete.
                      </p>
                    ) : null}

                    {!profile?.social_handle ? (
                      <p className="mt-2 text-xs font-semibold text-amber-200/90">
                        A valid social or website entry is required.
                      </p>
                    ) : null}

                    {!startingPriceExisting ? (
                      <p className="mt-2 text-xs font-semibold text-amber-200/90">
                        Starting price is required to publish.
                      </p>
                    ) : null}
                  </div>

                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={Boolean(profile?.published)}
                    className="h-5 w-5 accent-fuchsia-500"
                  />
                </label>
              </div>

              <SaveProfileButton />
            </form>
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
                  <li>• Starting price (required to publish)</li>
                  <li>• Publish ON</li>
                </ul>
                <p className="mt-3 text-xs text-white/45">
                  More photos are recommended because they help DJs look stronger and can improve bookings.
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