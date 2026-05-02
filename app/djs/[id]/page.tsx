// FILE: app/djs/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { id: string };

/* ─── City config ─── */
type CityConfig = {
  label: string;
  state: string;
  searchTerms: string[];
};

const CITY_MAP: Record<string, CityConfig> = {
  toronto:     { label: "Toronto",     state: "Ontario, Canada", searchTerms: ["toronto", "montreal", "ontario"] },
  "new-york":  { label: "New York",    state: "NY",              searchTerms: ["new york", "brooklyn", "nyc"] },
  "los-angeles": { label: "Los Angeles", state: "CA",            searchTerms: ["los angeles", " la"] },
  baltimore:   { label: "Baltimore",   state: "MD",              searchTerms: ["baltimore", "bryan's rd", " md"] },
  "saint-louis": { label: "Saint Louis", state: "Missouri",      searchTerms: ["saint louis", "st. louis", "missouri"] },
  charlotte:   { label: "Charlotte",   state: "NC",              searchTerms: ["charlotte", " nc"] },
  "las-vegas": { label: "Las Vegas",   state: "Nevada",          searchTerms: ["las vegas", "vegas"] },
  phoenix:     { label: "Phoenix",     state: "Arizona",         searchTerms: ["phoenix", "arizona"] },
};

const CITY_SLUGS = Object.keys(CITY_MAP);

const CITY_PAGES = [
  { label: "Toronto",     href: "/djs/toronto" },
  { label: "New York",    href: "/djs/new-york" },
  { label: "Los Angeles", href: "/djs/los-angeles" },
  { label: "Baltimore",   href: "/djs/baltimore" },
  { label: "Saint Louis", href: "/djs/saint-louis" },
  { label: "Charlotte",   href: "/djs/charlotte" },
  { label: "Las Vegas",   href: "/djs/las-vegas" },
  { label: "Phoenix",     href: "/djs/phoenix" },
];

/* ─── DJ helpers ─── */
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
  if (slug === "gene-king"    || name === "gene king")    return "center 18%";
  if (slug === "akea-velli"   || name === "akea velli")   return "center 34%";
  if (slug === "dj-nicksalsa" || name === "dj nicksalsa") return "center 34%";
  return "center";
}

/* ─── Metadata ─── */
export async function generateMetadata(
  { params }: { params: Promise<Params> | Params }
): Promise<Metadata> {
  const { id } = typeof (params as any)?.then === "function"
    ? await (params as Promise<Params>)
    : (params as Params);

  const config = CITY_MAP[id];
  if (!config) return {};

  const title = `Book a DJ in ${config.label}, ${config.state} | SpinBook HQ`;
  const description = `Find and book verified professional DJs in ${config.label}, ${config.state} for weddings, birthday parties, corporate events, and private parties. Browse live DJ profiles on SpinBook HQ.`;

  return {
    title,
    description,
    keywords: `DJ ${config.label}, book a DJ in ${config.label}, hire a DJ ${config.label}, wedding DJ ${config.label}, party DJ ${config.label}`,
    openGraph: { title, description, url: `https://www.spinbookhq.com/djs/${id}`, type: "website" },
    alternates: { canonical: `https://www.spinbookhq.com/djs/${id}` },
  };
}

/* ─── Page ─── */
export default async function DjIdOrCityPage(
  { params }: { params: Promise<Params> | Params }
) {
  const { id } = typeof (params as any)?.then === "function"
    ? await (params as Promise<Params>)
    : (params as Params);

  if (!id) redirect("/djs");

  const supabase = await createClient();

  /* ── CITY PAGE ── */
  if (CITY_SLUGS.includes(id)) {
    const config = CITY_MAP[id]!;

    const { data } = await supabase
      .from("dj_profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    const allDjs = ((data ?? []) as DjProfile[]).filter((dj) => pickSlug(dj) && pickName(dj));
    const cityDjs = allDjs.filter((dj) => {
      const loc = (pickLocation(dj) + " " + valueToString(dj.city) + " " + valueToString(dj.location)).toLowerCase();
      return config.searchTerms.some((term) => loc.includes(term));
    });

    return (
      <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
        <div className="section-inner" style={{ paddingTop: "48px", paddingBottom: "80px" }}>

          <div className="browse-header">
            <div>
              <p className="section-eyebrow">DJ Marketplace · {config.label}</p>
              <h1 className="section-title">Book a DJ in {config.label}, {config.state}</h1>
              <p className="section-sub" style={{ maxWidth: "600px" }}>
                Browse verified DJs available for weddings, birthday parties, corporate
                events, and private parties in {config.label}. Compare pricing and book
                directly through SpinBook HQ.
              </p>
            </div>
            <Link href="/djs" className="cta-ghost hidden sm:inline-flex">← All Cities</Link>
          </div>

          {/* City filter pills */}
          <div className="city-filter-row" aria-label="Browse DJs by city">
            <Link href="/djs" className="city-pill">All Cities</Link>
            {CITY_PAGES.map((c) => (
              <Link key={c.href} href={c.href}
                className={`city-pill${c.href === `/djs/${id}` ? " city-pill--active" : ""}`}>
                {c.label}
              </Link>
            ))}
          </div>

          {/* DJ Grid */}
          {cityDjs.length ? (
            <div className="browse-grid">
              {cityDjs.map((dj) => {
                const name = pickName(dj);
                const slug = pickSlug(dj);
                const photo = pickPhoto(dj);
                const objectPosition = pickCardObjectPosition(dj);
                return (
                  <Link key={pickId(dj)} href={`/dj/${slug}`} className="dj-card group">
                    <div className="dj-card-glow" aria-hidden="true" />
                    <div className="dj-card-photo">
                      {photo ? (
                        <img src={photo} alt={`${name} — DJ in ${config.label}`}
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
              <p>No DJs listed in {config.label} yet.</p>
              <Link href="/djs" className="dj-empty-link">Browse all DJs →</Link>
            </div>
          )}

          {/* SEO text block */}
          <div className="city-seo-footer">
            <h2 className="city-seo-title">Hire a Professional DJ in {config.label}, {config.state}</h2>
            <p className="city-seo-text">
              SpinBook HQ makes it easy to find and book a professional DJ in {config.label} for
              any occasion — weddings, birthday parties, corporate events, house parties, or
              nightlife events. Browse verified DJ profiles, compare starting prices, and send
              your booking request directly through our platform. All DJs on SpinBook HQ are
              reviewed for professionalism, reliability, and booking readiness before being listed.
            </p>
          </div>

        </div>
      </main>
    );
  }

  /* ── LEGACY UUID REDIRECT (original logic unchanged) ── */
  const { data, error } = await supabase
    .from("dj_profiles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.slug) redirect("/djs");
  redirect(`/dj/${data.slug}`);
}
