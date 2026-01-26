"use client";

import React from "react";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "block w-full text-left",
        "px-4 py-3 text-sm font-semibold text-white/85",
        "hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function MobileNav({ isAuthed, email }: Props) {
  const [open, setOpen] = React.useState(false);

  function toggle() {
    setOpen((v) => !v);
  }

  function close() {
    setOpen(false);
  }

  return (
    <div className="relative flex items-center gap-2 md:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Open menu"
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
      >
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-xl backdrop-blur">
          {/* Top-aligned list (no container padding) */}
          <div className="flex flex-col">
            {!isAuthed ? (
              <>
                <MenuItem href="/#how-it-works" onClick={close}>
                  How It Works
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/djs" onClick={close}>
                  Find DJs
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/login" onClick={close}>
                  For DJs
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/login" onClick={close}>
                  Log In
                </MenuItem>

                <div className="px-3 py-3">
                  <Link
                    href="/djs"
                    onClick={close}
                    className="flex w-full items-center justify-center rounded-2xl bg-fuchsia-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-fuchsia-400"
                  >
                    Book a DJ
                  </Link>
                </div>
              </>
            ) : (
              <>
                <MenuItem href="/djs" onClick={close}>
                  Browse DJs
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/dashboard" onClick={close}>
                  Dashboard
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/dashboard/requests" onClick={close}>
                  Requests
                </MenuItem>
                <div className="h-px w-full bg-white/10" />

                <MenuItem href="/dashboard/profile" onClick={close}>
                  Profile
                </MenuItem>

                <div className="h-px w-full bg-white/10" />

                <div className="px-3 py-3" onClick={close}>
                  <SignOutButton email={email} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
