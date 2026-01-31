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

async function submitWaitlist(formData: FormData) {
  "use server";

  const stage_name = clean(formData.get("stage_name"));
  const email = cleanLower(formData.get("email"));
  const city = clean(formData.get("city"));
  const experience_band = clean(formData.get("experience_band")) as ExperienceBand;
  const instagram = clean(formData.get("instagram"));
  const genres = clean(formData.get("genres"));

  // Optional attribution (safe)
  const source = clean(formData.get("source")); // e.g. "instagram", "tiktok", "facebook", "referral"

  // Basic validation (no fancy logic, just safety)
  if (!stage_name || !email || !city || !experience_band) {
    redirect("/dj-waitlist?error=missing");
  }

  const supabase = await createClient();

  // IMPORTANT: This upsert assumes you already have a dj_waitlist table with these columns.
  // We keep it stable and only add "source" if your DB has it (defensive fallback below).
  const payloadBase: any = {
    stage_name,
    email,
    city,
    experience_band,
    instagram: instagram || null,
    genres: genres || null,
    status: "pending",
  };

  // If the DB doesn't have "source", the insert would error.
  // To avoid breaking production, we only include source when it's provided,
  // AND we gracefully fallback if Supabase complains about the column.
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
      error = (
        await supabase.from("dj_waitlist").upsert(payloadBase, { onConflict: "email" })
      ).error;
    }
  }

  if (error) {
    redirect(`/dj-waitlist?error=${safeParam("submit")}`);
  }

  redirect("/dj-waitlist?submitted=1");
}

export default async function DjWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string; error?: string; src?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const submitted = String(sp.submitted ?? "").trim() === "1";
  const error = String(sp.error ?? "").trim();

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
                  <li>• Help shape the platform roadmap</li>
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

            {submitted ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Application received ✅</p>
                <p className="mt-2 text-sm text-white/70">
                  Thanks for applying to become a Founding DJ on {APP_NAME}. We review
                  applications in batches. If approved, you’ll receive a private invite to
                  complete your profile.
                </p>

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
