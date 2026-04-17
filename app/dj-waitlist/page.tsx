// FILE: app/dj-waitlist/page.tsx

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DjWaitlistPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85">
                DJ roster access
              </p>
              <p className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                U.S. + Canada • Select launch markets
              </p>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Join the SpinBook HQ DJ Roster
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
                {APP_NAME} is building a trusted DJ and events marketplace for
                clients looking to book reliable DJs for weddings, birthdays,
                corporate events, private parties, nightlife, concerts, and more.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
                We are currently reviewing DJs in select U.S. and Canada markets.
                Submit your interest and our team will follow up if your profile,
                city, and booking readiness match our current launch needs.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  STEP 1
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Submit your interest
                </p>
                <p className="mt-2 text-sm text-white/65">
                  Tell us who you are, where you perform, and what type of events
                  you handle.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  STEP 2
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Profile review
                </p>
                <p className="mt-2 text-sm text-white/65">
                  Our team reviews your market, brand presence, experience, and
                  booking readiness.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  STEP 3
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Roster consideration
                </p>
                <p className="mt-2 text-sm text-white/65">
                  If there is a fit, we will contact you with the next onboarding
                  steps.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    WHAT WE LOOK FOR
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
                    <li>• Professional DJ brand or stage identity</li>
                    <li>• Clear photos, promo content, or social presence</li>
                    <li>• Experience with private, social, corporate, or venue events</li>
                    <li>• Reliable communication and booking readiness</li>
                    <li>• Willingness to follow the SpinBook HQ platform workflow</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    SEND US YOUR DETAILS
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-white/70">
                    To be considered, send your DJ details to{" "}
                    <a
                      href="mailto:info@spinbookhq.com"
                      className="font-semibold text-white underline underline-offset-4 hover:text-white/80"
                    >
                      info@spinbookhq.com
                    </a>{" "}
                    with the information below.
                  </p>

                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
                    <li>• DJ/stage name</li>
                    <li>• City, state/province, and country</li>
                    <li>• Instagram, website, or social link</li>
                    <li>• Short DJ bio</li>
                    <li>• Starting booking price</li>
                    <li>• Event types you perform</li>
                    <li>• Clear photos or promotional images</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="text-sm font-semibold text-white">
                  Curated roster, professional standards
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  SpinBook HQ is not an open directory. We review DJs carefully
                  so clients can discover serious, professional talent and DJs
                  can receive better-quality booking opportunities.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Contact SpinBook HQ
                </Link>

                <Link
                  href="/djs"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View DJ marketplace
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">
                Already onboarded?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                If you are already part of the SpinBook HQ roster, please follow
                the onboarding and booking instructions shared by our team. For
                dashboard, profile, or booking flow support, contact SpinBook HQ
                support anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-white/60">
          <p>
            Looking to book a DJ?{" "}
            <Link href="/djs" className="text-white/80 underline underline-offset-4">
              Browse live DJ profiles
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}