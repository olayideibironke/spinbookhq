import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjPublic = {
  user_id: string;
  slug: string | null;
  stage_name: string | null;
  city: string | null;
  published: boolean | null;
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

export default async function DjBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const ok = sp?.ok;

  const supabase = await createClient();

  const { data: dj, error: djErr } = await supabase
    .from("dj_profiles")
    .select("user_id, slug, stage_name, city, published, genres")
    .eq("slug", slug)
    .maybeSingle<DjPublic>();

  if (djErr || !dj || dj.published !== true) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
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
      redirect(`/dj/${slug}/book?ok=0`);
    }

    if (!isValidEmail(email)) {
      redirect(`/dj/${slug}/book?ok=0`);
    }

    const sb = await createClient();

    const { data: djRow, error: djRowErr } = await sb
      .from("dj_profiles")
      .select("user_id, published")
      .eq("slug", slug)
      .maybeSingle<{ user_id: string; published: boolean | null }>();

    if (djRowErr || !djRow || djRow.published !== true) {
      redirect(`/dj/${slug}/book?ok=0`);
    }

    const { error: insertErr } = await sb.from("booking_requests").insert({
      dj_user_id: djRow.user_id,
      requester_name: name,
      requester_email: email,
      event_date: eventDate,
      event_location: location,
      message: message ? message : null,
      status: "new",
    });

    if (insertErr) {
      redirect(`/dj/${slug}/book?ok=0`);
    }

    redirect(`/dj/${slug}/book?ok=1`);
  }

  const djName = dj.stage_name ?? "DJ";
  const djCity = dj.city ?? null;

  const genres = parseGenres((dj as any).genres);
  const topGenres = genres.slice(0, 6);

  const showSuccess = ok === "1";
  const showError = ok === "0";

  return (
    <main
      className={[
        // Mobile-safe spacing: avoid iOS bottom bar + any floating button overlays
        "px-4 py-6 sm:px-6 sm:py-10",
        "pb-[calc(6rem+env(safe-area-inset-bottom))]",
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* Top nav */}
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

        {/* Header */}
        <div className="mt-7">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Request Booking
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Requesting:{" "}
            <span className="font-extrabold text-white">{djName}</span>
            {djCity ? <span className="text-white/55"> • {djCity}</span> : null}
          </p>

          {/* ✅ Genre chips */}
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

        {/* How it works */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-6">
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

        {/* Status banners */}
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
          </div>
        )}

        {/* Form card (hide after success) */}
        {!showSuccess && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur sm:p-7">
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
                    // ✅ Mobile UX: 16px text prevents iOS zoom
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40 sm:text-sm"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40 sm:text-sm"
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
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40 sm:text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/55">
                    Pick the event date you want to lock in.
                  </p>
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
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40 sm:text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/55">
                    Example: Washington, DC
                  </p>
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
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 placeholder:text-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none focus:ring-2 focus:ring-violet-400/40 sm:text-sm"
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-extrabold text-white/80">
                    Quick checklist (optional)
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-white/60">
                    <li>• Start time + end time</li>
                    <li>• Venue type (home, hall, club, outdoor)</li>
                    <li>• Music vibe (Afrobeats, Hip-Hop, House, etc.)</li>
                    <li>• Do you need speakers / mic?</li>
                  </ul>
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
