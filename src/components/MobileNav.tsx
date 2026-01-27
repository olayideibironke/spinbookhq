"use client";

import React from "react";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

function RowLink({
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
      className="block w-full px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
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

      {open ? (
        <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-xl backdrop-blur">
          <div className="flex flex-col">
            {!isAuthed ? (
              <>
                <RowLink href="/#how-it-works" onClick={close}>
                  How It Works
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/djs" onClick={close}>
                  Find DJs
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/contact" onClick={close}>
                  Contact
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/login" onClick={close}>
                  For DJs
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/login" onClick={close}>
                  Log In
                </RowLink>

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
                <RowLink href="/djs" onClick={close}>
                  Browse DJs
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/dashboard" onClick={close}>
                  Dashboard
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/dashboard/requests" onClick={close}>
                  Requests
                </RowLink>
                <div className="h-px bg-white/10" />

                <RowLink href="/dashboard/profile" onClick={close}>
                  Profile
                </RowLink>

                <div className="h-px bg-white/10" />

                <div className="px-3 py-3" onClick={close}>
                  <SignOutButton email={email} />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
