// FILE: app/dj-waitlist/page.tsx — SpinBook HQ Premium Revamp

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

function EqBars({ count = 10, className = "" }: { count?: number; className?: string }) {
  const allBars = [
    { delay: "0s",    max: "38px" }, { delay: "0.12s", max: "24px" },
    { delay: "0.22s", max: "52px" }, { delay: "0.08s", max: "30px" },
    { delay: "0.32s", max: "60px" }, { delay: "0.18s", max: "22px" },
    { delay: "0.28s", max: "46px" }, { delay: "0.04s", max: "34px" },
    { delay: "0.14s", max: "42px" }, { delay: "0.36s", max: "26px" },
  ];
  return (
    <div className={`eq-bars-wrap ${className}`} aria-hidden="true">
      {allBars.slice(0, count).map((bar, i) => (
        <span key={i} className="eq-bar"
          style={{ "--delay": bar.delay, "--max-h": bar.max } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

const REQUIREMENTS = [
  "Professional DJ brand or stage identity",
  "Clear photos, promo content, or social presence",
  "Experience with private, social, corporate, or venue events",
  "Reliable communication and booking readiness",
  "Willingness to follow the SpinBook HQ platform workflow",
];

const SEND_ITEMS = [
  "DJ / stage name",
  "City, state/province, and country",
  "Instagram, website, or social link",
  "Short DJ bio",
  "Starting booking price",
  "Event types you perform",
  "Clear photos or promotional images",
];

const STEPS = [
  { num: "01", title: "Submit Your Interest", desc: "Tell us who you are, where you perform, and what type of events you handle." },
  { num: "02", title: "Profile Review",        desc: "Our team reviews your market, brand presence, experience, and booking readiness." },
  { num: "03", title: "Roster Consideration", desc: "If there's a fit, we'll contact you with the next onboarding steps." },
];

export default async function DjWaitlistPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ══ HERO ══ */}
      <section className="dj-hero">
        <div className="hero-glows" aria-hidden="true">
          <div className="glow glow-1" />
          <div className="glow glow-2" />
          <div className="glow glow-3" />
          <div className="hero-grid-overlay" />
        </div>

        <div className="dj-hero-inner">
          <div className="dj-hero-badges">
            <span className="hero-badge">
              <span className="live-dot" aria-hidden="true" />
              DJ Roster Access
            </span>
            <span className="dj-badge-market">U.S. + Canada · Select Launch Markets</span>
          </div>

          <h1 className="dj-hero-headline">
            <span className="dj-hl-top">Join the</span>
            <span className="dj-hl-main">{APP_NAME}<br />DJ Roster</span>
            <EqBars count={10} className="dj-hl-eq" />
          </h1>

          <p className="dj-hero-sub">
            {APP_NAME} is building a trusted DJ marketplace for clients booking reliable DJs for
            weddings, birthdays, corporate events, private parties, nightlife, concerts, and more.
          </p>
          <p className="dj-hero-sub" style={{ marginTop: "-8px" }}>
            We're reviewing DJs in select U.S. and Canada markets. Submit your interest and our
            team will follow up if your profile, city, and booking readiness match our current
            launch needs.
          </p>

          <div className="dj-hero-ctas">
            <a href="mailto:info@spinbookhq.com" className="cta-primary">Apply Now →</a>
            <Link href="/djs" className="cta-secondary">View DJ Marketplace</Link>
          </div>
        </div>
      </section>

      {/* ══ STEPS ══ */}
      <section className="section border-t border-white/[0.07]">
        <div className="section-glow section-glow--right" aria-hidden="true" />
        <div className="section-inner">
          <div className="mb-14 text-center">
            <p className="section-eyebrow">The Process</p>
            <h2 className="section-title">How It Works</h2>
            <p className="section-sub mx-auto max-w-md">Three simple steps from interest to roster.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.num} className="step-card">
                <div className="step-head">
                  <div className="step-number">{s.num}</div>
                  {i < STEPS.length - 1 && <div className="step-connector" aria-hidden="true" />}
                </div>
                <p className="step-title">{s.title}</p>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ REQUIREMENTS + APPLY ══ */}
      <section className="section border-t border-white/[0.07]">
        <div className="section-glow section-glow--left" aria-hidden="true" />
        <div className="section-inner">
          <div className="dj-two-col">
            <div className="dj-info-card">
              <p className="section-eyebrow" style={{ marginBottom: "16px" }}>Standards</p>
              <h3 className="dj-info-title">What We Look For</h3>
              <ul className="dj-checklist">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="dj-checklist-item">
                    <span className="dj-check-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="dj-info-card dj-info-card--accent">
              <p className="section-eyebrow" style={{ marginBottom: "16px" }}>Application</p>
              <h3 className="dj-info-title">Send Us Your Details</h3>
              <p className="dj-info-sub">
                Email your DJ details to{" "}
                <a href="mailto:info@spinbookhq.com" className="dj-email-link">info@spinbookhq.com</a>{" "}
                with the following:
              </p>
              <ul className="dj-checklist" style={{ marginTop: "20px" }}>
                {SEND_ITEMS.map((item) => (
                  <li key={item} className="dj-checklist-item">
                    <span className="dj-check-icon dj-check-icon--fuchsia" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="mailto:info@spinbookhq.com" className="cta-primary" style={{ marginTop: "28px", display: "inline-flex" }}>
                Apply via Email →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CURATED CTA ══ */}
      <section className="section border-t border-white/[0.07]">
        <div className="cta-glow" aria-hidden="true" />
        <div className="section-inner">
          <div className="cta-block">
            <div className="flex justify-center mb-6">
              <EqBars count={12} className="cta-eq" />
            </div>
            <h3 className="cta-block-title">Curated Roster.<br />Professional Standards.</h3>
            <p className="cta-block-sub" style={{ maxWidth: "560px", margin: "0 auto 32px" }}>
              SpinBook HQ is not an open directory. We review DJs carefully so clients discover
              serious, professional talent — and DJs receive better-quality booking opportunities.
            </p>
            <div className="cta-block-actions">
              <a href="mailto:info@spinbookhq.com" className="cta-primary">Apply Now →</a>
              <Link href="/djs" className="cta-secondary">View DJ Marketplace</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ALREADY ONBOARDED ══ */}
      <section className="section border-t border-white/[0.07]" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
        <div className="section-inner">
          <div className="dj-onboarded-bar">
            <div>
              <p className="dj-onboarded-title">Already onboarded?</p>
              <p className="dj-onboarded-sub">
                Follow the onboarding and booking instructions shared by our team. For dashboard,
                profile, or booking flow support, contact SpinBook HQ support anytime.
              </p>
            </div>
            <Link href="/contact" className="cta-secondary" style={{ flexShrink: 0 }}>
              Get Support →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER NOTE ══ */}
      <div className="dj-footer-note">
        <p>Looking to book a DJ?{" "}
          <Link href="/djs" className="dj-footer-link">Browse live DJ profiles →</Link>
        </p>
      </div>

    </main>
  );
}
