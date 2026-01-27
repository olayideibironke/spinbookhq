// FILE: src/components/Header.tsx
// Server Component – global header (NO hooks allowed)

import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import MobileNav from "@/components/MobileNav";

export const dynamic = "force-dynamic";

async function getRequestPathname(): Promise<string | null> {
  const h = await headers();

  const candidates = [
    h.get("x-original-url"),
    h.get("x-rewrite-url"),
    h.get("x-next-url"),
    h.get("next-url"),
    h.get("x-invoke-path"),
    h.get("x-vercel-path"),
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return new URL(raw).pathname;
      }
      if (raw.startsWith("/")) return raw;
    } catch {
      // ignore
    }
  }

  const ref = h.get("referer");
  if (ref) {
    try {
      return new URL(ref).pathname;
    } catch {
      // ignore
    }
  }

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
          ? "bg-white/15 text-white ring-1 ring-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
          : "text-white/75 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function MobileTopLink({
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
        "shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold transition",
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

  const email = user?.email ?? null;
  const isAuthed = !!user;

  const pathname = await getRequestPathname();

  const isActive = (href: string) => {
    if (!pathname) return false;

    const p = pathname.replace(/\/+$/, "") || "/";
    const h = href.replace(/\/+$/, "") || "/";

    if (p === h) return true;

    // Section link on home should only be active on "/"
    if (href.startsWith("/#")) return p === "/";

    // Dashboard section grouping
    if (h.startsWith("/dashboard")) return p.startsWith("/dashboard");

    return false;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        {/* Row 1: Brand + Desktop Nav + Desktop CTA + (Hamburger hidden on mobile) */}
        <div className="flex items-center justify-between gap-4">
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
                <NavLink
                  href="/#how-it-works"
                  isActive={isActive("/#how-it-works")}
                >
                  How It Works
                </NavLink>
                <NavLink href="/djs" isActive={isActive("/djs")}>
                  Find DJs
                </NavLink>
                <NavLink href="/contact" isActive={isActive("/contact")}>
                  Contact
                </NavLink>
                <NavLink href="/login" isActive={isActive("/login")}>
                  For DJs
                </NavLink>
              </>
            ) : (
              <>
                <NavLink href="/djs" isActive={isActive("/djs")}>
                  Browse DJs
                </NavLink>
                <NavLink href="/dashboard" isActive={isActive("/dashboard")}>
                  Dashboard
                </NavLink>
                <NavLink
                  href="/dashboard/requests"
                  isActive={isActive("/dashboard/requests")}
                >
                  Requests
                </NavLink>
                <NavLink
                  href="/dashboard/profile"
                  isActive={isActive("/dashboard/profile")}
                >
                  Profile
                </NavLink>
                <NavLink href="/contact" isActive={isActive("/contact")}>
                  Contact
                </NavLink>
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

          {/* Mobile hamburger: hidden because we want always-visible top nav */}
          <div className="md:hidden hidden">
            <MobileNav isAuthed={isAuthed} email={email} />
          </div>
        </div>

        {/* Row 2: Always-visible Mobile Top Nav (no clicking) */}
        <div className="mt-3 md:hidden">
          <div
            className={[
              "flex items-center gap-2 overflow-x-auto",
              "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]",
              "[&::-webkit-scrollbar]:hidden",
              "rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2",
            ].join(" ")}
          >
            {!isAuthed ? (
              <>
                <MobileTopLink
                  href="/#how-it-works"
                  isActive={isActive("/#how-it-works")}
                >
                  How It Works
                </MobileTopLink>
                <MobileTopLink href="/djs" isActive={isActive("/djs")}>
                  Find DJs
                </MobileTopLink>
                <MobileTopLink href="/contact" isActive={isActive("/contact")}>
                  Contact
                </MobileTopLink>
                <MobileTopLink href="/login" isActive={isActive("/login")}>
                  For DJs
                </MobileTopLink>
                <MobileTopLink href="/login" isActive={isActive("/login")}>
                  Log In
                </MobileTopLink>
                <Link
                  href="/djs"
                  className={[
                    "ml-1 shrink-0 rounded-full px-4 py-2 text-[13px] font-extrabold text-white",
                    "bg-fuchsia-500 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-fuchsia-400",
                  ].join(" ")}
                >
                  Book a DJ
                </Link>
              </>
            ) : (
              <>
                <MobileTopLink href="/djs" isActive={isActive("/djs")}>
                  Browse DJs
                </MobileTopLink>
                <MobileTopLink
                  href="/dashboard"
                  isActive={isActive("/dashboard")}
                >
                  Dashboard
                </MobileTopLink>
                <MobileTopLink
                  href="/dashboard/requests"
                  isActive={isActive("/dashboard/requests")}
                >
                  Requests
                </MobileTopLink>
                <MobileTopLink
                  href="/dashboard/profile"
                  isActive={isActive("/dashboard/profile")}
                >
                  Profile
                </MobileTopLink>
                <MobileTopLink href="/contact" isActive={isActive("/contact")}>
                  Contact
                </MobileTopLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
