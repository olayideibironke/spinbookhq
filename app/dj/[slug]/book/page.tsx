// FILE: app/dj/[slug]/book/page.tsx
import Link from "next/link";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildPublicRequestUrl, requestSentEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type DjPublic = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  published?: boolean | null;
  is_published?: boolean | null;
  genres?: unknown;
};

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
  return crypto.randomBytes(32).toString("hex");
}

function safeReason(code: string) {
  return encodeURIComponent(String(code ?? "").slice(0, 120));
}

function isPublished(dj: DjPublic) {
  return dj.published === true || dj.is_published === true;
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
  const reason = String(sp?.reason ?? "").trim();

  const supabase = await createClient();

  const { data: dj, error: djErr } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, published, is_published, genres")
    .eq("slug", slug)
    .maybeSingle<DjPublic>();

  if (djErr || !dj || !isPublished(dj)) {
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

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const eventDate = String(formData.get("event_date") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !eventDate || !location) {
      redirect(`/dj/${slug}/book?ok=0&reason=${safeReason("missing_fields")}`);
    }

    if (!isValidEmail(email)) {
      redirect(`/dj/${slug}/book?ok=0&reason=${safeReason("invalid_email")}`);
    }

    const sb = await createClient();

    const { data: djRow, error: djRowErr } = await sb
      .from("dj_profiles")
      .select("user_id, published, is_published, stage_name")
      .eq("slug", slug)
      .maybeSingle<{
        user_id: string;
        published: boolean | null;
        is_published: boolean | null;
        stage_name: string | null;
      }>();

    if (
      djRowErr ||
      !djRow ||
      (djRow.published !== true && djRow.is_published !== true)
    ) {
      redirect(`/dj/${slug}/book?ok=0&reason=${safeReason("dj_not_published")}`);
    }

    const public_token = makeToken();

    const { data: rpcData, error: rpcErr } = await sb.rpc(
      "create_booking_request",
      {
        p_dj_user_id: djRow.user_id,
        p_requester_name: name,
        p_requester_email: email,
        p_event_date: eventDate,
        p_event_location: location,
        p_message: message || null,
        p_public_token: public_token,
      }
    );

    const inserted = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (rpcErr || !inserted?.id || !inserted?.public_token) {
      redirect(`/dj/${slug}/book?ok=0&reason=${safeReason("insert_failed")}`);
    }

    const tokenUrl = buildPublicRequestUrl(String(inserted.public_token));

    try {
      await sendEmail(
        requestSentEmail({
          to: email,
          djName: djRow.stage_name ?? "DJ",
          eventDate,
          eventLocation: location,
          tokenUrl,
        })
      );

      await sb.rpc("mark_request_email_sent", {
        p_request_id: String(inserted.id),
      });
    } catch {
      redirect(`/dj/${slug}/book?ok=0&reason=${safeReason("email_send_failed")}`);
    }

    redirect(`/dj/${slug}/book?ok=1`);
  }

  const djName = dj.stage_name ?? "DJ";
  const djCity = dj.city ?? null;
  const topGenres = parseGenres(dj.genres).slice(0, 6);

  const showSuccess = ok === "1";
  const showError = ok === "0";

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
            Booking request
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
            <div className="mt-4 flex flex-wrap gap-2">
              {topGenres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm font-semibold text-white/80"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-4 max-w-2xl text-sm text-white/60">
            {showSuccess
              ? "Your details have been sent. If the DJ is available, you’ll receive the next steps for confirmation."
              : "Send your event details. If the DJ is available, you’ll receive the next steps for confirmation."}
          </p>
        </div>

        {showSuccess && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <div className="text-base font-extrabold text-emerald-100">
              Request sent ✅
            </div>
            <p className="mt-2 text-sm text-emerald-100/80">
              The DJ will review your request and respond soon.
            </p>
          </div>
        )}

        {showError && (
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
            <div className="text-base font-extrabold text-red-100">
              Something went wrong
            </div>
            <p className="mt-2 text-sm text-red-100/80">
              Please try again. If it continues, contact SpinBook HQ support.
            </p>
            {reason ? (
              <p className="mt-3 text-xs text-red-100/70">
                Error code: <span className="font-mono">{reason}</span>
              </p>
            ) : null}
          </div>
        )}

        {!showSuccess && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
            <form action={submitBooking} className="space-y-6">
              <input
                name="name"
                placeholder="John Doe"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
              />

              <input
                type="email"
                name="email"
                placeholder="you@email.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
              />

              <div>
                <label className="mb-2 block text-sm font-extrabold text-white/85">
                  Event date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    name="event_date"
                    required
                    className="w-full cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 pr-14 text-sm text-white outline-none [color-scheme:dark] focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-400/20"
                  />

                  <div className="pointer-events-none absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm">
                    📅
                  </div>
                </div>

                <p className="mt-2 text-xs text-white/55">
                  Click the calendar field to choose the event date.
                </p>
              </div>

              <input
                name="location"
                placeholder="City / State"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
              />

              <textarea
                name="message"
                rows={6}
                placeholder="Event type, venue, start time, set length, music style, equipment needs, etc."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110"
              >
                Send request →
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}