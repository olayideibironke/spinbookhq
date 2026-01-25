"use client";

import { usePathname } from "next/navigation";

export default function HeaderGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide the global header on dashboard routes
  if (pathname?.startsWith("/dashboard")) return null;

  return <>{children}</>;
}
