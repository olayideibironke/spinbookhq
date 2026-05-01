// FILE: app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.spinbookhq.com";
const SITE_NAME = "SpinBook HQ";
const SITE_DESCRIPTION =
  "SpinBook HQ is a premium DJ marketplace. Book verified, professional DJs for weddings, birthday parties, corporate events, nightlife, and private events across the U.S. and Canada.";
const SITE_KEYWORDS = [
  "book a DJ",
  "DJ marketplace",
  "hire a DJ",
  "DJ for wedding",
  "DJ for birthday party",
  "DJ for corporate event",
  "professional DJ booking",
  "verified DJs",
  "DJ near me",
  "DJ booking platform",
  "SpinBook HQ",
  "DJ for private party",
  "event DJ",
  "nightlife DJ",
  "DJ Washington DC",
  "DJ Toronto",
  "DJ Baltimore",
  "DJ Los Angeles",
  "DJ Atlanta",
  "DJ Saint Louis",
].join(", ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "SpinBook HQ — Book Verified DJs for Any Event",
    template: "%s | SpinBook HQ",
  },

  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,

  authors: [{ name: "SpinBook HQ", url: SITE_URL }],
  creator: "SpinBook HQ",
  publisher: "SpinBook HQ",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "SpinBook HQ — Book Verified DJs for Any Event",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SpinBook HQ — Premium DJ Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@spinbookhq",
    creator: "@spinbookhq",
    title: "SpinBook HQ — Book Verified DJs for Any Event",
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  category: "entertainment",
};

/* ─── JSON-LD Structured Data ─── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
      sameAs: [
        "https://www.instagram.com/spinbookhq/",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-202-765-9663",
        contactType: "customer support",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/djs?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      telephone: "+1-202-765-9663",
      email: "info@spinbookhq.com",
      areaServed: ["United States", "Canada"],
      serviceType: "DJ Booking Marketplace",
      priceRange: "$$",
      hasMap: SITE_URL,
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const phone = "12027659663";
  const defaultMessage = encodeURIComponent(
    "Hi SpinBook HQ, I need help with a booking."
  );
  const whatsappHref = `https://wa.me/${phone}?text=${defaultMessage}`;

  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Geo tags for local SEO */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#0b0d12" />
        <meta name="msapplication-TileColor" content="#0b0d12" />
      </head>
      <body
        className={[
          "min-h-screen flex flex-col",
          "pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:pb-0",
        ].join(" ")}
      >
        <Header />
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-white/55">
            © 2026 SpinBook HQ | United States & Canada
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            All Rights Reserved.
          </div>
        </footer>

        {/* WhatsApp Floating Button — unchanged */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with SpinBook HQ on WhatsApp"
          className={[
            "fixed z-[60]",
            "bottom-4 right-4 sm:bottom-6 sm:right-6",
            "inline-flex items-center gap-3 rounded-full",
            "bg-emerald-500 px-4 py-3 sm:px-5",
            "text-sm font-extrabold text-white",
            "shadow-lg shadow-emerald-500/20 ring-1 ring-white/10",
            "transition hover:brightness-110 hover:shadow-emerald-500/30",
            "focus:outline-none focus:ring-2 focus:ring-emerald-300/40",
          ].join(" ")}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5" fill="currentColor">
              <path d="M19.11 17.2c-.25-.12-1.47-.73-1.7-.82-.23-.09-.4-.12-.56.12-.16.25-.64.82-.79.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.37 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z" />
              <path d="M26.67 15.99c0 5.88-4.78 10.67-10.67 10.67-1.87 0-3.69-.5-5.3-1.45l-3.7.97.99-3.61a10.6 10.6 0 01-1.69-5.58C6.3 10.11 11.1 5.33 16 5.33c5.88 0 10.67 4.78 10.67 10.66zm-10.67-8.54c-4.71 0-8.54 3.83-8.54 8.54 0 1.9.63 3.74 1.78 5.22l.14.18-.58 2.12 2.18-.57.17.1c1.43.86 3.07 1.31 4.86 1.31 4.71 0 8.54-3.83 8.54-8.54S20.71 7.45 16 7.45z" />
            </svg>
          </span>
          <span className="hidden sm:inline whitespace-nowrap">Chat With Us! 24/7</span>
        </a>
      </body>
    </html>
  );
}
