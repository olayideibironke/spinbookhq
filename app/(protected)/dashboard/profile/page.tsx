// app/dashboard/profile/page.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getUser } from "@/lib/auth";
import { getDjProfile } from "@/lib/djProfiles";

export const dynamic = "force-dynamic";

function buildSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
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
  if (!user) redirect("/login");

  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const msg = resolvedSearchParams?.msg
    ? decodeURIComponent(resolvedSearchParams.msg)
    : null;

  const profile = await getDjProfile(user.id);

  const existingAvatarUrl = isNonEmptyString((profile as any)?.avatar_url)
    ? String((profile as any).avatar_url)
    : null;

  async function saveProfileAction(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const supabase = buildSupabase(cookieStore);

    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    const stage_name = String(formData.get("stage_name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const bioRaw = String(formData.get("bio") ?? "");
    const bio = bioRaw.trim().slice(0, 600);
    const published = String(formData.get("published") ?? "") === "on";

    const avatar = formData.get("avatar");

    // Re-check profile on server
    const { data: currentProfile } = await supabase
      .from("dj_profiles")
      .select("avatar_url")
      .eq("user_id", authedUser.id)
      .maybeSingle<{ avatar_url: string | null }>();

    const hasAvatarAlready =
      typeof currentProfile?.avatar_url === "string" &&
      currentProfile.avatar_url.trim().length > 0;

    const avatarFile =
      avatar instanceof File && avatar.size > 0 ? avatar : null;

    // ✅ Photo REQUIRED (either already uploaded, or newly provided now)
    if (!hasAvatarAlready && !avatarFile) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Profile photo is required. Please upload a clear headshot before continuing."
        )}`
      );
    }

    if (!stage_name || !slug || !city) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Stage name, slug, and city are required."
        )}`
      );
    }

    const normalizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!normalizedSlug) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "Slug is invalid. Use letters, numbers, and hyphens."
        )}`
      );
    }

    const { data: existing } = await supabase
      .from("dj_profiles")
      .select("user_id, slug")
      .eq("slug", normalizedSlug)
      .maybeSingle<{ user_id: string; slug: string }>();

    if (existing?.user_id && existing.user_id !== authedUser.id) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "That slug is already taken. Try another."
        )}`
      );
    }

    // ✅ If trying to publish, you MUST have an avatar (either existing or uploaded now)
    if (published && !hasAvatarAlready && !avatarFile) {
      redirect(
        `/dashboard/profile?msg=${encodeURIComponent(
          "You must upload a profile photo before publishing."
        )}`
      );
    }

    let avatar_url: string | null = hasAvatarAlready
      ? currentProfile?.avatar_url ?? null
      : null;

    if (avatarFile) {
      const bucket = "avatars";

      const ext =
        avatarFile.type === "image/png"
          ? "png"
          : avatarFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const path = `${authedUser.id}/avatar.${ext}`;

      const upload = await supabase.storage
        .from(bucket)
        .upload(path, avatarFile, {
          upsert: true,
          contentType: avatarFile.type || "image/jpeg",
          cacheControl: "3600",
        });

      if (upload.error) {
        redirect(
          `/dashboard/profile?msg=${encodeURIComponent(
            `Photo upload failed: ${upload.error.message}. (Check you have a Storage bucket named "avatars")`
          )}`
        );
      }

      const pub = supabase.storage.from(bucket).getPublicUrl(path);
      avatar_url = pub.data.publicUrl ?? null;

      if (!avatar_url) {
        redirect(
          `/dashboard/profile?msg=${encodeURIComponent(
            'Photo uploaded but public URL could not be created. Check Storage bucket public access.'
          )}`
        );
      }
    }

    const payload = {
      user_id: authedUser.id,
      stage_name,
      slug: normalizedSlug,
      city,
      bio: bio.length ? bio : null,
      published,
      avatar_url: avatar_url,
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
      `/dashboard/profile?msg=${encodeURIComponent(
        published
          ? "Profile saved and published."
          : "Profile saved. Turn on Publish when you’re ready."
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

  const isReady =
    profile &&
    isNonEmptyString((profile as any).stage_name) &&
    isNonEmptyString((profile as any).slug) &&
    isNonEmptyString((profile as any).city) &&
    isNonEmptyString((profile as any).avatar_url);

  const hasSlug =
    profile && isNonEmptyString((profile as any)?.slug)
      ? String((profile as any).slug).trim()
      : null;

  const isPublished = Boolean((profile as any)?.published);

  return (
    <section className="w-full">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
          DASHBOARD
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Profile
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
            subtitle="Profile photo is required. This is what shows on the public marketplace."
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
                label="Profile photo (required)"
                hint="Clear headshot. JPG/PNG/WebP."
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                    {existingAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={existingAvatarUrl}
                        alt="DJ avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/45">
                        No photo
                      </div>
                    )}
                  </div>

                  <input
                    className={inputClass}
                    type="file"
                    name="avatar"
                    accept="image/png,image/jpeg,image/webp"
                    required={!existingAvatarUrl}
                  />
                </div>
                <p className="mt-2 text-xs text-white/45">
                  {existingAvatarUrl
                    ? "You already have a photo. Upload a new one to replace it."
                    : "You must upload a profile photo to continue."}
                </p>
              </Field>

              <Field label="Stage name" hint="Example: DJ Nova">
                <input
                  className={inputClass}
                  name="stage_name"
                  placeholder="DJ Nova"
                  defaultValue={String((profile as any)?.stage_name ?? "")}
                  required
                />
              </Field>

              <Field label="Slug" hint="Unique. Used in your public URL.">
                <input
                  className={inputClass}
                  name="slug"
                  placeholder="dj-nova"
                  defaultValue={String((profile as any)?.slug ?? "")}
                  required
                />
                <p className="mt-2 text-xs text-white/45">
                  Your public URL will look like:{" "}
                  <span className="font-mono text-white/70">/dj/your-slug</span>
                </p>
              </Field>

              <Field label="City" hint="Example: Washington, DC">
                <input
                  className={inputClass}
                  name="city"
                  placeholder="Washington, DC"
                  defaultValue={String((profile as any)?.city ?? "")}
                  required
                />
              </Field>

              <Field label="Bio" hint="Short intro. 600 chars max.">
                <textarea
                  className={textareaClass}
                  name="bio"
                  placeholder="Tell clients what you play, your vibe, and what makes your sets unique..."
                  defaultValue={String((profile as any)?.bio ?? "")}
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
                    {!existingAvatarUrl ? (
                      <p className="mt-2 text-xs font-semibold text-amber-200/90">
                        You can check Publish now — just make sure you upload a photo before saving.
                      </p>
                    ) : null}
                  </div>

                  {/* ✅ DO NOT disable the checkbox.
                      Server-side rules will still block publish if no photo exists/uploaded. */}
                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={Boolean((profile as any)?.published)}
                    className="h-5 w-5 accent-fuchsia-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Save profile
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card title="Quick actions" subtitle="Use these to verify your listing.">
            <div className="grid gap-3">
              <Link
                href="/djs"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Browse DJs →
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
                Minimal setup required:
                <ul className="mt-2 space-y-1">
                  <li>• Profile photo (required)</li>
                  <li>• Stage name</li>
                  <li>• Slug</li>
                  <li>• City</li>
                  <li>• Publish ON</li>
                </ul>
                <p className="mt-3 text-xs text-white/45">
                  Bio is optional but recommended.
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
