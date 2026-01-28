// FILE: app/page.tsx
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjRow = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  avatar_url: string | null;
  starting_price: number | null;
  genres?: unknown;
};

const MIN_STARTING_PRICE_USD = 450;

function cleanStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function toValidPrice(v: unknown): number | null {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v.replace(/[^\d]/g, ""))
      : Number(v);

  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  return int > 0 ? int : null;
}

function formatUsd(amount: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function parseGenres(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Media layout:
 * - Background: blurred cover
 * - Foreground: full image, no crop
 */
function MediaNoGaps({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative z-0 h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();

  const { data: djs } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, avatar_url, starting_price, genres")
    .eq("published", true)
    .not("slug", "is", null)
    .order("stage_name", { ascending: true })
    .limit(6);

  const featured =
    (djs as DjRow[] | null)?.filter((dj) => cleanStr(dj.slug).length > 0) ?? [];

  const featuredCards = featured.slice(0, 6).map((dj, idx) => {
    const name = cleanStr(dj.stage_name) || "DJ";
    const city = cleanStr(dj.city) || "—";
    const slug = cleanStr(dj.slug);
    const genres = parseGenres(dj.genres).slice(0, 3);

    const fallback =
      idx % 3 === 0 ? "/dj-1.jpg" : idx % 3 === 1 ? "/dj-2.jpg" : "/dj-3.jpg";

    const imageSrc = cleanStr(dj.avatar_url) || fallback;

    const raw = toValidPrice(dj.starting_price);
    const starting = Math.max(MIN_STARTING_PRICE_USD, raw ?? MIN_STARTING_PRICE_USD);

    return { name, city, slug, genres, imageSrc, starting };
  });

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#070812]" />

          <div className="absolute inset-0 bg-[radial-gradient(1200px_650px_at_50%_-10%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(950px_520px_at_14%_28%,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_86%_22%,rgba(59,130,246,0.14),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_62%_88%,rgba(236,72,153,0.12),transparent_62%)]" />

          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:84px_84px]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_70%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          {/* Top pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
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
              <span className="font-semibold tracking-wide">Book DJs Anywhere</span>
              <span className="hidden sm:inline text-white/45">•</span>
              <span className="hidden sm:inline text-white/65">Premium Bookings</span>
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
              {APP_NAME} is a premium DJ marketplace connecting clients with DJs for weddings,
              parties, and corporate events. Clean profiles, fast responses, and secure deposits.
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/djs"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40 sm:w-auto"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M8 5v14l11-7L8 5Z" fill="currentColor" opacity="0.9" />
                </svg>
              </span>
              Find a DJ
              <span className="ml-1 opacity-70 transition group-hover:translate-x-0.5">→</span>
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-base font-extrabold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
            >
              How it works
            </a>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-base font-extrabold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
            >
              I’m a DJ
            </Link>
          </div>

          {/* Trust chips row */}
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            {[
              "Secure deposit (Stripe)",
              "Transparent workflow",
              `From ${formatUsd(MIN_STARTING_PRICE_USD)}+`,
              "Fast responses",
              "US & Canada-ready",
            ].map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Trust row (cards) */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "Verified DJs", body: "Public profiles with clear details and booking-ready setup." },
              { title: "Secure Deposits", body: "Stripe-powered deposits to lock in your date." },
              { title: "Smooth Workflow", body: "Request → accept → deposit → confirmed booking." },
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

          <div className="pointer-events-none mx-auto mt-16 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">HOW IT WORKS</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Simple for clients. Powerful for DJs.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Two clean flows: customers request bookings in minutes, DJs accept the right gigs and
            collect secure deposits.
          </p>
          <div className="pointer-events-none mx-auto mt-8 h-px max-w-5xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
          {/* Customers */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="text-xs font-extrabold tracking-wider text-white/60">FOR CLIENTS</div>
            <h3 className="mt-2 text-2xl font-extrabold text-white">Book a DJ in minutes</h3>

            <ol className="mt-5 space-y-3 text-sm text-white/70">
              {[
                "Browse DJs and pick the right vibe for your event.",
                "Send a booking request with your date + location.",
                "If accepted, pay a secure deposit to lock your date.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">DEPOSIT POLICY</p>
              <p className="mt-2 text-sm text-white/70">
                Deposit is <span className="font-extrabold text-white">non-refundable</span>. If you do{" "}
                <span className="font-extrabold text-white">NOT</span> pay the remaining balance to the DJ{" "}
                <span className="font-extrabold text-white">7 days</span> before the event, the deposit is forfeited
                and the DJ may cancel.
              </p>
            </div>

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
            <div className="text-xs font-extrabold tracking-wider text-white/60">FOR DJS</div>
            <h3 className="mt-2 text-2xl font-extrabold text-white">Get booked. Stay organized.</h3>

            <ol className="mt-5 space-y-3 text-sm text-white/70">
              {[
                "Create a premium profile with your photo, genres, and starting price.",
                "Receive booking requests and accept the right gigs.",
                "Get deposits and confirm bookings with confidence.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">MARKETPLACE READY</p>
              <p className="mt-2 text-sm text-white/70">
                You stay in control of your pricing and availability — SpinBook HQ helps you get discovered and booked.
              </p>
            </div>

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

        <div className="pointer-events-none mx-auto mt-14 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* FEATURED DJS */}
      <section id="featured" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">FEATURED DJS</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              Booking-ready profiles
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Browse standout DJs and send a request in minutes.
            </p>
          </div>

          <Link
            href="/djs"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110"
          >
            Browse all DJs →
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCards.length ? (
            featuredCards.map((dj) => (
              <Link
                key={dj.slug}
                href={`/dj/${dj.slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:-translate-y-[1px]"
              >
                <div className="h-[220px]">
                  <MediaNoGaps src={dj.imageSrc} alt={`${dj.name} profile`} />
                </div>

                <div className="absolute right-4 top-4 z-20">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-extrabold text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                    From {formatUsd(dj.starting)}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-extrabold text-white">{dj.name}</p>
                      <p className="mt-1 truncate text-sm text-white/70">{dj.city}</p>
                      {dj.genres.length ? (
                        <p className="mt-2 truncate text-xs text-white/60">
                          {dj.genres.join(" • ")}
                        </p>
                      ) : null}
                    </div>

                    <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:col-span-2 lg:col-span-3">
              No featured DJs yet. Publish a few DJ profiles and they’ll appear here automatically.
            </div>
          )}
        </div>

        <div className="pointer-events-none mx-auto mt-14 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">FAQ</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Quick answers
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/65">
            Clear policies, no confusion — designed for smooth bookings.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Is the deposit refundable?",
              a: "No. The deposit is non-refundable. If you don’t pay the remaining balance to the DJ 7 days before the event, the deposit is forfeited and the DJ may cancel.",
            },
            {
              q: "How do I pay the remaining balance?",
              a: "After the deposit, you coordinate with the DJ to pay the remaining balance (off-platform if needed). The deposit confirms the date.",
            },
            {
              q: "How fast do DJs respond?",
              a: "Most DJs respond within 24–48 hours. Faster responses are common during business hours.",
            },
            {
              q: "Do you serve my city?",
              a: "Yes — SpinBook HQ is built for bookings across the US and Canada, and can support events anywhere as DJs expand globally.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              <p className="text-base font-extrabold text-white">{item.q}</p>
              <p className="mt-2 text-sm text-white/65">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="pointer-events-none mx-auto mt-14 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold tracking-[0.22em] text-white/60">READY</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                Book your DJ with confidence
              </h2>
              <p className="mt-2 text-sm text-white/65">
                Browse profiles, request a booking, and confirm with a secure deposit.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/djs"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110"
              >
                Find DJs →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Contact support
              </Link>
            </div>
          </div>

          {/* Footer nav */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 px-6 py-4">
            <div className="text-xs text-white/55">
              © {new Date().getFullYear()} {APP_NAME}
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-semibold text-white/70">
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <Link href="/djs" className="hover:text-white">Find DJs</Link>
              <Link href="/login" className="hover:text-white">For DJs</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
