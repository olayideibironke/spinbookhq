// FILE: app/dj/[slug]/book/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ IMPORTANT: avoid Edge runtime (Node crypto required)

type DjPublic = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  published: boolean | null;
  genres?: unknown;
};

const COMPANY_BCC = "spinbookhq@gmail.com";

function isValidEmail(email: string) {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function parseGenres(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function makeToken() {
  // ✅ Node-stable token generator (server-safe)
  return crypto.randomBytes(32).toString("hex");
}

function buildOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(input: string) {
  return escapeHtml(input).replaceAll("`", "&#96;");
}

async function sendEmailRequestReceived(args: {
  to: string;
  requesterName: string;
  djName: string;
  bookingId: string;
  publicToken: string;
  eventDate: string;
  eventLocation: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    const msg =
      "Missing RESEND_API_KEY or RESEND_FROM_EMAIL (Vercel Production env).";
    console.warn("[SpinBookHQ] Email #1 not sent:", msg);
    return { ok: false as const, error: msg };
  }

  const origin = buildOrigin();
  const statusUrl = `${origin}/r/${encodeURIComponent(args.publicToken)}`;

  const subject = `Request received — ${args.djName} will respond soon`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Request received ✅</h2>

    <p style="margin:0 0 12px 0;">
      Hi ${escapeHtml(args.requesterName || "there")},<br/>
      We’ve received your booking request for <strong>${escapeHtml(
        args.djName
      )}</strong>.
      The DJ will review your details and respond soon.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
      <div style="margin-top:10px;">
        <strong>Track your request:</strong><br/>
        <a href="${escapeAttr(statusUrl)}">${escapeHtml(statusUrl)}</a>
      </div>
    </div>

    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: args.to,
        bcc: [COMPANY_BCC],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[SpinBookHQ] Resend send failed:", res.status, text);
      return { ok: false as const, error: `Resend ${res.status}: ${text}` };
    }

    return { ok: true as const };
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "Unknown fetch error");
    console.warn("[SpinBookHQ] Resend exception:", msg);
    return { ok: false as const, error: msg };
  }
}

