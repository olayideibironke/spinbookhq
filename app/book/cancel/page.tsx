import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function BookingCancelPage({
  searchParams,
}: {
  searchParams?: Promise<{ rid?: string; dj?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const rid = String(sp.rid ?? "").trim();
  const djFromQuery = String(sp.dj ?? "").trim();

  const supabase = await createClient();

  let djSlug = djFromQuery;

  if (!djSlug && rid) {
    const { data: request } = await supabase
      .from("booking_requests")
      .select("id, dj_user_id")
      .eq("id", rid)
      .maybeSingle<{ id: string; dj_user_id: string }>();

    if (request?.dj_user_id) {
      const { data: djProfile } = await supabase
        .from("dj_profiles")
        .select("slug")
        .eq("user_id", request.dj_user_id)
        .maybeSingle<{ slug: string | null }>();

      djSlug = String(djProfile?.slug ?? "").trim();
    }
  }

  const DEPOSIT_TOTAL = 200;
  const DEPOSIT_SPINBOOK = 80;
  const DEPOSIT_DJ = 120;

  return (
    <main className="relative min-h-[calc(100vh-64px)] px-6 py-10">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 left-10 h-48 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl py-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.22em] text-white/55">
                BOOKING STATUS
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Payment canceled
              </h1>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/65">
                You didn’t complete the deposit payment. No charges were made.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              CANCELED
            </span>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="text-sm font-extrabold text-white">Deposit reminder</p>
            <p className="mt-3 text-sm text-white/65">
              To book a DJ, you must pay a <span className="font-extrabold text-white">{formatUsd(DEPOSIT_TOTAL)}</span>{" "}
              non-refundable deposit (split:{" "}
              <span className="font-extrabold text-white">{formatUsd(DEPOSIT_SPINBOOK)}</span>{" "}
              SpinBook HQ +{" "}
              <span className="font-extrabold text-white">{formatUsd(DEPOSIT_DJ)}</span>{" "}
              DJ).
            </p>
            <p className="mt-3 text-xs text-white/55">
              Policy: If you do <span className="font-extrabold text-white">NOT</span> pay the full remaining balance to
              the DJ <span className="font-extrabold text-white">7 days</span> before the event, the deposit is forfeited
              and the DJ may cancel.
            </p>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="text-sm font-extrabold text-white">Booking reference</p>

            {rid ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                    RID
                  </span>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/85">
                    {rid}
                  </span>
                </div>
                <p className="mt-4 text-sm text-white/65">
                  You can return to the DJ profile and try again when you’re ready.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-white/65">
                No booking reference was provided.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {djSlug ? (
              <Link
                href={`/dj/${djSlug}`}
                className="group inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Back to DJ profile
                <svg
                  className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </Link>
            ) : null}

            <Link
              href="/djs"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-extrabold text-white/85 transition hover:bg-white/5"
            >
              Browse DJs
            </Link>

            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-extrabold text-white/85 transition hover:bg-white/5"
            >
              Go home
            </Link>
          </div>

          <p className="mt-7 text-xs text-white/55">
            Tip: If checkout fails again, refresh the page and retry once.
          </p>
        </section>
      </div>
    </main>
  );
}
