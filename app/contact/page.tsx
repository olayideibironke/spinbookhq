// FILE: app/contact/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const FORM_ACTION = "https://formspree.io/f/mlgbwagq";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      {/* Background (matches luxury vibe) */}
      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#070812]" />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_650px_at_50%_-10%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_14%_28%,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_86%_22%,rgba(59,130,246,0.14),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_62%_88%,rgba(236,72,153,0.12),transparent_62%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:84px_84px]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_70%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-12">
          {/* Top bar */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-extrabold tracking-[0.2em] text-white/70">
                CONTACT
              </div>

              <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Contact{" "}
                <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                  SpinBook HQ
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                Questions, support, or booking help — send us a message anytime.
                SpinBook HQ is built for events everywhere, and we typically
                respond within 24 hours.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:text-white"
            >
              ← Back to home
            </Link>
          </div>

          {/* Divider */}
          <div className="pointer-events-none mt-10 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Content grid */}
          <div className="mt-10 grid gap-8 lg:grid-cols-5">
            {/* Left: Contact cards */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
                <div className="text-xs font-extrabold tracking-[0.2em] text-white/60">
                  REACH US
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-bold text-white/60">EMAIL</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      info@spinbookhq.com
                    </div>
                    <p className="mt-1 text-xs text-white/55">
                      Best for detailed requests and confirmations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-bold text-white/60">PHONE</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      +1 (202) 765-9663
                    </div>
                    <p className="mt-1 text-xs text-white/55">
                      For urgent support and quick questions.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-bold text-white/60">
                      RESPONSE TIME
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      Within 24 hours
                    </div>
                    <p className="mt-1 text-xs text-white/55">
                      Faster during business hours.
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <p className="mt-6 text-xs leading-relaxed text-white/55">
                  For booking support, include the DJ name, event date, event
                  location (city + country), and your budget range for a faster
                  response.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-xs font-extrabold tracking-[0.2em] text-white/60">
                      SEND A MESSAGE
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold text-white">
                      We’ll get back to you
                    </h2>
                    <p className="mt-2 text-sm text-white/65">
                      Fill out the form below and we’ll respond as soon as
                      possible.
                    </p>
                  </div>

                  <div className="hidden sm:block rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold text-white/70">
                    Secure form
                  </div>
                </div>

                <div className="pointer-events-none mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* ✅ Keep Formspree + fields unchanged */}
                <form
                  action={FORM_ACTION}
                  method="POST"
                  className="mt-7 space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-semibold text-white/85"
                      >
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        required
                        placeholder="Your name"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:bg-black/35"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-white/85"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@email.com"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:bg-black/35"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-semibold text-white/85"
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      required
                      placeholder="What’s this about?"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:bg-black/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-white/85"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Type your message…"
                      rows={7}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:bg-black/35"
                    />
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-relaxed text-white/55">
                      By submitting, you agree SpinBook HQ may contact you
                      regarding your request.
                    </p>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                    >
                      Send message →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="mt-10" />
        </div>
      </div>
    </main>
  );
}
