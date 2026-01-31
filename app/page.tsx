// FILE: app/page.tsx

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "D";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function formatFromPrice(value: number) {
  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
    return `From ${formatted}`;
  } catch {
    return `From $${value}`;
  }
}

type DjCard = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  dj_name?: string | null;
  display_name?: string | null;
  city: string | null;
  location?: string | null;
  starting_price?: number | null;
  from_price?: number | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  published?: boolean | null;
  is_published?: boolean | null;
};

function pickDisplayName(dj: DjCard) {
  return dj.stage_name || dj.display_name || dj.dj_name || dj.slug || "DJ";
}

function pickLocation(dj: DjCard) {
  return dj.city || dj.location || "Available for events";
}

function pickFromPrice(dj: DjCard) {
  const v = dj.starting_price ?? dj.from_price ?? null;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  return null;
}

function pickHref(dj: DjCard) {
  if (dj.slug) return `/dj/${dj.slug}`;
  return "/djs";
}

export default async function Home() {
  const INSTAGRAM_URL = "https://www.instagram.com/spinbookhq/";
  const supabase = await createClient();

  // Featured DJs: keep this query resilient to schema variations.
  const { data: featuredDjsRaw } = await supabase
    .from("dj_profiles")
    .select(
      "user_id, slug, stage_name, dj_name, display_name, city, location, starting_price, from_price, avatar_url, photo_url, published, is_published"
    )
    .or("published.eq.true,is_published.eq.true")
    .order("updated_at", { ascending: false })
    .limit(6);

  const featuredDjs = (featuredDjsRaw ?? []) as DjCard[];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* ✅ COLORS ONLY: hero background wash */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                Premium DJ bookings • Deposits • Verified profiles
              </p>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Book the perfect DJ for your event on{" "}
                <span className="text-white">{APP_NAME}</span>.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/75">
                Browse DJs, request a quote, and secure your date with a deposit.
                Simple, clean, and built for real events.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/djs"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Browse DJs
                </Link>

                <Link
                  href="/#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  How It Works
                </Link>

                <Link
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
                >
                  Instagram
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/90">
                      Featured marketplace
                    </p>
                    <p className="text-xs text-white/60">Fast booking flow</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 1</p>
                      <p className="mt-1 text-sm font-semibold">Create request</p>
                      <p className="mt-2 text-sm text-white/70">
                        Tell us the date, location, and vibe.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 2</p>
                      <p className="mt-1 text-sm font-semibold">DJ responds</p>
                      <p className="mt-2 text-sm text-white/70">
                        Your DJ accepts or declines quickly.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 3</p>
                      <p className="mt-1 text-sm font-semibold">Pay deposit</p>
                      <p className="mt-2 text-sm text-white/70">
                        Secure your date with a deposit checkout link.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 4</p>
                      <p className="mt-1 text-sm font-semibold">Confirm details</p>
                      <p className="mt-2 text-sm text-white/70">
                        Finalize timing, set list, and logistics.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-sm font-semibold">Built for real bookings</p>
                    <p className="mt-2 text-sm text-white/70">
                      Deposits, notifications, and a clean experience for DJs and clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* end hero visual */}
          </div>
        </div>
      </section>

      {/* FEATURED DJS */}
      <section className="relative overflow-hidden">
        {/* ✅ COLORS ONLY: section 3 background wash */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/35 via-black to-fuchsia-950/25" />
          <div className="absolute -top-56 left-1/2 h-[34rem] w-[80rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -top-40 right-[-14rem] h-[28rem] w-[44rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured DJs</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Verified profiles with clear starting prices and fast booking flow.
              </p>
            </div>

            <Link
              href="/djs"
              className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex"
            >
              View all
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(featuredDjs?.length ? featuredDjs : []).map((dj) => {
              const name = pickDisplayName(dj);
              const from = pickFromPrice(dj);
              const href = pickHref(dj);

              return (
                <Link
                  key={dj.user_id}
                  href={href}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/50 text-sm font-semibold">
                      {initials(name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{name}</p>
                      <p className="truncate text-sm text-white/65">
                        {pickLocation(dj)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-white/70">
                      {from ? formatFromPrice(from) : "View pricing"}
                    </p>
                    <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/80">
                      View
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute -inset-10 bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
                  </div>
                </Link>
              );
            })}

            {!featuredDjs?.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 sm:col-span-2 lg:col-span-3">
                No featured DJs yet.{" "}
                <Link href="/djs" className="underline underline-offset-4">
                  Browse all DJs
                </Link>{" "}
                to explore profiles.
              </div>
            ) : null}
          </div>

          <div className="mt-6 sm:hidden">
            <Link
              href="/djs"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View all DJs
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden scroll-mt-24 border-t border-white/10"
        aria-label="How it works"
      >
        {/* ✅ COLORS ONLY: keep this section consistent with the page wash */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-black to-fuchsia-950/20" />
          <div className="absolute -top-56 left-1/2 h-[34rem] w-[80rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -top-40 right-[-14rem] h-[28rem] w-[44rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">How It Works</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              A clean booking flow designed for clients and DJs — request, accept, and
              secure your date with a deposit.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">01</p>
              <p className="mt-2 text-base font-semibold">Browse DJs</p>
              <p className="mt-2 text-sm text-white/70">
                Explore profiles, sound, vibe, and starting prices.
              </p>
              <div className="mt-4">
                <Link
                  href="/djs"
                  className="inline-flex rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Browse now
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">02</p>
              <p className="mt-2 text-base font-semibold">Create a request</p>
              <p className="mt-2 text-sm text-white/70">
                Share event date, location, and what you need.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">03</p>
              <p className="mt-2 text-base font-semibold">DJ accepts or declines</p>
              <p className="mt-2 text-sm text-white/70">
                You get an email update when the DJ responds.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">04</p>
              <p className="mt-2 text-base font-semibold">Pay deposit</p>
              <p className="mt-2 text-sm text-white/70">
                If accepted, you receive a secure deposit checkout link to lock the date.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold">Pro tip</p>
            <p className="mt-2 text-sm text-white/70">
              If you click{" "}
              <span className="font-semibold text-white">How It Works</span> in the
              header, this section is guaranteed to exist in the DOM and the page can
              scroll here reliably.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ FOOTER CTA (Section 4) — COLORS ONLY background wash */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/25 via-black to-fuchsia-950/15" />
          <div className="absolute -top-56 left-1/2 h-[34rem] w-[80rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -top-40 right-[-14rem] h-[28rem] w-[44rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
            <h3 className="text-xl font-semibold tracking-tight">Ready to book?</h3>
            <p className="mt-2 text-sm text-white/70">
              Browse top DJs and request availability in minutes.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/djs"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                Browse DJs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
