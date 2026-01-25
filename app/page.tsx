// FILE: app/page.tsx

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

          {/* Luxury glow (more subtle / mature) */}
          <div className="absolute inset-0 bg-[radial-gradient(1200px_650px_at_50%_-10%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(950px_520px_at_14%_28%,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_86%_22%,rgba(59,130,246,0.14),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_62%_88%,rgba(236,72,153,0.12),transparent_62%)]" />

          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:84px_84px]" />

          {/* Soft vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_70%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

          {/* Blur layer */}
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          {/* Top pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
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
                Now Live in the DMV Area
              </span>
              <span className="hidden sm:inline text-white/45">•</span>
              <span className="hidden sm:inline text-white/65">
                Premium bookings
              </span>
            </div>
          </div>

          {/* Title + subtitle */}
          <div className="mt-10 text-center">
            <h1 className="text-balance text-5xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
              Find &amp; Book{" "}
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                Your Perfect DJ
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
              {APP_NAME} connects you with trusted DJs for weddings, parties, and
              corporate events. Clean profiles, fast responses, and secure
              deposits.
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/djs"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40 sm:w-auto"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M8 5v14l11-7L8 5Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
              </span>
              Find a DJ
              <span className="ml-1 opacity-70 transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-base font-extrabold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 20c0-3.31 2.69-6 6-6h0c3.31 0 6 2.69 6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M14 20c0-2.06.83-3.93 2.18-5.29C17.54 13.35 19.42 12.5 21.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                </svg>
              </span>
              I’m a DJ
            </Link>
          </div>

          {/* Trust row (richer cards) */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Verified DJs",
                body: "Public profiles with real details and fast responses.",
              },
              {
                title: "Secure Deposits",
                body: "Stripe-powered deposits to lock in your date.",
              },
              {
                title: "Smooth Workflow",
                body: "Request → accept → deposit → confirmed booking.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur"
              >
                <div className="text-sm font-extrabold text-white">{c.title}</div>
                <div className="mt-1 text-sm text-white/65">{c.body}</div>
              </div>
            ))}
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none mx-auto mt-16 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        {/* Section header */}
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">
            HOW IT WORKS
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Simple for clients. Powerful for DJs.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Two clean flows: customers request bookings in minutes, DJs accept
            the right gigs and collect secure deposits.
          </p>

          <div className="pointer-events-none mx-auto mt-8 h-px max-w-5xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
          {/* Customers */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="text-xs font-extrabold tracking-wider text-white/60">
              FOR CUSTOMERS
            </div>
            <h3 className="mt-2 text-2xl font-extrabold text-white">
              Book a DJ in minutes
            </h3>
            <ol className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  1
                </span>
                Browse DJs and pick the right vibe for your event.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  2
                </span>
                Send a request and get a fast response.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  3
                </span>
                Pay a secure deposit to lock your date.
              </li>
            </ol>

            <div className="mt-6">
              <Link
                href="/djs"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15"
              >
                Browse DJs →
              </Link>
            </div>
          </div>

          {/* DJs */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="text-xs font-extrabold tracking-wider text-white/60">
              FOR DJS
            </div>
            <h3 className="mt-2 text-2xl font-extrabold text-white">
              Get booked. Stay organized.
            </h3>
            <ol className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  1
                </span>
                Create your profile with a photo and service details.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  2
                </span>
                Receive booking requests and accept the right gigs.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                  3
                </span>
                Collect deposits and confirm bookings.
              </li>
            </ol>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-5 py-3 text-sm font-extrabold text-white hover:bg-fuchsia-400"
              >
                Join as a DJ →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="pointer-events-none mx-auto mt-14 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>
    </main>
  );
}
