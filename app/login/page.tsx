// FILE: app/login/page.tsx

import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type Mode = "signin" | "signup" | "forgot";
type Status = "success" | "error" | null;

function buildSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

function buildDjLoginUrl(
  mode: Mode,
  message?: string | null,
  status?: Status
) {
  const params = new URLSearchParams();
  params.set("dj", "1");
  params.set("mode", mode);

  if (message) {
    params.set("msg", message);
  }

  if (status) {
    params.set("status", status);
  }

  return `/login?${params.toString()}`;
}

function normalizeForgotPasswordErrorMessage(message?: string | null) {
  const raw = (message ?? "").trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return "We couldn’t send the reset link right now. Please try again.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("email rate limit exceeded") ||
    lower.includes("too many requests")
  ) {
    return "Too many reset requests were sent recently. Please wait a little and try again.";
  }

  return "We couldn’t send the reset link right now. Please try again.";
}

async function getAppOrigin() {
  if (process.env.NODE_ENV === "production") {
    return "https://spinbookhq.com";
  }

  try {
    const headerStore = await headers();
    const origin = headerStore.get("origin")?.trim();
    if (origin) return origin;

    const host = headerStore.get("host")?.trim();
    if (host) return `http://${host}`;
  } catch {}

  return "http://localhost:3000";
}

