// app/login/page.tsx
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

type Mode = "signin" | "signup";

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

export default async function LoginPage(props: {
  searchParams?: Promise<{ mode?: string; msg?: string }>;
}) {
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const mode: Mode =
    resolvedSearchParams?.mode === "signup" ? "signup" : "signin";

  const msg = resolvedSearchParams?.msg
    ? decodeURIComponent(resolvedSearchParams.msg)
    : null;

  async function authAction(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const supabase = buildSupabase(cookieStore);

    const actionMode = (formData.get("mode") as Mode) ?? "signin";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect(
        `/login?mode=${actionMode}&msg=${encodeURIComponent(
          "Email and password are required."
        )}`
      );
    }

    // ✅ Use the current request origin, fallback to prod domain
    const origin =
      (await headers()).get("origin")?.trim() || "https://spinbookhq.com";

    if (actionMode === "signup") {
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
        redirect(`/login?mode=signup&msg=${encodeURIComponent(error.message)}`);
      }

      redirect(
        `/login?mode=signin&msg=${encodeURIComponent(
          "Signup successful. Check your email to confirm. After confirming, you’ll be sent to your profile setup."
        )}`
      );
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/login?mode=signin&msg=${encodeURIComponent(error.message)}`);
    }

    // ✅ After login, take DJs to onboarding/profile first
    redirect("/dashboard/profile");
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

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
              <p className="mt-2 text-sm text-white/65">
                {mode === "signin"
                  ? "Sign in to continue"
                  : "Create your DJ account"}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {mode === "signin" ? "SIGN IN" : "SIGN UP"}
            </span>
          </div>

          <form action={authAction} className="mt-7 space-y-4" suppressHydrationWarning>
            <input type="hidden" name="mode" value={mode} />

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

            {msg ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                {msg}
              </div>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              type="submit"
            >
              {mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>

          <form
            className="mt-4"
            action={async () => {
              "use server";
              const nextMode: Mode = mode === "signin" ? "signup" : "signin";
              redirect(`/login?mode=${nextMode}`);
            }}
          >
            <button
              className="mt-2 w-full text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white/90"
              type="submit"
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-white/45">
            By continuing, you agree to a professional booking workflow. No spam.
          </p>
        </div>
      </div>
    </main>
  );
}
