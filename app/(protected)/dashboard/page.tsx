import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDjProfile } from "@/lib/djProfiles";
import { createClient } from "@/lib/supabase/server";

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function isNonEmptyArray(v: unknown) {
  return Array.isArray(v) && v.length > 0;
}

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getDjProfile(user.id);

  // Gate: no DJ profile yet -> send to onboarding page
  if (!profile) {
    redirect("/dashboard/profile");
  }

  // Fetch count of NEW booking requests for this DJ
  const supabase = await createClient();
  const { count: newRequestsCount, error: countErr } = await supabase
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("dj_user_id", user.id)
    .eq("status", "new");

  const p = profile as any;

  const checklist = [
    { label: "Stage name", ok: isNonEmptyString(p.stage_name) },
    { label: "Profile slug", ok: isNonEmptyString(p.slug) },
    { label: "City", ok: isNonEmptyString(p.city) },
    { label: "Bio", ok: isNonEmptyString(p.bio) },
    { label: "Genres", ok: isNonEmptyArray(p.genres) },
    { label: "Booking rate", ok: p.rate != null && String(p.rate).trim() !== "" },
    {
      label: "Profile image",
      ok: isNonEmptyString(p.image_url) || isNonEmptyString(p.avatar_url),
    },
  ];

  const completedCount = checklist.filter((x) => x.ok).length;
  const totalCount = checklist.length;

  const isReady =
    isNonEmptyString(p.stage_name) &&
    isNonEmptyString(p.slug) &&
    isNonEmptyString(p.city) &&
    (isNonEmptyString(p.bio) || isNonEmptyArray(p.genres));

  const newCountSafe =
    typeof newRequestsCount === "number" && !Number.isNaN(newRequestsCount)
      ? newRequestsCount
      : 0;

  // Build share link (server-safe)
  const slug = safeTrim(p.slug);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const publicPath = slug ? `/dj/${slug}` : "";
  const publicUrl = slug ? `${origin}${publicPath}` : "";

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      {children}
    </div>
  );

  const Pill = ({
    children,
    tone = "neutral",
  }: {
    children: React.ReactNode;
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
      {/* Top */}
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

      {/* Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Booking Requests */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Booking Requests</h2>
              <p className="mt-1 text-sm text-white/65">
                {countErr ? (
                  <>
                    New requests:{" "}
                    <span className="font-mono text-white/80">
                      {countErr.message}
                    </span>
                  </>
                ) : (
                  <>
                    New requests:{" "}
                    <span className="font-semibold text-white/85">
                      {newCountSafe}
                    </span>
                  </>
                )}
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
            <p className="text-sm font-semibold text-white/85">Quick tips</p>
            <p className="mt-2 text-sm text-white/65">
              Respond quickly to new requests — speed increases conversions. When
              accepted, generate the deposit link to secure the date.
            </p>
          </div>

          {/* Share helper (server-only, zero risk) */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/85">
                  Share your public booking link
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Send this to clients so they can view your profile and request
                  bookings.
                </p>

                {slug ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-xs font-semibold text-white/60">
                      Your link
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-white/80">
                      {publicUrl}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                    Add a profile slug to generate your public link.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {slug ? (
                  <>
                    <Link
                      href={publicPath}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
                    >
                      View public page →
                    </Link>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/15"
                      title="Open in a new tab, then copy from the address bar"
                    >
                      Open & copy
                    </a>
                  </>
                ) : (
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/15"
                  >
                    Add slug →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* DJ Profile */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Your DJ Profile</h2>
              <p className="mt-2 text-sm text-white/65">
                Stage name:{" "}
                <span className="font-semibold text-white/85">
                  {profile.stage_name}
                </span>
              </p>
              {profile.city ? (
                <p className="mt-1 text-sm text-white/65">
                  City:{" "}
                  <span className="font-semibold text-white/85">
                    {profile.city}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
              >
                {isReady ? "Edit Profile" : "Complete Profile"}
              </Link>

              {isNonEmptyString(p.slug) ? (
                <Link
                  href={`/dj/${p.slug}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
                >
                  View public page
                </Link>
              ) : null}
            </div>
          </div>

          {/* Completion */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white/85">
                  Profile completion
                </p>
                <p className="mt-1 text-sm text-white/65">
                  {completedCount}/{totalCount} complete •{" "}
                  <span className="font-semibold text-white/80">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </p>
              </div>

              <Pill tone={isReady ? "success" : "neutral"}>
                {isReady ? "Ready to accept bookings" : "Finish basics to go live"}
              </Pill>
            </div>

            {/* Progress bar */}
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

            {!isReady ? (
              <div className="mt-4 text-sm text-white/65">
                Tip: add a short bio or at least one genre — it boosts trust and booking rate.
              </div>
            ) : (
              <div className="mt-4 text-sm text-white/65">
                Keep your profile fresh — update photos, bio, and genres as you grow.
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
