import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
            S
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white">
                SpinBook HQ
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/70">
                HQ
              </span>
            </div>
            <p className="text-xs text-white/55">
              Book DJs. Collect deposits. Stay organized.
            </p>
          </div>
        </Link>

        {/* Middle: Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/djs"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            Browse DJs
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/requests"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            Requests
          </Link>
          <Link
            href="/dashboard/profile"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            Profile
          </Link>
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          <SignOutButton email={email} />
        </div>
      </div>
    </header>
  );
}
