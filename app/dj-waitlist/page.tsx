// FILE: app/dj-waitlist/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExperienceBand = "1–3" | "3–5" | "5+";

function clean(s: unknown) {
  return String(s ?? "").trim();
}

function cleanLower(s: unknown) {
  return clean(s).toLowerCase();
}

function safeParam(s: string) {
  return encodeURIComponent(s.slice(0, 120));
}

/**
 * Sends a confirmation email to the DJ applicant.
 * Uses Resend REST API (no SDK needed).
 *
 * Required env vars (Vercel Project Settings → Environment Variables):
 * - RESEND_API_KEY
 * - RESEND_FROM   (must be a verified sender in Resend, e.g. "SpinBook HQ <no-reply@yourdomain.com>")
 *
 * Optional:
 * - RESEND_CC (defaults to spinbookhq@gmail.com)
 */
async function sendDjWaitlistEmail(args: {
  toEmail: string;
  stageName: string;
  city: string;
  experienceBand: ExperienceBand;
  instagram?: string | null;
  genres?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const cc = process.env.RESEND_CC || "spinbookhq@gmail.com";

  // If not configured, throw so caller can route to a friendly error
  if (!apiKey || !from) {
    throw new Error("email_not_configured");
  }

  const subject = `✅ Application received — ${APP_NAME} Founding DJ Waitlist`;

  const safeStage = args.stageName || "DJ";
  const safeCity = args.city || "—";
  const safeExp = args.experienceBand || "—";
  const safeInstagram = args.instagram?.trim() ? args.instagram.trim() : "—";
  const safeGenres = args.genres?.trim() ? args.genres.trim() : "—";

  // Minimal, clean HTML (Resend supports html/text)
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height:1.5; color:#111;">
    <h2 style="margin:0 0 8px;">Application received ✅</h2>
    <p style="margin:0 0 12px;">
      Hi ${escapeHtml(safeStage)},<br/>
      Thanks for applying to join the <b>${APP_NAME}</b> Founding DJ Waitlist.
      We’ve received your application and our team reviews submissions in batches.
    </p>

    <div style="margin:16px 0; padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#fafafa;">
      <p style="margin:0 0 6px;"><b>Your application summary</b></p>
      <p style="margin:0; font-size:14px;">
        <b>City:</b> ${escapeHtml(safeCity)}<br/>
        <b>Experience:</b> ${escapeHtml(safeExp)} years<br/>
        <b>Instagram / Website:</b> ${escapeHtml(safeInstagram)}<br/>
        <b>Genres:</b> ${escapeHtml(safeGenres)}
      </p>
    </div>

    <p style="margin:0 0 12px;">
      If approved, you’ll receive a private invite email with next steps to complete your DJ profile.
      Please keep an eye on your inbox (and spam/promotions just in case).
    </p>

    <p style="margin:0 0 6px; font-size:13px; color:#555;">
      — SpinBook HQ Team
    </p>
  </div>
  `;

  const text = `Application received ✅

Hi ${safeStage},
Thanks for applying to join the ${APP_NAME} Founding DJ Waitlist.
We’ve received your application and we review in batches.

Application summary:
City: ${safeCity}
Experience: ${safeExp} years
Instagram / Website: ${safeInstagram}
Genres: ${safeGenres}

If approved, you’ll receive a private invite email with next steps to complete your DJ profile.
Please check your inbox (and spam/promotions).

— SpinBook HQ Team
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.toEmail,
      cc: cc ? [cc] : undefined,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`email_send_failed:${res.status}:${body.slice(0, 200)}`);
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function submitWaitlist(formData: FormData) {
  "use server";

  const stage_name = clean(formData.get("stage_name"));
  const email = cleanLower(formData.get("email"));
  const city = clean(formData.get("city"));
  const experience_band = clean(formData.get("experience_band")) as ExperienceBand;
  const instagram = clean(formData.get("instagram"));
  const genres = clean(formData.get("genres"));

  // Optional attribution (safe): /dj-waitlist?src=instagram
  const source = clean(formData.get("source"));

  // Basic validation (no fancy logic, just safety)
  if (!stage_name || !email || !city || !experience_band) {
    redirect("/dj-waitlist?error=missing");
  }

  const supabase = await createClient();

  const payloadBase: any = {
    stage_name,
    email,
    city,
    experience_band,
    instagram: instagram || null,
    genres: genres || null,
    status: "pending",
  };

  const payloadWithSource = source ? { ...payloadBase, source } : payloadBase;

  let { error } = await supabase
    .from("dj_waitlist")
    .upsert(payloadWithSource, { onConflict: "email" });

  if (error && source) {
    // Fallback: retry without "source" if column doesn't exist.
    const msg = String((error as any)?.message ?? "");
    const code = String((error as any)?.code ?? "");
    const looksLikeMissingColumn =
      msg.toLowerCase().includes("column") && msg.toLowerCase().includes("source");
    const looksLikeSchemaMismatch = code === "PGRST204" || code === "42703";

    if (looksLikeMissingColumn || looksLikeSchemaMismatch) {
      error = (await supabase.from("dj_waitlist").upsert(payloadBase, { onConflict: "email" }))
        .error;
    }
  }

  if (error) {
    redirect(`/dj-waitlist?error=${safeParam("submit")}`);
  }

  // ✅ NEW: Send confirmation email AFTER successful DB save
  try {
    await sendDjWaitlistEmail({
      toEmail: email,
      stageName: stage_name,
      city,
      experienceBand: experience_band,
      instagram: instagram || null,
      genres: genres || null,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");

    // If email isn’t configured, give a clear error so we fix env vars
    if (msg.includes("email_not_configured")) {
      redirect("/dj-waitlist?error=email_config");
    }

    // If email send fails, still confirm application, but show a warning
    // (We keep the application saved in DB — no loss.)
    redirect("/dj-waitlist?submitted=1&email=failed");
  }

  redirect("/dj-waitlist?submitted=1");
}

export default async function DjWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string; error?: string; src?: string; email?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const submitted = String(sp.submitted ?? "").trim() === "1";
  const error = String(sp.error ?? "").trim();
  const emailFlag = String(sp.email ?? "").trim();

  // Optional prefill from URL: /dj-waitlist?src=instagram
  const srcPrefill = String(sp.src ?? "").trim();

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Premium background wash (mobile + desktop) */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85">
                Founding DJ access • Invite-only onboarding
              </p>
              <p className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                US + Canada • Nationwide
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Become a Founding DJ on <span className="text-white">{APP_NAME}</span>
            </h1>

            <p className="text-sm leading-relaxed text-white/75">
              We’re onboarding a limited number of professional DJs across the{" "}
              <span className="font-semibold text-white">United States</span> and{" "}
              <span className="font-semibold text-white">Canada</span> before public client
              bookings open. Founding DJs get early access and priority placement when
              the marketplace unlocks.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Founding DJ benefits</p>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>• Priority placement at launch</li>
                  <li>• Early access to booking tools</li>
                  <li>• Verified profile + premium presentation</li>
                  <li>• Spotlight opportunities as we scale</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">How it works</p>
                <ol className="mt-3 space-y-2 text-sm text-white/70">
                  <li>1) Apply to the waitlist</li>
                  <li>2) We review in batches</li>
                  <li>3) Approved DJs receive a private invite</li>
                </ol>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold text-white/80">
                    Client bookings are not open yet
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    This phase is DJ onboarding only to ensure quality from day one.
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ Founding DJ Rules + Benefits (policy block) */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">Founding DJ program</p>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                  Simple • Professional • Nationwide
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    BENEFITS
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li>• Founding DJ badge + priority placement</li>
                    <li>• Early access to profile + workflow tools</li>
                    <li>• Featured visibility during launch window</li>
                    <li>• Direct line for feedback while we build</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    EXPECTATIONS
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li>• Real DJ identity + legit offering</li>
                    <li>• Keep your profile current (city, genres, pricing)</li>
                    <li>• Once clients unlock: respond within ~24 hours</li>
                    <li>• Early phase: no booking guarantees</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/55">
                By applying, you’re requesting early access. If approved, we’ll email your
                invite instructions.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Application received ✅</p>
                <p className="mt-2 text-sm text-white/70">
                  Thanks for applying to become a Founding DJ on {APP_NAME}. We’ve received your
                  application and our team reviews submissions in batches. If approved, you’ll
                  receive a private invite email with next steps to complete your profile.
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  {emailFlag === "failed" ? (
                    <p className="text-sm text-white/80">
                      Heads up: we saved your application, but the confirmation email didn’t send.
                      Please check your email address and try again later, or contact SpinBook HQ support.
                    </p>
                  ) : (
                    <p className="text-sm text-white/80">
                      Please check your inbox (and spam/promotions) for a confirmation email.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Back to home
                  </Link>

                  <Link
                    href="/login?dj=1"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    DJ login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Apply to the Founding DJ waitlist</p>
                <p className="mt-2 text-sm text-white/70">
                  Approved DJs will receive a private invitation to complete their profile.
                </p>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                    {error === "missing" ? (
                      <p>Please complete the required fields and try again.</p>
                    ) : error === "email_config" ? (
                      <p>
                        Application saved, but email isn’t configured yet. SpinBook HQ team: set
                        RESEND_API_KEY and RESEND_FROM in Vercel env vars.
                      </p>
                    ) : (
                      <p>Something went wrong. Please try again.</p>
                    )}
                  </div>
                ) : null}

                <form action={submitWaitlist} className="mt-6 space-y-4">
                  {/* Optional attribution field (hidden). You can use /dj-waitlist?src=instagram */}
                  <input type="hidden" name="source" value={srcPrefill} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs text-white/70">DJ / Stage Name *</label>
                      <input
                        name="stage_name"
                        required
                        placeholder="e.g., DJ Nova"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/70">Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/70">
                        Primary City / Location *
                      </label>
                      <input
                        name="city"
                        required
                        placeholder="e.g., Toronto, ON / Houston, TX"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                      <p className="text-[11px] text-white/50">
                        US + Canada only for this founding launch.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/70">Years of DJ Experience *</label>
                      <select
                        name="experience_band"
                        required
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        <option value="1–3">1–3 years</option>
                        <option value="3–5">3–5 years</option>
                        <option value="5+">5+ years</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs text-white/70">
                        Instagram / Website (optional)
                      </label>
                      <input
                        name="instagram"
                        placeholder="e.g., https://instagram.com/yourdjhandle"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/70">
                        Genres / Specialties (optional)
                      </label>
                      <input
                        name="genres"
                        placeholder="e.g., Afrobeats, Weddings, House"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Apply to join
                  </button>

                  <p className="text-xs text-white/55">
                    By applying, you agree to be contacted about early access. No spam.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-semibold text-white/80">Already approved?</p>
                    <p className="mt-1 text-xs text-white/60">
                      Use the DJ login link:{" "}
                      <Link
                        href="/login?dj=1"
                        className="text-white/80 underline underline-offset-4"
                      >
                        Continue to DJ login
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-white/60">
          <p>
            Not a DJ?{" "}
            <Link href="/" className="text-white/80 underline underline-offset-4">
              Return to the homepage
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
