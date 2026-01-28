import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BookingRequest = {
  id: string;
  dj_user_id: string;
  requester_name: string;
  requester_email: string;
  event_date: string;
  event_location: string;
  status: string;

  quoted_total?: number | null;
  platform_fee_total?: number | null;
  platform_fee_paid?: number | null;

  deposit_paid?: boolean | null;
  deposit_paid_at?: string | null;
};

function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function calcFeeDue(platformFeeTotal: number, platformFeePaid: number) {
  const due = platformFeeTotal - platformFeePaid;
  return due > 0 ? due : 0;
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ rid?: string; dj?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const rid = String(sp.rid ?? "").trim();
  const djFromQuery = String(sp.dj ?? "").trim();

  const supabase = await createClient();

  const { data: request } = rid
    ? await supabase
        .from("booking_requests")
        .select(
          "id, dj_user_id, requester_name, requester_email, event_date, event_location, status, quoted_total, platform_fee_total, platform_fee_paid, deposit_paid, deposit_paid_at"
        )
        .eq("id", rid)
        .maybeSingle<BookingRequest>()
    : { data: null as any };

  let djSlug = djFromQuery;

  if (!djSlug && request?.dj_user_id) {
    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("slug")
      .eq("user_id", request.dj_user_id)
      .maybeSingle<{ slug: string | null }>();

    djSlug = String(djProfile?.slug ?? "").trim();
  }

  const DEPOSIT_TOTAL = 200;
  const DEPOSIT_SPINBOOK = 80;
  const DEPOSIT_DJ = 120;

  const quoted = request?.quoted_total ?? null;
  const platformFeeTotal = request?.platform_fee_total ?? null;
  const platformFeePaid = request?.platform_fee_paid ?? null;

  const feeDue =
    platformFeeTotal != null && platformFeePaid != null
      ? calcFeeDue(platformFeeTotal, platformFeePaid)
      : null;

  return (
    <main
      className={[
        "relative",
        // ✅ Mobile-safe viewport sizing (iOS Safari)
        "min-h-[calc(100svh-64px)]",
        "px-4 py-8 sm:px-6 sm:py-10",
        // ✅ Safe-area bottom padding
        "pb-[calc(6rem+env(safe-area-inset-bottom))]",
      ].join(" ")}
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-[44rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-44 left-10 h-48 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-12 right-10 h-56 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl py-6 sm:py-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.22em] text-white/55">
                BOOKING CONFIRMED
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Deposit received
              </h1>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/65">
                Your deposit payment was successful. The DJ has been notified and will follow up.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              SUCCESS
            </span>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="text-sm font-extrabold text-white">Deposit policy</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                  DEPOSIT
                </p>
                <p className="mt-2 text-sm font-extrabold text-white">
                  {formatUsd(DEPOSIT_TOTAL)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                  SPINBOOK HQ
                </p>
                <p className="mt-2 text-sm font-extrabold text-white">
                  {formatUsd(DEPOSIT_SPINBOOK)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                  DJ
                </p>
                <p className="mt-2 text-sm font-extrabold text-white">
                  {formatUsd(DEPOSIT_DJ)}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-white/55">
              Deposit is <span className="font-extrabold text-white">non-refundable</span>. If you do{" "}
              <span className="font-extrabold text-white">NOT</span> pay the full remaining balance to the DJ{" "}
              <span className="font-extrabold text-white">7 days before the event</span>, your deposit is forfeited and
              the DJ may cancel.
            </p>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-white">Booking reference</p>
              {rid ? (
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/85">
                  {rid}
                </span>
              ) : null}
            </div>

            {request ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["NAME", request.requester_name],
                  ["EMAIL", request.requester_email],
                  ["EVENT DATE", request.event_date],
                  ["LOCATION", request.event_location],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                      {label}
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}

                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                    STATUS
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-white">
                    {String(request.status).toUpperCase()}
                  </p>
                </div>

                {quoted != null ? (
                  <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                      AGREED TOTAL PRICE
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-extrabold text-white">
                        {formatUsd(Number(quoted))}
                      </span>
                      <span className="ml-2 text-xs text-white/55">
                        (set by the DJ)
                      </span>
                    </p>

                    {platformFeeTotal != null ? (
                      <div className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="font-extrabold text-white/80">
                            Platform fee (10%)
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {formatUsd(Number(platformFeeTotal))}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="font-extrabold text-white/80">
                            Collected now
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {formatUsd(DEPOSIT_SPINBOOK)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="font-extrabold text-white/80">
                            Remaining fee due
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {feeDue != null
                              ? formatUsd(Number(feeDue))
                              : formatUsd(0)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-white/55">
                        Platform fee summary will appear once the DJ has declared the agreed total price.
                      </p>
                    )}
                  </div>
                ) : null}

                {request.deposit_paid_at ? (
                  <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                      DEPOSIT PAID AT
                    </p>
                    <p className="mt-2 text-sm font-mono text-white/85">
                      {new Date(request.deposit_paid_at).toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/65">
                Booking details couldn’t be loaded. Your payment still succeeded.
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
            Keep your booking reference for any follow-up.
          </p>
        </section>
      </div>
    </main>
  );
}
