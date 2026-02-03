import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BrowseDjsPage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/60">DJ MARKETPLACE</p>
            <h1 className="mt-1 text-3xl font-extrabold text-white">The DJs are getting ready.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              SpinBook HQ is currently onboarding elite DJs across major cities. Early DJs receive priority visibility,
              featured placement, and first access to bookings when the roster opens.
            </p>
          </div>

          <Link
            href="/login?next=/djs"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
          >
            Join as a DJ (Early Access) →
          </Link>
        </div>

        {/* Premium Hold Card */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold text-white">Roster opening soon</h2>
              <p className="mt-2 text-sm text-white/65">
                We’re building a strong lineup before public browsing goes live. This keeps quality high and ensures DJs
                joining now aren’t competing with incomplete listings.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/60">PRIORITY</p>
                  <p className="mt-2 text-sm font-extrabold text-white">Early DJs get featured first</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/60">QUALITY</p>
                  <p className="mt-2 text-sm font-extrabold text-white">Curated onboarding</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/60">BOOKINGS</p>
                  <p className="mt-2 text-sm font-extrabold text-white">Get first access to requests</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <p className="text-sm font-extrabold text-white">DJ onboarding is live ✅</p>
              <p className="mt-2 text-sm text-white/65">
                If you’re a DJ, secure your spot now. You’ll be visible as soon as the roster opens.
              </p>

              <Link
                href="/login?next=/djs"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
              >
                Create DJ Account →
              </Link>

              <Link
                href="/"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Back to Home →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
