// FILE: src/components/Header.tsx
// Server Component – global header (NO hooks allowed)

import Link from "next/link";
import Image from "next/image";
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

const navBase =
  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition";

function NavLink({
  href,
  children,
  isActive,
  className,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        navBase,
        isActive
          ? "bg-white/15 text-white ring-1 ring-white/15"
          : "text-white/75 hover:bg-white/10 hover:text-white",
        className || "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

/**
 * IMPORTANT:
 * For same-page hash navigation (/#section), Next Link can sometimes NOT scroll
 * depending on routing state. A plain <a> always works.
 */
function HashNavLink({
  href,
  children,
  isActive,
  className,
}: {
  href: string; // e.g. "/#how-it-works"
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        navBase,
        isActive
          ? "bg-white/15 text-white ring-1 ring-white/15"
          : "text-white/75 hover:bg-white/10 hover:text-white",
        className || "",
      ].join(" ")}
    >
      {children}
    </a>
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

  const normalize = (s: string) => (s || "").replace(/\/+$/, "") || "/";
  const current = normalize(pathname || "/");

  const isActive = (href: string) => {
    // hash links are "active" only when we are on "/"
    if (href.startsWith("/#")) return current === "/";
    return current === normalize(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-2">
        {/* Brand row */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {/* Logo */}
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="SpinBook HQ logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-extrabold text-white">
                  SpinBook HQ
                </span>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/70">
                  HQ
                </span>
              </div>
              <p className="truncate text-[11px] text-white/55">
                Book DJs. Collect deposits. Stay organized.
              </p>
            </div>
          </Link>

          {/* Desktop auth/CTA */}
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

        {/* Desktop nav */}
        <nav className="mt-2 hidden md:flex items-center justify-center gap-2">
          {!isAuthed ? (
            <>
              <HashNavLink
                href="/#how-it-works"
                isActive={isActive("/#how-it-works")}
              >
                How It Works
              </HashNavLink>
              <NavLink href="/djs" isActive={isActive("/djs")}>
                Find DJs
              </NavLink>
              <NavLink href="/contact" isActive={isActive("/contact")}>
                Contact
              </NavLink>
              <NavLink href="/dj-waitlist" isActive={isActive("/dj-waitlist")}>
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

        {/* ✅ Mobile nav: ONE clean row, no extra text-links row */}
        <div className="mt-3 md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] pb-1">
            <HashNavLink href="/#how-it-works" isActive={isActive("/#how-it-works")}>
              How It Works
            </HashNavLink>

            <NavLink href="/djs" isActive={isActive("/djs")}>
              Find DJs
            </NavLink>

            <NavLink href="/contact" isActive={isActive("/contact")}>
              Contact
            </NavLink>

            {!isAuthed ? (
              <>
                <NavLink href="/dj-waitlist" isActive={isActive("/dj-waitlist")}>
                  For DJs
                </NavLink>

                <NavLink
                  href="/login"
                  isActive={isActive("/login")}
                  className="border border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]"
                >
                  Log In
                </NavLink>

                <Link
                  href="/djs"
                  className="shrink-0 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-fuchsia-400"
                >
                  Book a DJ
                </Link>
              </>
            ) : (
              <>
                <NavLink href="/dashboard" isActive={isActive("/dashboard")}>
                  Dashboard
                </NavLink>

                <NavLink
                  href="/dashboard/profile"
                  isActive={isActive("/dashboard/profile")}
                >
                  Profile
                </NavLink>

                <Link
                  href="/djs"
                  className="shrink-0 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-fuchsia-400"
                >
                  Book a DJ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
