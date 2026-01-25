import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

type BookingRequest = {
  id: string;
  created_at: string;
  dj_user_id: string;
  requester_name: string;
  requester_email: string;
  event_date: string;
  event_location: string;
  message: string | null;
  status: "new" | "accepted" | "declined" | "closed";
  stripe_checkout_session_id?: string | null;
  deposit_paid?: boolean | null;
  deposit_paid_at?: string | null;
};

function buildMailto(r: BookingRequest) {
  const subject = `Booking request (${r.event_date})`;
  const bodyLines = [
    `Hi ${r.requester_name},`,
    ``,
    `Thanks for reaching out about booking me.`,
    ``,
    `Event date: ${r.event_date}`,
    `Location: ${r.event_location}`,
    r.message?.trim() ? `Message: ${r.message.trim()}` : `Message: (none)`,
    ``,
    `Best,`,
    `DJ`,
  ];

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join("\n"),
  });

  return `mailto:${r.requester_email}?${params.toString()}`;
}

function formatUsdFromCents(cents: number) {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function DashboardRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ pay?: string; ok?: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "").trim();

  const sp = searchParams ? await searchParams : undefined;
  const payUrl = sp?.pay ? decodeURIComponent(sp.pay) : null;
  const ok = sp?.ok ? String(sp.ok) : null;

  if (!id) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Request</h1>
        <p className="mt-4 text-sm opacity-70">Invalid request.</p>
        <div className="mt-6">
          <Link className="underline" href="/dashboard/requests">
            Back to Requests
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  async function setStatus(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!requestId || !["accepted", "declined", "closed"].includes(status)) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("dj_user_id", user.id);

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
  }

  async function createDepositLink(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    if (!requestId) redirect(`/dashboard/requests/${encodeURIComponent(id)}`);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: r } = await supabase
      .from("booking_requests")
      .select(
        "id, created_at, dj_user_id, requester_name, requester_email, event_date, event_location, message, status, deposit_paid"
      )
      .eq("id", requestId)
      .eq("dj_user_id", user.id)
      .maybeSingle<BookingRequest>();

    if (!r) redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);

    // only allow deposit after accept
    if (r.status !== "accepted") {
      redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);
    }

    // If already paid, don’t create a new session
    if (r.deposit_paid === true) {
      redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);
    }

    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("slug, stage_name")
      .eq("user_id", user.id)
      .maybeSingle<{ slug: string | null; stage_name: string | null }>();

    const djSlug = (djProfile?.slug ?? "").trim();
    if (!djSlug) redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);

    const DEPOSIT_AMOUNT_CENTS = 5000; // $50
    const depositLabel = `DJ Booking Deposit`;

    const origin = (await headers()).get("origin") ?? "";
    const successUrl = `${origin}/dj/${encodeURIComponent(djSlug)}?deposit=success&rid=${encodeURIComponent(
      r.id
    )}`;
    const cancelUrl = `${origin}/dj/${encodeURIComponent(djSlug)}?deposit=cancel&rid=${encodeURIComponent(
      r.id
    )}`;

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);

    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: r.requester_email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: DEPOSIT_AMOUNT_CENTS,
            product_data: {
              name: depositLabel,
              description: `${r.event_location} • Requested by ${r.requester_name}`,
            },
          },
        },
      ],
      metadata: {
        booking_request_id: r.id,
        dj_user_id: r.dj_user_id,
        requester_email: r.requester_email,
      },
    });

    if (!session?.url) redirect(`/dashboard/requests/${encodeURIComponent(requestId)}?ok=0`);

    // Store session id so webhook can also match by session id if needed
    await supabase
      .from("booking_requests")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", r.id)
      .eq("dj_user_id", user.id);

    redirect(
      `/dashboard/requests/${encodeURIComponent(requestId)}?ok=1&pay=${encodeURIComponent(session.url)}`
    );
  }

  const { data: request, error } = await supabase
    .from("booking_requests")
    .select(
      "id, created_at, dj_user_id, requester_name, requester_email, event_date, event_location, message, status, stripe_checkout_session_id, deposit_paid, deposit_paid_at"
    )
    .eq("id", id)
    .eq("dj_user_id", user.id)
    .maybeSingle<BookingRequest>();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Request</h1>
        <p className="mt-4 text-sm">
          Error: <span className="font-mono">{error.message}</span>
        </p>
        <div className="mt-6">
          <Link className="underline" href="/dashboard/requests">
            Back to Requests
          </Link>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Request</h1>
        <p className="mt-4 text-sm opacity-70">Request not found.</p>
        <div className="mt-6">
          <Link className="underline" href="/dashboard/requests">
            Back to Requests
          </Link>
        </div>
      </main>
    );
  }

  const mailtoHref = buildMailto(request);
  const DEPOSIT_AMOUNT_CENTS = 5000;

  return (
    <main className="p-6">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold">Request Details</h1>
        <p className="mt-2 text-sm opacity-70">Full details for this booking request.</p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link className="underline text-sm" href="/dashboard/requests">
            ← Back to Requests
          </Link>
          <Link className="underline text-sm" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>

        {request.deposit_paid ? (
          <div className="mt-6 rounded-2xl border p-4">
            <p className="text-sm font-semibold">Deposit paid ✅</p>
            <p className="mt-2 text-sm opacity-80">
              Paid at:{" "}
              <span className="font-mono">
                {request.deposit_paid_at ? new Date(request.deposit_paid_at).toLocaleString() : "—"}
              </span>
            </p>
          </div>
        ) : null}

        {ok === "1" && payUrl ? (
          <div className="mt-6 rounded-2xl border p-4">
            <p className="text-sm font-semibold">Deposit link created ✅</p>
            <p className="mt-2 text-sm opacity-80">
              Send this link to the client to pay the deposit ({formatUsdFromCents(DEPOSIT_AMOUNT_CENTS)}).
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={payUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all rounded-md border px-3 py-2 text-sm underline"
              >
                {payUrl}
              </a>
            </div>
          </div>
        ) : null}

        {ok === "0" ? (
          <div className="mt-6 rounded-2xl border p-4">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 text-sm opacity-80">
              Could not create a deposit link. Make sure the request is <b>Accepted</b> first.
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm opacity-70">Requester</p>
              <p className="text-xl font-semibold">{request.requester_name}</p>
              <p className="text-sm opacity-70">{request.requester_email}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a className="rounded-md border px-3 py-2 text-sm font-medium underline" href={mailtoHref}>
                  Email requester
                </a>
              </div>
            </div>

            <span className="rounded-full border px-3 py-1 text-xs">{request.status.toUpperCase()}</span>
          </div>

          <div className="mt-6 grid gap-3 text-sm">
            <div>
              <span className="font-medium">Event date:</span>{" "}
              <span className="opacity-80">{request.event_date}</span>
            </div>
            <div>
              <span className="font-medium">Location:</span>{" "}
              <span className="opacity-80">{request.event_location}</span>
            </div>
            <div>
              <span className="font-medium">Message:</span>{" "}
              <span className="opacity-80">
                {request.message?.trim() ? request.message : "No message provided."}
              </span>
            </div>
            <div className="text-xs opacity-60">
              Submitted: {new Date(request.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {request.status === "new" ? (
              <>
                <form action={setStatus}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="accepted" />
                  <button className="rounded-md border px-3 py-2 text-sm font-medium">Accept</button>
                </form>

                <form action={setStatus}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="declined" />
                  <button className="rounded-md border px-3 py-2 text-sm font-medium">Decline</button>
                </form>
              </>
            ) : null}

            {request.status === "accepted" ? (
              <>
                {!request.deposit_paid ? (
                  <form action={createDepositLink}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className="rounded-md border px-3 py-2 text-sm font-medium">
                      Request deposit ({formatUsdFromCents(DEPOSIT_AMOUNT_CENTS)})
                    </button>
                  </form>
                ) : null}

                <form action={setStatus}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value="closed" />
                  <button className="rounded-md border px-3 py-2 text-sm font-medium">Close</button>
                </form>
              </>
            ) : null}

            {request.status === "declined" ? (
              <form action={setStatus}>
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="status" value="closed" />
                <button className="rounded-md border px-3 py-2 text-sm font-medium">Close</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
