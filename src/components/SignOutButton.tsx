"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email?: string | null;
};

export default function AuthButton({ email }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();

      // ✅ Force UI to update + move user away immediately
      router.replace("/login");
      router.refresh();
    });
  }

  if (!email) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="rounded-md px-3 py-2 text-sm font-medium hover:opacity-80"
        >
          Log in
        </a>
        <a
          href="/login?mode=signup"
          className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
        >
          Sign up
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm opacity-80 sm:inline">{email}</span>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
