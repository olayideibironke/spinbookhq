// FILE: app/login/page.tsx — SpinBook HQ Premium Revamp

import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type Mode = "signin" | "signup" | "forgot";
type Status = "success" | "error" | null;

/* ─── All server logic unchanged ─── */
function buildSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => { cookieStore.set(name, value, options); }); },
      },
    }
  );
}

function buildDjLoginUrl(mode: Mode, message?: string | null, status?: Status) {
  const params = new URLSearchParams();
  params.set("dj", "1");
  params.set("mode", mode);
  if (message) params.set("msg", message);
  if (status) params.set("status", status);
  return `/login?${params.toString()}`;
}

function normalizeForgotPasswordErrorMessage(message?: string | null) {
  const raw = (message ?? "").trim();
  const lower = raw.toLowerCase();
  if (!raw) return "We couldn't send the reset link right now. Please try again.";
  if (lower.includes("rate limit") || lower.includes("email rate limit exceeded") || lower.includes("too many requests"))
    return "Too many reset requests were sent recently. Please wait a little and try again.";
  return "We couldn't send the reset link right now. Please try again.";
}

async function getAppOrigin() {
  if (process.env.NODE_ENV === "production") return "https://spinbookhq.com";
  try {
    const headerStore = await headers();
    const origin = headerStore.get("origin")?.trim();
    if (origin) return origin;
    const host = headerStore.get("host")?.trim();
    if (host) return `http://${host}`;
  } catch {}
  return "http://localhost:3000";
}

/* ─── Client Coming Soon — premium version ─── */
function ClientComingSoonCard() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Glows */}
      <div className="hero-glows" aria-hidden="true">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
        <div className="hero-grid-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
        <div className="login-card w-full">
          {/* Badge */}
          <div className="login-coming-badge">
            <span className="live-dot" aria-hidden="true" />
            Client bookings · Coming soon
          </div>

          {/* Headline */}
          <h1 className="login-coming-title">
            Client access is<br />
            <span className="login-coming-gradient">launching soon.</span>
          </h1>

          <p className="login-coming-sub">
            SpinBook HQ is currently onboarding a limited number of{" "}
            <strong className="text-white">Founding DJs</strong> ahead of public
            launch. Client booking access will open shortly in select cities.
          </p>

          {/* CTAs */}
          <div className="login-coming-ctas">
            <Link href="/dj-waitlist" className="cta-primary">
              View DJ onboarding status
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/" className="cta-secondary">Back to home</Link>
          </div>

          {/* DJ login hint */}
          <div className="login-dj-hint">
            <div className="login-dj-hint-icon" aria-hidden="true">🎧</div>
            <div>
              <p className="login-dj-hint-title">Are you a selected DJ?</p>
              <p className="login-dj-hint-sub">
                Use the DJ login link:{" "}
                <Link href="/login?dj=1" className="login-dj-hint-link">
                  Continue to DJ login →
                </Link>
              </p>
            </div>
          </div>

          <p className="login-footer-note">
            This is an early-access phase to ensure quality and a trusted marketplace from day one.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─── Main Page ─── */
