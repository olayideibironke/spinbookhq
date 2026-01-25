import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type BookingStatus = "new" | "accepted" | "declined" | "closed";

type BookingRequest = {
  id: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  event_date: string;
  event_location: string;
  message: string | null;
  status: BookingStatus;

  checkout_url: string | null;
  stripe_checkout_session_id: string | null;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
};

function isValidStatus(v: unknown): v is BookingStatus {
  return v === "new" || v === "accepted" || v === "declined" || v === "closed";
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusPillClasses(status: BookingStatus) {
  const base =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide";
  switch (status) {
    case "new":
      return `${base} border-white/10 bg-white/[0.04] text-white/80`;
    case "accepted":
      return `${base} border-violet-400/20 bg-violet-500/10 text-violet-200`;
    case "declined":
      return `${base} border-white/10 bg-white/[0.03] text-white/65`;
    case "closed":
      return `${base} border-white/10 bg-white/[0.03] text-white/55`;
    default:
      return `${base} border-white/10 bg-white/[0.03] text-white/65`;
  }
}

function depositPillClasses(kind: "paid" | "awaiting" | "blocked" | "none") {
  const base =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold";
  switch (kind) {
    case "paid":
      return `${base} border-emerald-400/20 bg-emerald-500/10 text-emerald-200`;
    case "awaiting":
      return `${base} border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200`;
    case "blocked":
      return `${base} border-white/10 bg-white/[0.03] text-white/60`;
    case "none":
    default:
      return `${base} border-white/10 bg-white/[0.03] text-white/70`;
  }
}

export default async function DashboardRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const statusParam = (sp.status ?? "").trim().toLowerCase();
  const activeStatus = isValidStatus(statusParam) ? statusParam : "all";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  async function setStatus(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!requestId || !["accepted", "declined", "closed"].includes(status)) return;

    const supabase = await createClient();

    // ✅ Re-check auth INSIDE the server action (Vercel build-safe)
    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("dj_user_id", authedUser.id);

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
    revalidatePath("/dashboard");
  }

  async function generateDepositLink(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    if (!requestId) return;

    const supabase = await createClient();

    // ✅ Re-check auth INSIDE the server action (Vercel build-safe)
    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    // Fetch the request and validate ownership
    const { data: req, error: reqErr } = await supabase
      .from("booking_requests")
      .select(
        "id, dj_user_id, requester_email, requester_name, status, checkout_url, stripe_checkout_session_id, deposit_paid"
      )
      .eq("id", requestId)
      .single();

    if (reqErr || !req) return;
    if (req.dj_user_id !== authedUser.id) return;

    // Only allow generating for accepted requests that haven't paid
    if (req.status !== "accepted") return;
    if (req.deposit_paid) return;

    // If already exists, just revalidate and exit
    if (req.checkout_url) {
      revalidatePath("/dashboard/requests");
      revalidatePath(`/dashboard/requests/${requestId}`);
      return;
    }

    // fetch DJ slug so success/cancel can route back to the DJ profile
    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("slug")
      .eq("user_id", req.dj_user_id)
      .maybeSingle<{ slug: string | null }>();

    const djSlug = String(djProfile?.slug ?? "").trim();
    const djSlugParam = djSlug ? `&dj=${encodeURIComponent(djSlug)}` : "";

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

    // Create Stripe Checkout Session (Deposit)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.requester_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DJ Booking Deposit",
              description: `Deposit for booking request ${requestId}`,
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/book/success?rid=${requestId}${djSlugParam}`,
      cancel_url: `${origin}/book/cancel?rid=${requestId}${djSlugParam}`,
      metadata: {
        booking_request_id: requestId,
        dj_slug: djSlug || "",
      },
    });

    await supabase
      .from("booking_requests")
      .update({
        checkout_url: session.url ?? null,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", requestId)
      .eq("dj_user_id", authedUser.id);

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
    revalidatePath("/dashboard");
  }

  let query = supabase
    .from("booking_requests")
    .select(
      "id, created_at, requester_name, requester_email, event_date, event_location, message, status, checkout_url, stripe_checkout_session_id, deposit_paid, deposit_paid_at"
    )
    .eq("dj_user_id", user.id)
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: requests, error } = await query.returns<BookingRequest[]>();

  if (error) {
    return (
      <main className="p-6">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-bold">Booking Requests</h1>
          <p className="mt-4 text-sm">
            Error: <span className="font-mono">{error.message}</span>
          </p>
        </div>
      </main>
    );
  }

  const filterItems: Array<{
    key: "all" | BookingStatus;
    label: string;
    href: string;
  }> = [
    { key: "all", label: "All", href: "/dashboard/requests" },
    { key: "new", label: "New", href: "/dashboard/requests?status=new" },
    { key: "accepted", label: "Accepted", href: "/dashboard/requests?status=accepted" },
    { key: "declined", label: "Declined", href: "/dashboard/requests?status=declined" },
    { key: "closed", label: "Closed", href: "/dashboard/requests?status=closed" },
  ];

  const total = requests?.length ?? 0;
  const paidCount = (requests ?? []).filter((r) => r.deposit_paid).length;
  const awaitingCount = (requests ?? []).filter((r) => !r.deposit_paid && !!r.checkout_url).length;
  const newCount = (requests ?? []).filter((r) => r.status === "new").length;

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Booking Requests
              </h1>
              <p className="mt-1 text-sm text-white/65">
                Requests sent to your DJ profile.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={depositPillClasses("none")}>
                <span className="opacity-70">Total</span> {total}
              </span>
              <span className={depositPillClasses("paid")}>
                <span className="opacity-80">Paid</span> {paidCount}
              </span>
              <span className={depositPillClasses("awaiting")}>
                <span className="opacity-80">Awaiting</span> {awaitingCount}
              </span>
              <span className={statusPillClasses("new")}>
                <span className="opacity-80">New</span> {newCount}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
            href="/dashboard"
          >
            <span className="opacity-70">←</span> Back to Dashboard
          </Link>

          <div className="flex flex-wrap gap-2">
            {filterItems.map((f) => {
              const active = f.key === activeStatus;
              return (
                <Link
                  key={f.key}
                  href={f.href}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    "border-white/10 bg-white/[0.03] text-white/75",
                    active
                      ? "bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                      : "hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {(!requests || requests.length === 0) && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <p className="text-base font-semibold text-white">No requests</p>
            <p className="mt-1 text-sm text-white/65">
              {activeStatus === "all"
                ? "When someone submits a booking request, it will show up here."
                : "No requests match this filter."}
            </p>
          </div>
        )}

        {/* List */}
        <ul className="mt-6 space-y-4">
          {requests?.map((r) => {
            const depositKind = r.deposit_paid
              ? "paid"
              : r.checkout_url
              ? "awaiting"
              : r.status === "accepted"
              ? "none"
              : "blocked";

            const depositLabel = r.deposit_paid
              ? "Deposit paid"
              : r.checkout_url
              ? "Awaiting payment"
              : r.status === "accepted"
              ? "Not generated"
              : "Accept to enable";

            return (
              <li
                key={r.id}
                className={[
                  "rounded-3xl border p-6 transition",
                  "border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur",
                  "hover:-translate-y-[1px] hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                {/* Top row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">
                      {r.requester_name}
                    </p>
                    <p className="truncate text-sm text-white/65">{r.requester_email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusPillClasses(r.status)}>
                      {r.status.toUpperCase()}
                    </span>

                    <Link
                      href={`/dashboard/requests/${r.id}`}
                      className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
                    >
                      View
                    </Link>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-5 grid gap-2 text-sm text-white/80">
                  <div className="flex flex-wrap gap-x-2">
                    <span className="font-semibold text-white/90">Event date:</span>
                    <span className="text-white/65">{r.event_date}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-2">
                    <span className="font-semibold text-white/90">Location:</span>
                    <span className="text-white/65">{r.event_location}</span>
                  </div>

                  {r.message ? (
                    <div className="flex flex-wrap gap-x-2">
                      <span className="font-semibold text-white/90">Message:</span>
                      <span className="text-white/65">{r.message}</span>
                    </div>
                  ) : null}

                  <div className="text-xs text-white/55">
                    Submitted: {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Deposit card */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-neutral-950/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">Deposit</p>
                        <span className={depositPillClasses(depositKind as any)}>
                          {depositLabel}
                          {r.deposit_paid ? <span className="opacity-90">✅</span> : null}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-white/65">
                        {r.deposit_paid ? (
                          <>
                            Deposit confirmed.
                            {r.deposit_paid_at ? (
                              <span className="opacity-80">
                                {" "}
                                • {formatDateTime(r.deposit_paid_at)}
                              </span>
                            ) : null}
                          </>
                        ) : r.checkout_url ? (
                          <>Link is ready. Share it with the client to complete payment.</>
                        ) : r.status === "accepted" ? (
                          <>Generate a deposit link to secure this booking.</>
                        ) : (
                          <>Accept this request first to unlock deposit actions.</>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {r.deposit_paid ? null : r.checkout_url ? (
                        <a
                          href={r.checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
                        >
                          Open deposit checkout
                        </a>
                      ) : r.status === "accepted" ? (
                        <form action={generateDepositLink}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <button
                            data-variant="primary"
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                          >
                            Generate deposit link
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {r.status === "new" ? (
                    <>
                      <form action={setStatus}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <button
                          data-variant="primary"
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                        >
                          Accept
                        </button>
                      </form>

                      <form action={setStatus}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="status" value="declined" />
                        <button className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]">
                          Decline
                        </button>
                      </form>
                    </>
                  ) : null}

                  {r.status === "accepted" || r.status === "declined" ? (
                    <form action={setStatus}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="status" value="closed" />
                      <button className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]">
                        Close
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
