// FILE: app/djs/(browse)/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse DJs — Book a Professional DJ for Your Event | SpinBook HQ",
  description:
    "Browse verified, professional DJs available for weddings, birthday parties, corporate events, and private parties across the U.S. and Canada. Compare pricing and book instantly on SpinBook HQ.",
  keywords:
    "book a DJ, hire a DJ, DJ near me, DJ for wedding, DJ for party, DJ marketplace, professional DJ, verified DJ, event DJ, DJ booking",
  openGraph: {
    title: "Browse DJs — SpinBook HQ DJ Marketplace",
    description:
      "Find and book verified DJs for any event. Browse live profiles, compare pricing, and send your booking request directly through SpinBook HQ.",
    url: "https://www.spinbookhq.com/djs",
    type: "website",
  },
  alternates: {
    canonical: "https://www.spinbookhq.com/djs",
  },
};

type DjProfile = Record<string, unknown>;

function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function valueToNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function pickId(dj: DjProfile) {
  return valueToString(dj.user_id) || valueToString(dj.id) || valueToString(dj.slug) || Math.random().toString();
}
function pickName(dj: DjProfile) {
  return valueToString(dj.stage_name) || valueToString(dj.display_name) || valueToString(dj.dj_name) || valueToString(dj.full_name) || valueToString(dj.slug) || "DJ";
}
function pickLocation(dj: DjProfile) {
  return valueToString(dj.city) || valueToString(dj.location) || valueToString(dj.market) || "Available for events";
}
function pickSlug(dj: DjProfile) { return valueToString(dj.slug); }
function pickPhoto(dj: DjProfile) {
  return valueToString(dj.avatar_url) || valueToString(dj.photo_url) || valueToString(dj.profile_photo_url) || valueToString(dj.image_url) || valueToString(dj.cover_photo_url);
}
function pickPrice(dj: DjProfile) {
  const price = valueToNumber(dj.starting_price) ?? valueToNumber(dj.from_price) ?? valueToNumber(dj.base_price);
  if (price && price > 0) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
  }
  return "View pricing";
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "D") + (parts[1]?.[0] ?? "")).toUpperCase();
}
function pickCardObjectPosition(dj: DjProfile) {
  const slug = pickSlug(dj).toLowerCase();
  const name = pickName(dj).toLowerCase();
  if (slug === "gene-king" || name === "gene king") return "center 18%";
  if (slug === "akea-velli" || name === "akea velli") return "center 34%";
  if (slug === "dj-nicksalsa" || name === "dj nicksalsa") return "center 34%";
  return "center";
}

const CITY_PAGES = [
  { label: "Toronto", href: "/djs/toronto" },
  { label: "New York", href: "/djs/new-york" },
  { label: "Los Angeles", href: "/djs/los-angeles" },
  { label: "Baltimore", href: "/djs/baltimore" },
  { label: "Saint Louis", href: "/djs/saint-louis" },
  { label: "Charlotte", href: "/djs/charlotte" },
  { label: "Las Vegas", href: "/djs/las-vegas" },
  { label: "Phoenix", href: "/djs/phoenix" },
];

export default async function BrowseDjsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  const djs = ((data ?? []) as DjProfile[]).filter((dj) => pickSlug(dj) && pickName(dj));

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
      <div className="section-glow section-glow--right" style={{ position: "fixed", top: 0, right: 0, pointerEvents: "none" }} aria-hidden="true" />

      <div className="section-inner" style={{ paddingTop: "48px", paddingBottom: "80px" }}>

        {/* Header */}
        <div className="browse-header">
          <div>
            <p className="section-eyebrow">DJ Marketplace</p>
            <h1 className="section-title">Browse DJs for your next event.</h1>
            <p className="section-sub" style={{ maxWidth: "600px" }}>
              Explore verified DJ profiles, photos, starting prices, and booking
              availability in select launch markets across the U.S. and Canada.
            </p>
          </div>
          <Link href="/" className="cta-ghost hidden sm:inline-flex">← Back to Home</Link>
        </div>

        {/* City filter pills */}
        <div className="city-filter-row" aria-label="Browse DJs by city">
          <Link href="/djs" className="city-pill city-pill--active">All Cities</Link>
          {CITY_PAGES.map((c) => (
            <Link key={c.href} href={c.href} className="city-pill">{c.label}</Link>
          ))}
        </div>

        {/* DJ Grid */}
        {djs.length ? (
          <div className="browse-grid">
            {djs.map((dj) => {
              const name = pickName(dj);
              const slug = pickSlug(dj);
              const photo = pickPhoto(dj);
              const objectPosition = pickCardObjectPosition(dj);
              return (
                <Link key={pickId(dj)} href={`/dj/${slug}`} className="dj-card group">
                  <div className="dj-card-glow" aria-hidden="true" />
                  <div className="dj-card-photo">
                    {photo ? (
                      <img src={photo} alt={`${name} — DJ available for booking on SpinBook HQ`}
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
                    <span className="dj-price">From {pickPrice(dj)}</span>
                    <span className="dj-book-btn">Book Now →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="dj-empty">
            <p>No live DJ profiles available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
