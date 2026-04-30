// FILE: app/contact/page.tsx — SpinBook HQ Premium Revamp

import Link from "next/link";

export const dynamic = "force-dynamic";

/* ─── EQ Bars ─── */
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

const FORM_ACTION = "https://formspree.io/f/mlgbwagq";

const CONTACT_CARDS = [
  {
    icon: "✉",
    label: "Email",
    value: "info@spinbookhq.com",
    href: "mailto:info@spinbookhq.com",
    note: "Best for detailed requests and confirmations.",
  },
  {
    icon: "☎",
    label: "Phone",
    value: "+1 (202) 765-9663",
    href: "tel:+12027659663",
    note: "For urgent support and quick questions.",
  },
  {
    icon: "⚡",
    label: "Response Time",
    value: "Within 24 hours",
    href: null,
    note: "Faster during business hours.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="contact-hero">
        <div className="hero-glows" aria-hidden="true">
          <div className="glow glow-1" />
          <div className="glow glow-2" />
          <div className="glow glow-3" />
          <div className="hero-grid-overlay" />
        </div>

        <div className="contact-hero-inner">
          <div className="contact-hero-left">
            <div className="hero-badge">
              <span className="live-dot" aria-hidden="true" />
              Get In Touch
            </div>

            <h1 className="contact-headline">
              <span className="contact-hl-top">Contact</span>
              <span className="contact-hl-main">SpinBook<br />HQ</span>
            </h1>

            <EqBars count={10} className="contact-eq" />

            <p className="contact-hero-sub">
              For bookings, questions, or support — send us a message and we
              typically respond within 24 hours.
            </p>

            <Link href="/" className="cta-ghost" style={{ paddingLeft: 0 }}>
              ← Back to home
            </Link>
          </div>

          {/* Contact cards */}
          <div className="contact-cards-col">
            {CONTACT_CARDS.map((card) => (
              <div key={card.label} className="contact-info-card">
                <div className="contact-card-icon">{card.icon}</div>
                <div className="contact-card-body">
                  <p className="contact-card-label">{card.label}</p>
                  {card.href ? (
                    <a href={card.href} className="contact-card-value contact-card-link">
                      {card.value}
                    </a>
                  ) : (
                    <p className="contact-card-value">{card.value}</p>
                  )}
                  <p className="contact-card-note">{card.note}</p>
                </div>
              </div>
            ))}

            <div className="contact-tip">
              <span className="contact-tip-icon" aria-hidden="true">💡</span>
              <p>
                For booking inquiries, include the DJ name, event date, location,
                and budget range for a faster response.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FORM SECTION ════════════════════════════════════════════════ */}
      <section className="section border-t border-white/[0.07]">
        <div className="section-glow section-glow--right" aria-hidden="true" />
        <div className="section-inner">

          <div className="contact-form-wrap">
            {/* Form header */}
            <div className="contact-form-header">
              <div>
                <p className="section-eyebrow">Send a Message</p>
                <h2 className="contact-form-title">We'll get back to you</h2>
                <p className="section-sub">Fill out the form below and we'll respond as soon as possible.</p>
              </div>
              <div className="contact-secure-badge">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M6.5 1L2 3v4c0 2.5 2 4.5 4.5 5.5C9 11.5 11 9.5 11 7V3L6.5 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                Secure form
              </div>
            </div>

            {/* Form */}
            <form action={FORM_ACTION} method="POST" className="contact-form">
              <div className="contact-form-row">
                <div className="contact-field">
                  <label htmlFor="name" className="contact-label">Full name</label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="Your name"
                    className="contact-input"
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="email" className="contact-label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    className="contact-input"
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="subject" className="contact-label">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  required
                  placeholder="What's this about?"
                  className="contact-input"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="message" className="contact-label">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Type your message…"
                  rows={7}
                  className="contact-input contact-textarea"
                />
              </div>

              <div className="contact-form-footer">
                <p className="contact-disclaimer">
                  By submitting, you agree SpinBook HQ may contact you regarding
                  your request.
                </p>
                <button type="submit" className="cta-primary">
                  Send Message
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>

    </main>
  );
}
