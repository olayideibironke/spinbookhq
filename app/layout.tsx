// web/app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

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
  // ✅ Server-side user fetch so Header can render auth-aware UI
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? null;

  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* ✅ PASS email into Header */}
        <Header userEmail={userEmail} />

        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
