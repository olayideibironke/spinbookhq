// FILE: src/components/Header.tsx
// Server Component – global header (NO hooks allowed)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import MobileNav from "@/components/MobileNav";

export const dynamic = "force-dynamic";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;
  const isAuthed = !!user;

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

              {isAuthed ? (
                <span className="ml-1 hidden rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-fuchsia-200 md:inline-flex">
                  DJ Mode
                </span>
              ) : null}
            </div>

            <p className="text-xs text-white/55">
              Book DJs. Collect deposits. Stay organized.
            </p>
          </div>
        </Link>

        {/* Middle: Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {!isAuthed ? (
            <>
              <NavLink href="/#how-it-works">How It Works</NavLink>
              <NavLink href="/djs">Find DJs</NavLink>
              <NavLink href="/contact">Contact</NavLink>
              <NavLink href="/login">For DJs</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/djs">Browse DJs</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/dashboard/requests">Requests</NavLink>
              <NavLink href="/dashboard/profile">Profile</NavLink>
            </>
          )}
        </nav>

        {/* Right: Desktop Auth / CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                Log In
              </Link>

              <Link
                href="/djs"
                className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-fuchsia-400"
              >
                Book a DJ
              </Link>
            </>
          ) : (
            <SignOutButton email={email} />
          )}
        </div>

        {/* Mobile: Menu */}
        <MobileNav isAuthed={isAuthed} email={email} />
      </div>
    </header>
  );
}
