// FILE: src/components/Header.tsx
// Server Component – global header (NO hooks allowed)

import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

async function getRequestPathname(): Promise<string | null> {
  const h = await headers();
  const nextUrl = h.get("x-next-url") || h.get("next-url");
  if (nextUrl) return nextUrl;
  return null;
}

function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-white/15 text-white ring-1 ring-white/15"
          : "text-white/75 hover:bg-white/10 hover:text-white",
      ].join(" ")}
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

  const isAuthed = !!user;
  const email = user?.email ?? null;

  const pathname = await getRequestPathname();
  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        {/* Brand row */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">
                  SpinBook HQ
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/70">
                  HQ
                </span>
              </div>
              <p className="text-xs text-white/55">
                Book DJs. Collect deposits. Stay organized.
              </p>
            </div>
          </Link>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthed ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                >
                  Log In
                </Link>
                <Link
                  href="/djs"
                  className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-fuchsia-400"
                >
                  Book a DJ
                </Link>
              </>
            ) : (
              <SignOutButton email={email} />
            )}
          </div>
        </div>

        {/* Mobile primary nav (always visible) */}
        <div className="mt-3 md:hidden">
          <div className="flex items-center gap-2">
            <NavLink href="/#how-it-works" isActive={false}>
              How It Works
            </NavLink>
            <NavLink href="/djs" isActive={isActive("/djs")}>
              Find DJs
            </NavLink>
            <NavLink href="/contact" isActive={isActive("/contact")}>
              Contact
            </NavLink>

            <Link
              href="/djs"
              className="ml-auto rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white"
            >
              Book a DJ
            </Link>
          </div>

          {/* Secondary actions */}
          <div className="mt-2 flex gap-2">
            {!isAuthed ? (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-white/70 underline-offset-4 hover:underline"
                >
                  For DJs
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-white/70 underline-offset-4 hover:underline"
                >
                  Log In
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-white/70 underline-offset-4 hover:underline"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="text-xs font-semibold text-white/70 underline-offset-4 hover:underline"
                >
                  Profile
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