export default async function LoginPage(props: {
  searchParams?: Promise<{ mode?: string; msg?: string; dj?: string; status?: string }>;
}) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const isDjAccess = String(resolvedSearchParams?.dj ?? "").trim() === "1";

  if (!isDjAccess) return <ClientComingSoonCard />;

  const mode: Mode =
    resolvedSearchParams?.mode === "signup" ? "signup"
    : resolvedSearchParams?.mode === "forgot" ? "forgot"
    : "signin";

  const msg = resolvedSearchParams?.msg ? decodeURIComponent(resolvedSearchParams.msg) : null;
  const status: Status =
    resolvedSearchParams?.status === "success" ? "success"
    : resolvedSearchParams?.status === "error" ? "error"
    : null;

  async function authAction(formData: FormData) {
    "use server";
    const actionMode = (formData.get("mode") as Mode) ?? "signin";
    const dj = String(formData.get("dj") ?? "").trim() === "1";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!dj) redirect("/login");
    if (!email) redirect(buildDjLoginUrl(actionMode, "Email is required.", "error"));
    if (actionMode !== "forgot" && !password) redirect(buildDjLoginUrl(actionMode, "Password is required.", "error"));

    let redirectTo: string | null = null;
    let nextMode: Mode = actionMode;
    let nextStatus: Status = "error";
    let nextMessage = "We hit a temporary issue while processing your request. Please try again.";

    try {
      const cookieStore = await cookies();
      const supabase = buildSupabase(cookieStore);
      const origin = await getAppOrigin();

      if (actionMode === "signup") {
        if (!confirmPassword) { nextMode = "signup"; nextMessage = "Please confirm your password."; }
        else if (password !== confirmPassword) { nextMode = "signup"; nextMessage = "Passwords do not match. Please enter the same password in both fields."; }
        else {
          const { data: emailExists, error: emailExistsError } = await supabase.rpc("auth_email_exists", { check_email: email });
          if (emailExistsError) { nextMode = "signup"; nextMessage = "We could not verify account status right now. Please try again."; }
          else if (emailExists) { nextMode = "signin"; nextMessage = "This email already has an account. Please sign in or reset your password."; }
          else {
            const { data: isApproved, error: inviteError } = await supabase.rpc("is_dj_email_approved", { check_email: email });
            if (inviteError) { nextMode = "signup"; nextMessage = "We could not verify your onboarding access right now. Please try again."; }
            else if (!isApproved) { nextMode = "signup"; nextMessage = "This email is not currently approved for DJ onboarding. Please use the invited email address or contact SpinBook HQ."; }
            else {
              const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/dashboard/profile")}`;
              const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
              if (error) { nextMode = "signup"; nextMessage = error.message; }
              else { nextMode = "signup"; nextStatus = "success"; nextMessage = "Account created. Check your email for your confirmation link. After you confirm your email, return here and sign in to continue to your profile setup."; }
            }
          }
        }
      } else if (actionMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` });
        if (error) { nextMode = "forgot"; nextMessage = normalizeForgotPasswordErrorMessage(error.message); }
        else { nextMode = "forgot"; nextStatus = "success"; nextMessage = "If an account exists for this email, a password reset link has been sent to the inbox."; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { nextMode = "signin"; nextMessage = error.message; }
        else redirectTo = "/dashboard/profile";
      }
    } catch {
      nextMode = actionMode; nextStatus = "error";
      if (actionMode === "signup") nextMessage = "We hit a temporary signup issue. Please try again. If your account already exists, use sign in or reset your password.";
      else if (actionMode === "forgot") nextMessage = "We couldn't send the reset link right now. Please try again shortly.";
      else nextMessage = "We hit a temporary sign-in issue. Please try again.";
    }

    if (redirectTo) redirect(redirectTo);
    redirect(buildDjLoginUrl(nextMode, nextMessage, nextStatus));
  }

  /* ─── UI labels ─── */
  const titleText    = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your DJ account" : "Reset your password";
  const subtitleText = mode === "signin" ? "Sign in to your SpinBook HQ dashboard" : mode === "signup" ? "Invite-only DJ onboarding" : "We'll send a secure reset link to your email";
  const badgeText    = mode === "signin" ? "SIGN IN" : mode === "signup" ? "INVITE ONLY" : "RECOVERY";
  const btnText      = mode === "signin" ? "Sign in" : mode === "signup" ? "Create DJ account" : "Send reset link";

  const msgClass = status === "success"
    ? "login-msg login-msg--success"
    : "login-msg login-msg--error";

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Ambient glows */}
      <div className="hero-glows" aria-hidden="true">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
        <div className="hero-grid-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16">
        <div className="login-card w-full">

          {/* Header */}
          <div className="login-card-header">
            <div>
              <p className="section-eyebrow" style={{ marginBottom: "10px" }}>SpinBook HQ</p>
              <h1 className="login-title">{titleText}</h1>
              <p className="login-subtitle">{subtitleText}</p>
            </div>
            <span className="login-mode-badge">
              <span className="live-dot" style={{ background: mode === "signin" ? "#22c55e" : mode === "signup" ? "#e879f9" : "#f59e0b" }} aria-hidden="true" />
              {badgeText}
            </span>
          </div>

          {/* Info banners */}
          {mode === "signup" && (
            <div className="login-info-banner">
              🔒 DJ onboarding is currently invite-only. Only pre-approved DJ email addresses can create an account during this phase.
            </div>
          )}
          {mode === "forgot" && (
            <div className="login-info-banner">
              📨 Enter the email address on your account and we'll send you a secure password reset link.
            </div>
          )}
          {msg && <div className={msgClass}>{msg}</div>}
          {mode === "signup" && status === "success" && (
            <div className="login-steps-card">
              <p className="login-steps-title">Next steps</p>
              <ol className="login-steps-list">
                <li>Open the confirmation email sent to your invited email address.</li>
                <li>Click the confirmation link in that email.</li>
                <li>Return to this page and sign in with the same email and password.</li>
                <li>You will continue to your DJ profile setup.</li>
              </ol>
            </div>
          )}

          {/* Form */}
          <form action={authAction} className="login-form">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="dj" value="1" />

            <div className="login-field">
              <label className="login-label">Email</label>
              <input className="login-input" type="email" name="email" placeholder="you@email.com" required autoComplete="email" />
            </div>

            {mode !== "forgot" && (
              <div className="login-field">
                <label className="login-label">Password</label>
                <input className="login-input" type="password" name="password" placeholder="••••••••" required autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              </div>
            )}

            {mode === "signup" && (
              <div className="login-field">
                <label className="login-label">Confirm password</label>
                <input className="login-input" type="password" name="confirmPassword" placeholder="••••••••" required autoComplete="new-password" />
              </div>
            )}

            <button type="submit" className="login-submit-btn">
              {btnText}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          {/* Secondary links */}
          <div className="login-links">
            {mode === "signin" && (<>
              <Link href="/login?dj=1&mode=forgot" className="login-link">Forgot your password?</Link>
              <Link href="/login?dj=1&mode=signup" className="login-link">Have an onboarding invite? Create your account</Link>
            </>)}
            {mode === "signup" && (<>
              <Link href="/login?dj=1&mode=signin" className="login-link">Already have an account? Sign in</Link>
              <Link href="/login?dj=1&mode=forgot" className="login-link">Forgot your password?</Link>
            </>)}
            {mode === "forgot" && (<>
              <Link href="/login?dj=1&mode=signin" className="login-link">Return to sign in</Link>
              <Link href="/login?dj=1&mode=signup" className="login-link">Have an onboarding invite? Create your account</Link>
            </>)}
          </div>

          <p className="login-footer-note">By continuing, you agree to a professional booking workflow. No spam.</p>
        </div>
      </div>
    </main>
  );
}
