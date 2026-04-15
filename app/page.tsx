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
      <section className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium tracking-[0.14em] text-white/75 uppercase">
            Now accepting booking requests in select live DJ markets
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <Link
              href="/djs"
              className="text-xs font-semibold text-white/85 underline underline-offset-4 hover:text-white"
            >
              Browse DJs
            </Link>
            <Link
              href="/#how-it-works"
              className="text-xs font-semibold text-white/60 underline underline-offset-4 hover:text-white/85"
            >
              How booking works
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10">
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
                Premium DJ bookings • Verified profiles • Select launch cities
              </p>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Hire a DJ for your next event on{" "}
                <span className="text-white">{APP_NAME}</span>.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/75">
                Browse live DJ profiles, compare starting prices, request availability,
                and send your event details directly through SpinBook HQ.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/djs"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Browse DJs
                </Link>

                <Link
                  href="/#featured-djs"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  See featured DJs
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

            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/90">
                      Client booking flow
                    </p>
                    <p className="text-xs text-white/60">Soft launch active</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 1</p>
                      <p className="mt-1 text-sm font-semibold">Browse DJs</p>
                      <p className="mt-2 text-sm text-white/70">
                        View live profiles, city, vibe, and starting price.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 2</p>
                      <p className="mt-1 text-sm font-semibold">Request booking</p>
                      <p className="mt-2 text-sm text-white/70">
                        Send date, venue, event type, and contact details.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 3</p>
                      <p className="mt-1 text-sm font-semibold">DJ reviews</p>
                      <p className="mt-2 text-sm text-white/70">
                        The DJ can review the request and respond.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-white/60">Step 4</p>
                      <p className="mt-1 text-sm font-semibold">Secure event</p>
                      <p className="mt-2 text-sm text-white/70">
                        Confirm details and move toward deposit/payment.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-sm font-semibold">For real event requests</p>
                    <p className="mt-2 text-sm text-white/70">
                      SpinBook HQ is opening carefully in markets where live DJs are
                      already available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="featured-djs"
        className="relative overflow-hidden bg-black sm:bg-gradient-to-r sm:from-purple-950/35 sm:via-black sm:to-fuchsia-950/25"
      >
        <div className="pointer-events-none absolute inset-0 z-0 sm:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured DJs</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Start with live DJ profiles currently available for booking requests.
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
            {featuredDjs.map((dj) => {
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
                      View profile
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute -inset-10 bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
                  </div>
                </Link>
              );
            })}

            {!featuredDjs.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 sm:col-span-2 lg:col-span-3">
                Live DJ profiles are being prepared.{" "}
                <Link href="/djs" className="underline underline-offset-4">
                  Browse DJs
                </Link>
                .
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

      <section
        id="how-it-works"
        className="relative overflow-hidden scroll-mt-24 border-t border-white/10 bg-black sm:bg-gradient-to-r sm:from-purple-950/30 sm:via-black sm:to-fuchsia-950/20"
        aria-label="How it works"
      >
        <div className="pointer-events-none absolute inset-0 z-0 sm:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">How It Works</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              A simple client flow: find a DJ, send your event request, and move
              toward confirmation.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">01</p>
              <p className="mt-2 text-base font-semibold">Browse DJs</p>
              <p className="mt-2 text-sm text-white/70">
                Explore live DJ profiles, city, pricing, and event fit.
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
              <p className="mt-2 text-base font-semibold">Open a profile</p>
              <p className="mt-2 text-sm text-white/70">
                Review the DJ’s details and click the booking request option.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">03</p>
              <p className="mt-2 text-base font-semibold">Submit event details</p>
              <p className="mt-2 text-sm text-white/70">
                Share your date, location, event type, budget, and contact info.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/60">04</p>
              <p className="mt-2 text-base font-semibold">Wait for response</p>
              <p className="mt-2 text-sm text-white/70">
                The DJ reviews your request before the event is confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-black sm:bg-gradient-to-r sm:from-purple-950/25 sm:via-black sm:to-fuchsia-950/15">
        <div className="pointer-events-none absolute inset-0 z-0 sm:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
            <h3 className="text-xl font-semibold tracking-tight">
              Ready to find a DJ?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Browse live profiles and request availability for your event.
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
                Contact SpinBook HQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}