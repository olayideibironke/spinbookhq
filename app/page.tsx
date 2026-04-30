// FILE: app/page.tsx — SpinBook HQ Homepage + Testimonials

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* ─── Helpers ─── */
function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function valueToNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
type DjCard = Record<string, unknown>;

function pickId(dj: DjCard) {
  return valueToString(dj.user_id) || valueToString(dj.id) || valueToString(dj.slug) || Math.random().toString();
}
function pickDisplayName(dj: DjCard) {
  return valueToString(dj.stage_name) || valueToString(dj.display_name) || valueToString(dj.dj_name) || valueToString(dj.full_name) || valueToString(dj.slug) || "DJ";
}
function pickLocation(dj: DjCard) {
  return valueToString(dj.city) || valueToString(dj.location) || valueToString(dj.market) || "Available for events";
}
function pickSlug(dj: DjCard) { return valueToString(dj.slug); }
function pickPhoto(dj: DjCard) {
  return valueToString(dj.avatar_url) || valueToString(dj.photo_url) || valueToString(dj.profile_photo_url) || valueToString(dj.image_url) || valueToString(dj.cover_photo_url);
}
function pickFromPrice(dj: DjCard) {
  const v = valueToNumber(dj.starting_price) ?? valueToNumber(dj.from_price) ?? valueToNumber(dj.base_price);
  return v && v > 0 ? v : null;
}
function formatFromPrice(value: number) {
  try { return `From ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}`; }
  catch { return `From $${value}`; }
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "D") + (parts[1]?.[0] ?? "")).toUpperCase();
}
function pickHref(dj: DjCard) { return pickSlug(dj) ? `/dj/${pickSlug(dj)}` : "/djs"; }
function pickCardObjectPosition(dj: DjCard) {
  const slug = pickSlug(dj).toLowerCase();
  const name = pickDisplayName(dj).toLowerCase();
  if (slug === "gene-king"    || name === "gene king")    return "center 18%";
  if (slug === "akea-velli"   || name === "akea velli")   return "center 34%";
  if (slug === "dj-nicksalsa" || name === "dj nicksalsa") return "center 34%";
  return "center";
}

/* ─── EQ Bars ─── */
function EqBars({ count = 12, className = "" }: { count?: number; className?: string }) {
  const allBars = [
    { delay: "0s", max: "38px" }, { delay: "0.12s", max: "24px" },
    { delay: "0.22s", max: "52px" }, { delay: "0.08s", max: "30px" },
    { delay: "0.32s", max: "60px" }, { delay: "0.18s", max: "22px" },
    { delay: "0.28s", max: "46px" }, { delay: "0.04s", max: "34px" },
    { delay: "0.14s", max: "42px" }, { delay: "0.36s", max: "26px" },
    { delay: "0.24s", max: "56px" }, { delay: "0.06s", max: "32px" },
  ];
  return (
    <div className={`eq-bars-wrap ${className}`} aria-hidden="true">
      {allBars.slice(0, count).map((bar, i) => (
        <span key={i} className="eq-bar"
          style={{ "--delay": bar.delay, "--max-h": bar.max } as React.CSSProperties} />
      ))}
    </div>
  );
}

/* ─── Vinyl Record ─── */
function VinylRecord() {
  return (
    <div className="vinyl-scene" aria-hidden="true">
      <div className="vinyl-glow" />
      <div className="vinyl-record">
        <div className="vinyl-label">
          <span className="vinyl-label-brand">SPINBOOK</span>
          <div className="vinyl-label-dot" />
          <span className="vinyl-label-sub">HQ</span>
        </div>
      </div>
      <div className="vinyl-arm-wrap">
        <div className="vinyl-arm"><div className="vinyl-arm-head" /></div>
      </div>
      <div className="vinyl-reflection" />
    </div>
  );
}

/* ─── Static data ─── */
const GENRES = ["Hip-Hop", "House", "R&B", "Afrobeats", "Latin", "EDM", "Top 40", "Reggaeton"];

const TICKER_ITEMS = [
  "Now Booking · Select DJ Markets", "Verified Profiles",
  "Secure Deposits via Stripe", "Request DJ Availability",
  "Premium Event Matching", "Live DJ Network",
];