export default async function DjBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; reason?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const ok = sp?.ok;
  const reason = (sp?.reason ?? "").trim();

  const supabase = await createClient();

  const { data: dj, error: djErr } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, published, genres")
    .eq("slug", slug)
    .maybeSingle<DjPublic>();

  if (djErr || !dj || dj.published !== true) {
    return (
      <main className="p-6">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Request Booking
          </h1>
          <p className="mt-3 text-sm text-white/65">
            DJ not found or not published.
          </p>

          <div className="mt-6">
            <Link
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
              href="/djs"
            >
              ← Back to DJs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function submitBooking(formData: FormData) {
    "use server";

    try {
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const eventDate = String(formData.get("event_date") ?? "").trim();
      const location = String(formData.get("location") ?? "").trim();
      const message = String(formData.get("message") ?? "").trim();

      if (!name || !email || !eventDate || !location) {
        redirect(`/dj/${slug}/book?ok=0&reason=missing_fields`);
      }

      if (!isValidEmail(email)) {
        redirect(`/dj/${slug}/book?ok=0&reason=bad_email`);
      }

      const sb = await createClient();

      const { data: djRow, error: djRowErr } = await sb
        .from("dj_profiles")
        .select("user_id, published, stage_name")
        .eq("slug", slug)
        .maybeSingle<{
          user_id: string;
          published: boolean | null;
          stage_name: string | null;
        }>();

      if (djRowErr || !djRow || djRow.published !== true) {
        console.warn("[SpinBookHQ] DJ lookup failed:", djRowErr);
        redirect(`/dj/${slug}/book?ok=0&reason=dj_not_found`);
      }

      const public_token = makeToken();

      const { data: inserted, error: insertErr } = await sb
        .from("booking_requests")
        .insert({
          dj_user_id: djRow.user_id,
          requester_name: name,
          requester_email: email,
          event_date: eventDate,
          event_location: location,
          message: message ? message : null,
          status: "new",
          public_token,
        })
        .select("id, public_token")
        .maybeSingle<{ id: string; public_token: string | null }>();

      if (insertErr || !inserted?.id || !inserted.public_token) {
        console.warn("[SpinBookHQ] booking_requests insert failed:", insertErr);
        redirect(`/dj/${slug}/book?ok=0&reason=insert_failed`);
      }

      // Email #1 — Request received (non-blocking)
      const sendRes = await sendEmailRequestReceived({
        to: email,
        requesterName: name,
        djName: djRow.stage_name ?? "DJ",
        bookingId: inserted.id,
        publicToken: inserted.public_token,
        eventDate,
        eventLocation: location,
      });

      if (sendRes.ok) {
        // NOTE: only works if your DB has request_email_sent_at column
        await sb
          .from("booking_requests")
          .update({ request_email_sent_at: new Date().toISOString() })
          .eq("id", inserted.id);
      } else {
        console.warn("[SpinBookHQ] Email #1 failed:", sendRes);
      }

      redirect(`/dj/${slug}/book?ok=1`);
    } catch (e: any) {
      console.warn(
        "[SpinBookHQ] submitBooking exception:",
        String(e?.message ?? e),
        e?.stack ? `\n${e.stack}` : ""
      );
      redirect(`/dj/${slug}/book?ok=0&reason=server_exception`);
    }
  }

  const djName = dj.stage_name ?? "DJ";
  const djCity = dj.city ?? null;

  const genres = parseGenres((dj as any).genres);
  const topGenres = genres.slice(0, 6);

  const showSuccess = ok === "1";
  const showError = ok === "0";

  const prettyReason =
    reason === "missing_fields"
      ? "Missing required fields."
      : reason === "bad_email"
      ? "Invalid email address."
      : reason === "dj_not_found"
      ? "DJ profile lookup failed."
      : reason === "insert_failed"
      ? "Could not create request (database insert failed)."
      : reason === "server_exception"
      ? "Server error (check Vercel logs)."
      : reason
      ? `Error: ${reason}`
      : "";

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
            href={`/dj/${slug}`}
          >
            ← Back to DJ Profile
          </Link>

          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
            Request form
          </span>
        </div>

        <div className="mt-7">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Request Booking
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Requesting:{" "}
            <span className="font-extrabold text-white">{djName}</span>
            {djCity ? <span className="text-white/55"> • {djCity}</span> : null}
          </p>

          {topGenres.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/55">
                GENRES
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topGenres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm font-semibold text-white/80"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-4 max-w-2xl text-sm text-white/60">
            Fill this out once. If the DJ accepts, you may be asked to pay a
            secure deposit to confirm.
          </p>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-base font-extrabold text-white">
                What happens next
              </p>
              <ul className="mt-3 space-y-1 text-sm text-white/65">
                <li>• You send the request with event details.</li>
                <li>• DJ reviews and may accept or decline.</li>
                <li>• If accepted, deposit may be required to confirm.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-extrabold text-white">
                Deposit (if required)
              </p>
              <p className="mt-1 text-sm text-white/65">
                Deposits are collected securely via Stripe.
              </p>
            </div>
          </div>
        </section>

        {showSuccess && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 text-base font-extrabold text-emerald-100">
              <span>Request sent</span> <span aria-hidden>✅</span>
            </div>
            <p className="mt-2 text-sm text-emerald-100/80">
              The DJ will review your request and respond soon.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/dj/${slug}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.06]"
              >
                Back to profile →
              </Link>

              <Link
                href={`/dj/${slug}/book`}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15"
              >
                Send another request
              </Link>
            </div>
          </div>
        )}

        {showError && (
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="text-base font-extrabold text-red-100">
              Something went wrong
            </div>
            <p className="mt-2 text-sm text-red-100/80">
              Please check the required fields (name, email, date, location) and
              try again.
            </p>
            {prettyReason ? (
              <p className="mt-2 text-xs text-red-100/70">{prettyReason}</p>
            ) : null}
          </div>
        )}

        {!showSuccess && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
            <form action={submitBooking} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/85">
                  Your name
                </label>
                <div className="mt-2">
                  <input
                    name="name"
                    placeholder="John Doe"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/85">
                  Your email
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                </div>
                <p className="mt-2 text-xs text-white/55">
                  We’ll only use this to contact you about this booking.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-white/85">
                    Event date
                  </label>
                  <div className="mt-2">
                    <input
                      type="date"
                      name="event_date"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/85">
                    Location
                  </label>
                  <div className="mt-2">
                    <input
                      name="location"
                      placeholder="City / State"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/85">
                  Message
                </label>
                <div className="mt-2">
                  <textarea
                    name="message"
                    rows={6}
                    placeholder="Event type, venue, start time, set length, music style, equipment needs, etc."
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/55">
                  By sending a request, you agree to be contacted about this
                  booking.
                </p>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                >
                  Send request →
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="pointer-events-none mx-auto mt-10 h-px max-w-6xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </main>
  );
}
