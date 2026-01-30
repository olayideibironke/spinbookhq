// FILE: web/app/r/[public_token]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BookingRequest = {
  id: string;
  created_at: string;
  dj_user_id: string;
  requester_name: string | null;
  requester_email: string | null;
  event_date: string | null;
  event_location: string | null;
  message: string | null;
  status: string | null;
  checkout_url: string | null;
  deposit_paid: boolean | null;
  quoted_total: number | null;
  public_token: string | null;
};

function formatDate(value: string | null) {
  if (!value) return null;
  // event_date is a DATE in Postgres, so it should already be YYYY-MM-DD
  return value;
}

function formatUsd(amount: number | null) {
  if (amount == null) return null;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function normalizeStatus(status: string | null) {
  const s = String(status ?? "").toLowerCase().trim();
  if (!s) return "new";
  if (s === "accepted") return "accepted";
  if (s === "declined") return "declined";
  if (s === "new" || s === "pending") return "new";
  return s;
}

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ public_token: string }>;
}) {
  const { public_token } = await params;
  const token = decodeURIComponent(String(public_token ?? "").trim());

  if (!token || token.length < 10) notFound();

  const supabase = await createClient();

  const { data: req, error } = await supabase
    .from("booking_requests")
    .select(
      "id, created_at, dj_user_id, requester_name, requester_email, event_date, event_location, message, status, checkout_url, deposit_paid, quoted_total, public_token"
    )
    .eq("public_token", token)
    .maybeSingle<BookingRequest>();

  if (error || !req) notFound();

  const status = normalizeStatus(req.status);
  const eventDate = formatDate(req.event_date);
  const quoted = formatUsd(req.quoted_total);
  const depositPaid = Boolean(req.deposit_paid);
  const hasCheckout = Boolean(req.checkout_url);

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
            href="/djs"
          >
            ← Back to DJs
          </Link>

          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
            Request tracker
          </span>
        </div>

        <div className="mt-7">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Booking Request
          </h1>
          <p className="mt-2 text-sm text-white/65">
            Use this page to track your request status.
          </p>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-white">Status</p>

              {status === "new" ? (
                <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-base font-extrabold text-white">
                    Pending ⏳
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    The DJ has received your request and will respond soon.
                  </p>
                </div>
              ) : status === "accepted" ? (
                <div className="mt-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <p className="text-base font-extrabold text-emerald-100">
                    Accepted ✅
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Your request was accepted. Follow any next steps below.
                  </p>
                </div>
              ) : status === "declined" ? (
                <div className="mt-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                  <p className="text-base font-extrabold text-red-100">
                    Declined ❌
                  </p>
                  <p className="mt-1 text-sm text-red-100/80">
                    The DJ declined this request. You can request another DJ.
                  </p>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-base font-extrabold text-white">
                    {status.toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    Your request is being processed.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-extrabold text-white">Request ID</p>
              <p className="mt-1 font-mono text-xs text-white/70 break-all">
                {req.id}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                EVENT
              </p>
              <div className="mt-2 space-y-2 text-sm text-white/80">
                <div>
                  <span className="text-white/55">Date:</span>{" "}
                  <span className="font-semibold text-white">
                    {eventDate ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-white/55">Location:</span>{" "}
                  <span className="font-semibold text-white">
                    {req.event_location ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                PAYMENT
              </p>
              <div className="mt-2 space-y-2 text-sm text-white/80">
                <div>
                  <span className="text-white/55">Quoted total:</span>{" "}
                  <span className="font-semibold text-white">
                    {quoted ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-white/55">Deposit status:</span>{" "}
                  <span className="font-semibold text-white">
                    {depositPaid ? "Paid ✅" : "Not paid"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {status === "accepted" && hasCheckout && !depositPaid ? (
            <div className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <p className="text-base font-extrabold text-violet-100">
                Deposit required
              </p>
              <p className="mt-2 text-sm text-violet-100/80">
                To confirm your booking, please pay the deposit using the secure
                link below.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a
                  href={req.checkout_url ?? "#"}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                >
                  Pay deposit →
                </a>

                <Link
                  href="/djs"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
                >
                  Browse DJs
                </Link>
              </div>
            </div>
          ) : null}

          {req.message ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                YOUR MESSAGE
              </p>
              <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
                {req.message}
              </p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
              NEED HELP?
            </p>
            <p className="mt-2 text-sm text-white/70">
              If you have any issues, contact support and include your Request
              ID above.
            </p>
            <p className="mt-1 text-sm text-white/70">
              Email:{" "}
              <a
                className="font-semibold text-white hover:underline"
                href="mailto:spinbookhq@gmail.com"
              >
                spinbookhq@gmail.com
              </a>
            </p>
          </div>
        </section>

        <div className="pointer-events-none mx-auto mt-10 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </main>
  );
}