const HOW_IT_WORKS = [
  { step: "01", title: "Browse DJs",          desc: "Explore live profiles, city, pricing, and event fit.",           cta: { label: "Browse now", href: "/djs" } },
  { step: "02", title: "Open a Profile",       desc: "Review DJ details and click the booking request option.",        cta: null },
  { step: "03", title: "Submit Event Details", desc: "Share your date, venue, event type, budget, and contact info.", cta: null },
  { step: "04", title: "Await Confirmation",   desc: "The DJ reviews and responds before the event is secured.",      cta: null },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    quote: "SpinBook HQ made finding a DJ for my daughter's sweet sixteen so easy. The DJ showed up prepared, read the room perfectly, and had everyone dancing all night. Highly recommend.",
    name: "Danielle R.",
    role: "Private Event · Atlanta, GA",
    initials: "DR",
    stars: 5,
  },
  {
    quote: "I was skeptical at first, but the booking process was seamless. Within 24 hours I had a confirmed DJ for our corporate holiday party. Professional from start to finish.",
    name: "Marcus T.",
    role: "Corporate Event · Washington, DC",
    initials: "MT",
    stars: 5,
  },
  {
    quote: "We used SpinBook HQ for our wedding reception and couldn't be happier. The platform made communication so clean, no back and forth, just clear details and a locked in deposit, and we had so much fun with the DJ services.",
    name: "Jasmine & Andre W.",
    role: "Wedding · Toronto, ON",
    initials: "JW",
    stars: 5,
  },
  {
    quote: "As a DJ myself, being listed on SpinBook HQ has brought me consistent, quality clients. The platform is professional and the clients who come through are serious about their events.",
    name: "DJ Pressure",
    role: "Verified DJ · Baltimore, MD",
    initials: "DJ",
    stars: 5,
  },
  {
    quote: "Booked a DJ for my birthday rooftop party in under an hour. The profile had everything I needed! OMG from pricing, vibe, city. No guesswork. Will definitely use SpinBook HQ again.",
    name: "Keisha M.",
    role: "Birthday Event · Los Angeles, CA",
    initials: "KM",
    stars: 5,
  },
];

