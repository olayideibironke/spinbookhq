// web/app/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Minimal auth gate only.
  // Route-specific layouts (e.g., /dashboard) handle their own UI chrome.
  return <>{children}</>;
}
