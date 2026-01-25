// FILE: src/components/MobileNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  isAuthed: boolean;
  email: string | null;
};

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
        <div
          className={[
            // ✅ align dropdown directly under header row (no "drop")
            "absolute right-0 top-full mt-2",
            "w-72 overflow-hidden rounded-2xl",
            "border border-white/10 bg-black/80 shadow-xl backdrop-blur",
            // ✅ tighter padding so first item starts near the top
            "p-1",
          ].join(" ")}
        >
          <div className="flex flex-col">
            {!isAuthed ? (
              <>
                <Link
                  href="/#how-it-works"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  How It Works
                </Link>
                <Link
                  href="/djs"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Find DJs
                </Link>
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  For DJs
                </Link>

                <div className="my-1 border-t border-white/10" />

                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Log In
                </Link>

                <Link
                  href="/djs"
                  onClick={close}
                  className="mx-1 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-fuchsia-400"
                >
                  Book a DJ
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/djs"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Browse DJs
                </Link>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/requests"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Requests
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={close}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Profile
                </Link>

                <div className="my-1 border-t border-white/10" />

                <div className="px-1 pb-1" onClick={close}>
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