/* ─── Star Rating ─── */
function Stars({ count }: { count: number }) {
  return (
    <div className="testimonial-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1l1.545 3.09L12 4.635l-2.5 2.41.59 3.41L7 8.9l-3.09 1.555.59-3.41L2 4.635l3.455-.545L7 1z" fill="#e879f9" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default async function Home() {
  const INSTAGRAM_URL = "https://www.instagram.com/spinbookhq/";
  const supabase = await createClient();

  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  const featuredDjs = ((data ?? []) as DjCard[])
    .filter((dj) => pickSlug(dj) && pickDisplayName(dj))
    .slice(0, 6);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ══ TICKER ══════════════════════════════════════════════════════ */}
      <div className="ticker-shell" aria-label="Live updates">
        <div className="ticker-track">
          {[0, 1].map((set) => (
            <span key={set} className="ticker-set">
              {TICKER_ITEMS.map((item, j) => (
                <span key={j} className="ticker-item">
                  <span className="ticker-dot" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-glows" aria-hidden="true">
          <div className="glow glow-1" />
          <div className="glow glow-2" />
          <div className="glow glow-3" />
          <div className="hero-grid-overlay" />
        </div>

        <div className="hero-split">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="live-dot" aria-hidden="true" />
              <span>Premium DJ Bookings · Verified · Select Cities</span>
            </div>

            <h1 className="hero-headline-v2">
              <span className="hl-find">Find &amp; Book</span>
              <span className="hl-main">Premier<br />DJs</span>
              <span className="hl-sub">for any event, anywhere.</span>
            </h1>

            <p className="hero-sub">
              Browse verified DJ profiles, compare pricing, and send your booking
              request directly through {APP_NAME}.
            </p>

            <div className="now-booking-bar">
              <EqBars count={7} className="nb-eq" />
              <div className="nb-info">
                <span className="nb-label">NOW BOOKING</span>
                <span className="nb-city">DJs available in select markets</span>
              </div>
              <span className="live-dot" aria-hidden="true" />
            </div>

            <div className="hero-ctas">
              <Link href="/djs" className="cta-primary">
                Browse DJs
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/#featured-djs" className="cta-secondary">See Featured DJs</Link>
              <Link href="/#how-it-works" className="cta-ghost">How It Works</Link>
              <Link href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="cta-ghost">Instagram</Link>
            </div>
          </div>

          <div className="hero-right">
            <VinylRecord />
            <div className="genre-cloud" aria-label="Music genres available">
              {GENRES.map((g, i) => (
                <span key={g} className="genre-pill" style={{ "--pill-i": i } as React.CSSProperties}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════════════ */}
      <div className="stats-strip">
        <div className="stats-inner">
          {[
            { value: "500+", label: "Events Booked" },
            { value: "100+", label: "Verified DJs" },
            { value: "20+",  label: "Launch Cities" },
            { value: "4.9★", label: "Avg. Rating" },
          ].map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURED DJS ════════════════════════════════════════════════ */}
      <section id="featured-djs" className="section scroll-mt-20">
        <div className="section-glow section-glow--right" aria-hidden="true" />
        <div className="section-inner">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Lineup</p>
              <h2 className="section-title">Featured DJs</h2>
              <p className="section-sub">Live profiles available for booking requests.</p>
            </div>
            <Link href="/djs" className="cta-ghost hidden sm:inline-flex">View all →</Link>
          </div>

          <div className="dj-grid">
            {featuredDjs.map((dj) => {
              const name           = pickDisplayName(dj);
              const from           = pickFromPrice(dj);
              const href           = pickHref(dj);
              const photoSrc       = pickPhoto(dj);
              const objectPosition = pickCardObjectPosition(dj);
              return (
                <Link key={pickId(dj)} href={href} className="dj-card group">
                  <div className="dj-card-glow" aria-hidden="true" />
                  <div className="dj-card-photo">
                    {photoSrc ? (
                      <img src={photoSrc} alt={name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        style={{ objectPosition }} />
                    ) : (
                      <div className="dj-card-photo-fallback">
                        <span className="dj-initials">{initials(name)}</span>
                      </div>
                    )}
                    <div className="dj-card-photo-overlay" />
                    <div className="dj-card-photo-name">
                      <p className="dj-name">{name}</p>
                      <p className="dj-location">
                        <svg width="9" height="11" viewBox="0 0 10 12" fill="none" aria-hidden="true" className="inline mr-1 opacity-50">
                          <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" />
                        </svg>
                        {pickLocation(dj)}
                      </p>
                    </div>
                  </div>
                  <div className="dj-card-foot">
                    <span className="dj-price">{from ? formatFromPrice(from) : "View pricing"}</span>
                    <span className="dj-book-btn">Book Now →</span>
                  </div>
                </Link>
              );
            })}
            {!featuredDjs.length && (
              <div className="dj-empty">
                <p>Live DJ profiles are being prepared.</p>
                <Link href="/djs" className="dj-empty-link">Browse all DJs →</Link>
              </div>
            )}
          </div>

          <div className="mt-6 sm:hidden">
            <Link href="/djs" className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              View all DJs
            </Link>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section scroll-mt-24 border-t border-white/[0.07]">
        <div className="section-glow section-glow--left" aria-hidden="true" />
        <div className="section-inner">
          <div className="mb-14 text-center">
            <p className="section-eyebrow">Process</p>
            <h2 className="section-title">How It Works</h2>
            <p className="section-sub mx-auto max-w-md">From browsing to booked — four simple steps.</p>
          </div>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="step-card">
                <div className="step-head">
                  <div className="step-number">{item.step}</div>
                  {i < HOW_IT_WORKS.length - 1 && <div className="step-connector" aria-hidden="true" />}
                </div>
                <p className="step-title">{item.title}</p>
                <p className="step-desc">{item.desc}</p>
                {item.cta && <Link href={item.cta.href} className="step-link">{item.cta.label} →</Link>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════════ */}
      <section className="section border-t border-white/[0.07]">
        <div className="section-glow section-glow--right" aria-hidden="true" />
        <div className="section-inner">
          <div className="mb-14 text-center">
            <p className="section-eyebrow">What People Say</p>
            <h2 className="section-title">Trusted by Clients &amp; DJs</h2>
            <p className="section-sub mx-auto max-w-md">
              Real experiences from people who've used SpinBook HQ to book and perform at events.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <Stars count={t.stars} />
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
      <section className="section border-t border-white/[0.07]">
        <div className="cta-glow" aria-hidden="true" />
        <div className="section-inner">
          <div className="cta-block">
            <div className="flex justify-center mb-6">
              <EqBars className="cta-eq" />
            </div>
            <h3 className="cta-block-title">Ready to find your DJ?</h3>
            <p className="cta-block-sub">Browse live profiles and request availability for your event.</p>
            <div className="cta-block-actions">
              <Link href="/djs" className="cta-primary">
                Browse DJs
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/contact" className="cta-secondary">Contact SpinBook HQ</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
