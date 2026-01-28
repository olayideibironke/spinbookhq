import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          {/* Base */}
          <div className="absolute inset-0 bg-[#070812]" />

          {/* Luxury glow */}
          <div className="absolute inset-0 bg-[radial-gradient(1200px_650px_at_50%_-10%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(950px_520px_at_14%_28%,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_86%_22%,rgba(59,130,246,0.14),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_62%_88%,rgba(236,72,153,0.12),transparent_62%)]" />

          {/* Grid texture */}
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:84px_84px]" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_70%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

          {/* Blur */}
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          {/* Top pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M12 21s-7-4.35-7-11a7 7 0 1 1 14 0c0 6.65-7 11-7 11Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                </svg>
              </span>
              <span className="font-semibold tracking-wide">
                Book DJs Anywhere
              </span>
              <span className="hidden sm:inline text-white/65">
                Premium bookings
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="mt-10 text-center">
            <h1 className="text-balance text-5xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
              Find and Book{" "}
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                Your Perfect DJ
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              {APP_NAME} is a premium DJ marketplace connecting clients with
              verified DJs for weddings, parties, and corporate events anywhere.
              Clean profiles, fast responses, and secure deposits.
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/djs"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 sm:w-auto"
            >
              Find a DJ →
            </Link>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-base font-extrabold text-white/85 hover:bg-white/[0.06] sm:w-auto"
            >
              I’m a DJ
            </Link>
          </div>

          {/* Trust row */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Verified DJs",
                body: "Public profiles with real details and fast responses.",
              },
              {
                title: "Secure Deposits",
                body: "Stripe powered deposits to lock in your date.",
              },
              {
                title: "Smooth Workflow",
                body: "Request, accept, deposit, and confirm your booking.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur"
              >
                <div className="text-sm font-extrabold text-white">
                  {c.title}
                </div>
                <div className="mt-1 text-sm text-white/65">{c.body}</div>
              </div>
            ))}
          </div>

          <div className="pointer-events-none mx-auto mt-16 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </section>

      {/* How it works + FAQ */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Quick answers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Clear policies with no confusion, designed for smooth bookings.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-lg font-extrabold text-white">
              Is the deposit refundable?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              No. The deposit is non refundable. If you do not pay the remaining
              balance to the DJ seven days before the event, the deposit is
              forfeited and the DJ may cancel.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-lg font-extrabold text-white">
              How do I pay the remaining balance?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              After the deposit, you coordinate directly with the DJ to pay the
              remaining balance. The deposit confirms your event date.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-lg font-extrabold text-white">
              How fast do DJs respond?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Most DJs respond within 24 to 48 hours, with faster responses
              during business hours.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-lg font-extrabold text-white">
              Do you serve my city?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Yes. SpinBook HQ supports bookings across the United States and
              Canada and can accommodate events anywhere as DJs expand globally.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
