// FILE: app/dj-waitlist/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExperienceBand = "1–3" | "3–5" | "5+";

async function submitWaitlist(formData: FormData) {
  "use server";

  const stage_name = String(formData.get("stage_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const city = String(formData.get("city") ?? "").trim();
  const experience_band = String(formData.get("experience_band") ?? "").trim() as ExperienceBand;
  const instagram = String(formData.get("instagram") ?? "").trim();
  const genres = String(formData.get("genres") ?? "").trim();

  // Basic validation (no fancy logic, just safety)
  if (!stage_name || !email || !city || !experience_band) {
    redirect("/dj-waitlist?error=missing");
  }

  const supabase = await createClient();

  // Upsert so re-applying doesn't create duplicates
  const { error } = await supabase
    .from("dj_waitlist")
    .upsert(
      {
        stage_name,
        email,
        city,
        experience_band,
        instagram: instagram || null,
        genres: genres || null,
        status: "pending",
      },
      { onConflict: "email" }
    );

  if (error) {
    redirect("/dj-waitlist?error=submit");
  }

  redirect("/dj-waitlist?submitted=1");
}

export default async function DjWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const submitted = String(sp.submitted ?? "").trim() === "1";
  const error = String(sp.error ?? "").trim();

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
          <div className="space-y-5">
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              Founding DJ access • Invite-only onboarding
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Become a Founding DJ on <span className="text-white">{APP_NAME}</span>
            </h1>

            <p className="text-sm leading-relaxed text-white/75">
              {APP_NAME} is onboarding a limited number of professional DJs ahead of public
              launch. Founding DJs receive early access, priority placement, and featured
              visibility when client bookings go live.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Why join as a Founding DJ</p>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>• Priority visibility at launch</li>
                  <li>• Early access to booking tools</li>
                  <li>• No pressure during early rollout</li>
                  <li>• Help shape the platform</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">How it works</p>
                <ol className="mt-3 space-y-2 text-sm text-white/70">
                  <li>1) Apply to the waitlist</li>
                  <li>2) We review in batches</li>
                  <li>3) Approved DJs get a private invite</li>
                </ol>
              </div>
            </div>

            {submitted ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Application received ✅</p>
                <p className="mt-2 text-sm text-white/70">
                  Thanks for applying to become a Founding DJ on {APP_NAME}. We’re reviewing
                  applications in batches and will reach out if you’re approved for early access.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Back to home
                  </Link>
                  <Link
                    href="/djs"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Browse DJs
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
                      <label className="text-xs text-white/70">Primary City / Location *</label>
                      <input
                        name="city"
                        required
                        placeholder="e.g., Washington, DC"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
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
                      <label className="text-xs text-white/70">Instagram / Website (optional)</label>
                      <input
                        name="instagram"
                        placeholder="e.g., https://instagram.com/yourdjhandle"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/70">Genres / Specialties (optional)</label>
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