function ClientComingSoonCard() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-black to-fuchsia-950/50" />
          <div className="absolute -top-48 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -top-40 right-[-12rem] h-96 w-[40rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-9">
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
              Client bookings • Coming soon
            </p>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Client access is launching soon
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/75">
              SpinBook HQ is currently onboarding a limited number of{" "}
              <span className="font-semibold text-white">Founding DJs</span>{" "}
              ahead of public launch. Client booking access will open shortly in
              select cities.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/dj-waitlist"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                View DJ onboarding status
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Back to home
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              <p className="font-semibold text-white/85">Are you a selected DJ?</p>
              <p className="mt-1">
                Use the DJ login link:
                <span className="ml-2 inline-flex">
                  <Link
                    href="/login?dj=1"
                    className="underline underline-offset-4 text-white/85 hover:text-white"
                  >
                    Continue to DJ login
                  </Link>
                </span>
              </p>
            </div>

            <p className="mt-6 text-xs text-white/50">
              This is an early-access phase to ensure quality and a trusted marketplace from day one.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function LoginPage(props: {
  searchParams?: Promise<{
    mode?: string;
    msg?: string;
    dj?: string;
    status?: string;
  }>;
}) {
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const isDjAccess = String(resolvedSearchParams?.dj ?? "").trim() === "1";

  if (!isDjAccess) {
    return <ClientComingSoonCard />;
  }

  const mode: Mode =
    resolvedSearchParams?.mode === "signup"
      ? "signup"
      : resolvedSearchParams?.mode === "forgot"
      ? "forgot"
      : "signin";

  const msg = resolvedSearchParams?.msg
    ? decodeURIComponent(resolvedSearchParams.msg)
    : null;

  const status: Status =
    resolvedSearchParams?.status === "success"
      ? "success"
      : resolvedSearchParams?.status === "error"
      ? "error"
      : null;

  async function authAction(formData: FormData) {
    "use server";

    const actionMode = (formData.get("mode") as Mode) ?? "signin";
    const dj = String(formData.get("dj") ?? "").trim() === "1";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!dj) {
      redirect("/login");
    }

    if (!email) {
      redirect(buildDjLoginUrl(actionMode, "Email is required.", "error"));
    }

    if (actionMode !== "forgot" && !password) {
      redirect(buildDjLoginUrl(actionMode, "Password is required.", "error"));
    }

    let redirectTo: string | null = null;
    let nextMode: Mode = actionMode;
    let nextStatus: Status = "error";
    let nextMessage =
      "We hit a temporary issue while processing your request. Please try again.";

    try {
      const cookieStore = await cookies();
      const supabase = buildSupabase(cookieStore);
      const origin = await getAppOrigin();

      if (actionMode === "signup") {
        if (!confirmPassword) {
          nextMode = "signup";
          nextMessage = "Please confirm your password.";
        } else if (password !== confirmPassword) {
          nextMode = "signup";
          nextMessage =
            "Passwords do not match. Please enter the same password in both fields.";
        } else {
          const { data: emailExists, error: emailExistsError } =
            await supabase.rpc("auth_email_exists", {
              check_email: email,
            });

          if (emailExistsError) {
            nextMode = "signup";
            nextMessage =
              "We could not verify account status right now. Please try again.";
          } else if (emailExists) {
            nextMode = "signin";
            nextMessage =
              "This email already has an account. Please sign in or reset your password.";
          } else {
            const { data: isApproved, error: inviteError } = await supabase.rpc(
              "is_dj_email_approved",
              {
                check_email: email,
              }
            );

            if (inviteError) {
              nextMode = "signup";
              nextMessage =
                "We could not verify your onboarding access right now. Please try again.";
            } else if (!isApproved) {
              nextMode = "signup";
              nextMessage =
                "This email is not currently approved for DJ onboarding. Please use the invited email address or contact SpinBook HQ.";
            } else {
              const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
                "/dashboard/profile"
              )}`;

              const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo,
                },
              });

              if (error) {
                nextMode = "signup";
                nextMessage = error.message;
              } else {
                nextMode = "signup";
                nextStatus = "success";
                nextMessage =
                  "Account created. Check your email for your confirmation link. After you confirm your email, return here and sign in to continue to your profile setup.";
              }
            }
          }
        }
      } else if (actionMode === "forgot") {
        const passwordResetRedirectTo = `${origin}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: passwordResetRedirectTo,
        });

        if (error) {
          nextMode = "forgot";
          nextMessage = normalizeForgotPasswordErrorMessage(error.message);
        } else {
          nextMode = "forgot";
          nextStatus = "success";
          nextMessage =
            "If an account exists for this email, a password reset link has been sent to the inbox.";
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          nextMode = "signin";
          nextMessage = error.message;
        } else {
          redirectTo = "/dashboard/profile";
        }
      }
    } catch {
      nextMode = actionMode;
      nextStatus = "error";

      if (actionMode === "signup") {
        nextMessage =
          "We hit a temporary signup issue. Please try again. If your account already exists, use sign in or reset your password.";
      } else if (actionMode === "forgot") {
        nextMessage =
          "We couldn’t send the reset link right now. Please try again shortly.";
      } else {
        nextMessage =
          "We hit a temporary sign-in issue. Please try again.";
      }
    }

    if (redirectTo) {
      redirect(redirectTo);
    }

    redirect(buildDjLoginUrl(nextMode, nextMessage, nextStatus));
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  const infoCardClass =
    status === "success"
      ? "mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-50"
      : "mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-50";

  const titleText =
    mode === "signin"
      ? "Sign in to continue"
      : mode === "signup"
      ? "Create your DJ account"
      : "Reset your password";

  const badgeText =
    mode === "signin"
      ? "SIGN IN"
      : mode === "signup"
      ? "INVITE ONLY"
      : "RECOVERY";

  const primaryButtonText =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
      ? "Create DJ account"
      : "Send reset link";

  return (
    <main className="relative px-6 py-14 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 h-64 w-[44rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 left-10 h-48 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
                SPINBOOK HQ
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                SpinBook HQ
              </h1>
              <p className="mt-2 text-sm text-white/65">{titleText}</p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {badgeText}
            </span>
          </div>

          {mode === "signup" ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              DJ onboarding is currently invite-only. Only pre-approved DJ email
              addresses can create an account during this phase.
            </div>
          ) : null}

          {mode === "forgot" ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Enter the email address on your account and we’ll send you a secure password reset link.
            </div>
          ) : null}

          {msg ? <div className={infoCardClass}>{msg}</div> : null}

          {mode === "signup" && status === "success" ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Next steps</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
                <li>Open the confirmation email sent to your invited email address.</li>
                <li>Click the confirmation link in that email.</li>
                <li>Return to this page and sign in with the same email and password.</li>
                <li>You will continue to your DJ profile setup.</li>
              </ol>
            </div>
          ) : null}

          <form action={authAction} className="mt-7 space-y-4">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="dj" value="1" />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/85">
                Email
              </label>
              <input
                className={inputClass}
                type="email"
                name="email"
                placeholder="you@email.com"
                required
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/85">
                  Password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  placeholder="********"
                  required
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
              </div>
            ) : null}

            {mode === "signup" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/85">
                  Confirm password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  name="confirmPassword"
                  placeholder="********"
                  required
                  autoComplete="new-password"
                />
              </div>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              type="submit"
            >
              {primaryButtonText}
            </button>
          </form>

          {mode === "signin" ? (
            <div className="mt-4 space-y-3">
              <Link
                href="/login?dj=1&mode=forgot"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Forgot your password?
              </Link>

              <Link
                href="/login?dj=1&mode=signup"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Have an onboarding invite? Create your account
              </Link>
            </div>
          ) : null}

          {mode === "signup" ? (
            <div className="mt-4 space-y-3">
              <Link
                href="/login?dj=1&mode=signin"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Already have an account? Sign in
              </Link>

              <Link
                href="/login?dj=1&mode=forgot"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Already have an account but forgot your password?
              </Link>
            </div>
          ) : null}

          {mode === "forgot" ? (
            <div className="mt-4 space-y-3">
              <Link
                href="/login?dj=1&mode=signin"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Return to sign in
              </Link>

              <Link
                href="/login?dj=1&mode=signup"
                className="block w-full text-center text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              >
                Have an onboarding invite? Create your account
              </Link>
            </div>
          ) : null}

          <p className="mt-6 text-xs text-white/45">
            By continuing, you agree to a professional booking workflow. No spam.
          </p>
        </div>
      </div>
    </main>
  );
}