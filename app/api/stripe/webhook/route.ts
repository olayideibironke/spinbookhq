// FILE: app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const COMPANY_BCC = "spinbookhq@gmail.com";
const DEFAULT_FROM = "SpinBook HQ <no-reply@spinbookhq.com>";

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

function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function generatePublicToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function getAuthEmailByUserId(
  sb: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const uid = String(userId ?? "").trim();
  if (!uid) return null;

  try {
    // Requires service role key
    const { data, error } = await sb.auth.admin.getUserById(uid);
    if (error) {
      console.warn("[SpinBookHQ] auth.admin.getUserById error:", error.message);
      return null;
    }
    const email = String(data?.user?.email ?? "").trim();
    return email || null;
  } catch (e: any) {
    console.warn(
      "[SpinBookHQ] auth.admin.getUserById exception:",
      String(e?.message ?? e)
    );
    return null;
  }
}

async function sendEmailDepositReceived(args: {
  to: string;
  recipientType: "requester" | "dj";
  requesterName: string;
  djName: string;
  eventDate: string;
  eventLocation: string;
  quotedTotal?: number | null;
  bookingId: string;
  publicToken: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  // ✅ Use verified-domain sender by default
  const from = String(process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM).trim();

  // Don’t break webhook if email env isn’t set.
  if (!apiKey) {
    console.warn(
      "[SpinBookHQ] Resend env missing: set RESEND_API_KEY to enable deposit-received emails."
    );
    return { ok: false as const, error: "Missing RESEND_API_KEY" };
  }

  const origin = buildOrigin();
  const statusUrl = `${origin}/r/${encodeURIComponent(args.publicToken)}`;

  const subject =
    args.recipientType === "dj"
      ? `Deposit received — booking confirmed ✅`
      : `Deposit received — your DJ is locked in ✅`;

  const quotedLine =
    args.quotedTotal != null && Number.isFinite(Number(args.quotedTotal))
      ? `<div><strong>Agreed total price:</strong> ${formatUsd(
          Number(args.quotedTotal)
        )}</div>`
      : "";

  const introLine =
    args.recipientType === "dj"
      ? `<p style="margin:0 0 12px 0;">
           Hello,<br/>
           A client has paid the <strong>${formatUsd(
             200
           )}</strong> deposit. The booking is now <strong>confirmed</strong>.
         </p>`
      : `<p style="margin:0 0 12px 0;">
           Hi ${escapeHtml(args.requesterName || "there")},<br/>
           We’ve received your <strong>${formatUsd(
             200
           )}</strong> deposit. Your booking request is now <strong>confirmed</strong> with
           <strong>${escapeHtml(args.djName)}</strong>.
         </p>`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Deposit received ✅</h2>

    ${introLine}

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      ${quotedLine}
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
      <div style="margin-top:8px;"><strong>Deposit:</strong> ${formatUsd(
        200
      )} (non-refundable)</div>
    </div>

    <p style="margin:0 0 12px 0;">
      Track this booking anytime:<br/>
      <a href="${escapeAttr(statusUrl)}">${escapeHtml(statusUrl)}</a>
    </p>

    <p style="margin:14px 0 0 0; font-size:12px; color:#4b5563;">
      Reminder: The remaining balance must be paid to the DJ <strong>7 days before the event</strong>. If not paid, the deposit is forfeited and the DJ may cancel.
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
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
        bcc: [COMPANY_BCC], // ✅ compulsory company visibility
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

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err: any) {
    console.warn("[SpinBookHQ] Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only handle what we need.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Must be a paid session.
  const paid =
    session.payment_status === "paid" ||
    // fallback for older variants
    (session as any).paid === true;

  if (!paid) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const bookingId = String(session.metadata?.booking_request_id ?? "").trim();
  if (!bookingId) {
    console.warn("[SpinBookHQ] Missing booking_request_id in session metadata");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const sb = getSupabaseAdmin();

  // Fetch request row
  const { data: reqRow, error: reqErr } = await sb
    .from("booking_requests")
    .select(
      "id, requester_email, requester_name, event_date, event_location, quoted_total, deposit_paid, deposit_paid_at, public_token, dj_user_id, stripe_checkout_session_id, deposit_email_sent_at"
    )
    .eq("id", bookingId)
    .maybeSingle<{
      id: string;
      requester_email: string;
      requester_name: string;
      event_date: string;
      event_location: string;
      quoted_total: number | null;
      deposit_paid: boolean | null;
      deposit_paid_at: string | null;
      public_token: string | null;
      dj_user_id: string;
      stripe_checkout_session_id: string | null;
      deposit_email_sent_at: string | null;
    }>();

  if (reqErr || !reqRow) {
    console.warn("[SpinBookHQ] booking_requests not found:", bookingId, reqErr);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ✅ Safety: ensure this webhook is for the same checkout session we generated.
  // If the DB has a stored session id and it doesn't match, do NOT update or email.
  const incomingSessionId = String(session.id ?? "").trim();
  const storedSessionId = String(reqRow.stripe_checkout_session_id ?? "").trim();
  if (
    storedSessionId &&
    incomingSessionId &&
    storedSessionId !== incomingSessionId
  ) {
    console.warn("[SpinBookHQ] Session ID mismatch for booking", {
      bookingId,
      storedSessionId,
      incomingSessionId,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const alreadyPaid = reqRow.deposit_paid === true;

  // Ensure public token exists
  let publicToken = String(reqRow.public_token ?? "").trim();
  if (!publicToken) {
    publicToken = generatePublicToken();
  }

  // Update DB: deposit_paid + time + session id + token
  const nowIso = new Date().toISOString();

  if (!alreadyPaid) {
    await sb
      .from("booking_requests")
      .update({
        deposit_paid: true,
        deposit_paid_at: nowIso,
        public_token: publicToken,
        stripe_checkout_session_id:
          storedSessionId || incomingSessionId || null,
      })
      .eq("id", bookingId);
  } else {
    // Ensure token exists even if already paid
    if (!reqRow.public_token) {
      await sb
        .from("booking_requests")
        .update({ public_token: publicToken })
        .eq("id", bookingId);
    }
  }

  // Idempotency for Email #4
  if (reqRow.deposit_email_sent_at) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // DJ name
  let djName = "DJ";
  if (reqRow.dj_user_id) {
    const { data: djProfile } = await sb
      .from("dj_profiles")
      .select("stage_name")
      .eq("user_id", reqRow.dj_user_id)
      .maybeSingle<{ stage_name: string | null }>();

    djName = String(djProfile?.stage_name ?? "DJ").trim();
  }

  // DJ email (auth email)
  const djEmail = await getAuthEmailByUserId(sb, reqRow.dj_user_id);

  // Send email to requester AND DJ
  const requesterTo = String(reqRow.requester_email ?? "").trim();

  const sendResults: Array<{
    ok: boolean;
    who: "requester" | "dj";
    error?: string;
  }> = [];

  if (requesterTo) {
    const res = await sendEmailDepositReceived({
      to: requesterTo,
      recipientType: "requester",
      requesterName: String(reqRow.requester_name ?? "").trim(),
      djName,
      eventDate: String(reqRow.event_date ?? "").trim(),
      eventLocation: String(reqRow.event_location ?? "").trim(),
      quotedTotal: reqRow.quoted_total ?? null,
      bookingId,
      publicToken,
    });
    sendResults.push({
      ok: res.ok,
      who: "requester",
      ...(res.ok ? {} : { error: res.error }),
    });
  }

  if (djEmail) {
    const res = await sendEmailDepositReceived({
      to: djEmail,
      recipientType: "dj",
      requesterName: String(reqRow.requester_name ?? "").trim(),
      djName,
      eventDate: String(reqRow.event_date ?? "").trim(),
      eventLocation: String(reqRow.event_location ?? "").trim(),
      quotedTotal: reqRow.quoted_total ?? null,
      bookingId,
      publicToken,
    });
    sendResults.push({
      ok: res.ok,
      who: "dj",
      ...(res.ok ? {} : { error: res.error }),
    });
  }

  // ✅ Mark sent ONLY if requester email succeeded AND (DJ email succeeded OR no DJ email exists)
  const requesterOk = sendResults.some((r) => r.who === "requester" && r.ok);
  const djAttempted = sendResults.some((r) => r.who === "dj");
  const djOk = !djAttempted || sendResults.some((r) => r.who === "dj" && r.ok);

  if (requesterOk && djOk) {
    await sb
      .from("booking_requests")
      .update({ deposit_email_sent_at: new Date().toISOString() })
      .eq("id", bookingId);
  } else {
    console.warn("[SpinBookHQ] Email #4 not fully sent:", sendResults);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
