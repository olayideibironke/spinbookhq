"use client";

import { useFormStatus } from "react-dom";

export default function SaveProfileButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/10"
    >
      {pending ? "Saving profile..." : "Save profile"}
    </button>
  );
}