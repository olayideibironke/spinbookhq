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

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85">
                Founding DJ access • Phase 1 complete
              </p>
              <p className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                U.S. + Canada • Curated onboarding in progress
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Founding DJ Access is Now Closed
            </h1>

            <p className="max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
              {APP_NAME} has officially completed intake for our initial{" "}
              <span className="font-semibold text-white">Founding DJ class</span>.
              We are currently onboarding and activating selected DJs across major cities
              in the United States and Canada before public launch.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  STATUS
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Founding intake closed
                </p>
                <p className="mt-2 text-sm text-white/65">
                  The first DJ access window has ended and selections are being finalized.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  NOW HAPPENING
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Onboarding in progress
                </p>
                <p className="mt-2 text-sm text-white/65">
                  Selected DJs are being prepared for priority placement and launch visibility.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                  NEXT
                </p>
                <p className="mt-3 text-base font-semibold text-white">
                  Future intake announced soon
                </p>
                <p className="mt-2 text-sm text-white/65">
                  Additional DJ application windows will open after this onboarding phase.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    WHY ACCESS CLOSED
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li>• Founding DJ applications exceeded the current onboarding capacity</li>
                    <li>• SpinBook HQ is prioritizing quality, readiness, and city placement</li>
                    <li>• We are activating selected DJs before opening broader access</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">
                    WHAT THIS MEANS
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    <li>• New Founding DJ applications are temporarily paused</li>
                    <li>• Selected DJs are receiving next-step onboarding instructions</li>
                    <li>• Future verified DJ intake will reopen in a later phase</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="text-sm font-semibold text-white">
                  A curated launch, not an open floodgate
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Our initial Founding DJ roster has been selected based on{" "}
                  <span className="font-semibold text-white">quality, brand presence, and booking readiness</span>.
                  This allows {APP_NAME} to launch with a stronger, more trusted network from day one.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Back to home
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
              <p className="text-sm font-semibold text-white">Already selected?</p>
              <p className="mt-2 text-sm text-white/70">
                Selected Founding DJs will receive direct onboarding instructions from the SpinBook HQ team.
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/65">
                  If you’ve already been contacted by our team, follow the onboarding steps shared with you directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-white/60">
          <p>
            Looking for DJs?{" "}
            <Link href="/djs" className="text-white/80 underline underline-offset-4">
              Browse the marketplace
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}