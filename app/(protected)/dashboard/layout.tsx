// web/app/(protected)/dashboard/layout.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      {/* ✅ Clean dashboard sub-nav (no duplicated H1, no jammed text) */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur">
        <Link
          href="/dashboard"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white"
        >
          Overview
        </Link>

        <Link
          href="/dashboard/profile"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white"
        >
          Profile
        </Link>

        <Link
          href="/dashboard/requests"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white"
        >
          Requests
        </Link>
      </div>

      {children}
    </section>
  );
}
