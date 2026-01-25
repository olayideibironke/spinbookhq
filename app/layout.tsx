// web/app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SpinBook HQ",
  description: "DJ marketplace",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const phone = "19292161855";

  const defaultMessage = encodeURIComponent(
    "Hi SpinBook HQ, I need help with a booking."
  );

  const whatsappHref = `https://wa.me/${phone}?text=${defaultMessage}`;

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />

        <main className="mx-auto w-full max-w-6xl px-6 py-8 flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-white/55">
            © 2026 SpinBook HQ | Washington, D.C, U.S.A. <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            All Rights Reserved.
          </div>
        </footer>

        {/* WhatsApp Support Floating Button */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with SpinBook HQ on WhatsApp"
          className={[
            "fixed bottom-6 right-6 z-[60]",
            "inline-flex items-center gap-3 rounded-full",
            "bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white",
            "shadow-lg shadow-emerald-500/20 ring-1 ring-white/10",
            "transition hover:brightness-110 hover:shadow-emerald-500/30",
            "focus:outline-none focus:ring-2 focus:ring-emerald-300/40",
          ].join(" ")}
        >
          {/* WhatsApp icon */}
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M19.11 17.2c-.25-.12-1.47-.73-1.7-.82-.23-.09-.4-.12-.56.12-.16.25-.64.82-.79.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.37 1 2.54c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z" />
              <path d="M26.67 15.99c0 5.88-4.78 10.67-10.67 10.67-1.87 0-3.69-.5-5.3-1.45l-3.7.97.99-3.61a10.6 10.6 0 01-1.69-5.58C6.3 10.11 11.1 5.33 16 5.33c5.88 0 10.67 4.78 10.67 10.66zm-10.67-8.54c-4.71 0-8.54 3.83-8.54 8.54 0 1.9.63 3.74 1.78 5.22l.14.18-.58 2.12 2.18-.57.17.1c1.43.86 3.07 1.31 4.86 1.31 4.71 0 8.54-3.83 8.54-8.54S20.71 7.45 16 7.45z" />
            </svg>
          </span>

          <span className="whitespace-nowrap">Chat With Us! 24/7</span>
        </a>
      </body>
    </html>
  );
}
