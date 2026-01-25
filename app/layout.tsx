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
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
