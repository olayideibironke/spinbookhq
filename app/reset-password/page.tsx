// FILE: app/reset-password/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type ViewState = "loading" | "ready" | "expired";
type NoticeStatus = "error" | null;

function buildLoginUrl(message: string) {
  const params = new URLSearchParams();
  params.set("dj", "1");
  params.set("mode", "signin");
  params.set("status", "success");
  params.set("msg", message);
  return `/login?${params.toString()}`;
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeStatus, setNoticeStatus] = useState<NoticeStatus>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;

    const markReady = () => {
      if (!active) return;
      if (expiryTimer) clearTimeout(expiryTimer);
      setViewState("ready");
      setNotice(null);
      setNoticeStatus(null);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;

        if (
          (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
          session
        ) {
          markReady();
        }
      }
    );

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setViewState("expired");
        setNotice(
          "We couldn’t verify your reset session. Please request a new password reset link."
        );
        setNoticeStatus("error");
        return;
      }

      if (data.session) {
        markReady();
        return;
      }

      expiryTimer = setTimeout(() => {
        if (!active) return;
        setViewState("expired");
        setNotice(
          "This reset link is no longer active. Please request a new password reset link."
        );
        setNoticeStatus("error");
      }, 1500);
    };

    init();

    return () => {
      active = false;
      if (expiryTimer) clearTimeout(expiryTimer);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (viewState !== "ready" || submitting) return;

    if (!password || !confirmPassword) {
      setNotice("Both password fields are required.");
      setNoticeStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setNotice(
        "Passwords do not match. Please enter the same password in both fields."
      );
      setNoticeStatus("error");
      return;
    }

    setSubmitting(true);
    setNotice(null);
    setNoticeStatus(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setSubmitting(false);
      setNotice(error.message);
      setNoticeStatus("error");
      return;
    }

    await supabase.auth.signOut();

    router.replace(
      buildLoginUrl(
        "Your password has been updated. Sign in with your new password."
      )
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  const infoCardClass =
    "mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-50";

  return (
    <main className="relative min-h-screen px-6 py-14 text-white sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden bg-black"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
        <div className="absolute -top-24 left-1/2 h-64 w-[44rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 left-10 h-48 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
                SPINBOOK HQ
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Create a new password for your account.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              RECOVERY
            </span>
          </div>

          {viewState === "loading" ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Verifying your secure reset link...
            </div>
          ) : null}

          {viewState === "expired" ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Request a new password reset link and open the newest email only.
            </div>
          ) : null}

          {notice && noticeStatus === "error" ? (
            <div className={infoCardClass}>{notice}</div>
          ) : null}

          {viewState === "ready" ? (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/85">
                  New password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  placeholder="********"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/85">
                  Confirm new password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  name="confirmPassword"
                  placeholder="********"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : null}

          <div className="mt-4 space-y-3">
            <Link
              href="/login?dj=1&mode=signin"
              className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
            >
              Return to sign in
            </Link>

            <Link
              href="/login?dj=1&mode=forgot"
              className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
            >
              Request a new reset link
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/45">
            Use a password you can remember and keep secure.
          </p>
        </div>
      </div>
    </main>
  );
}