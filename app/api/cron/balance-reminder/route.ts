// FILE: app/api/cron/balance-reminder/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function sendEmailBalanceReminder(args: {
  to: string;
  requesterName: string;
  djName: string;
  eventDate: string;
  eventLocation: string;
  quotedTotal?: number | null;
  publicToken: string;
  bookingId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      "[SpinBookHQ] Resend env missing: set RESEND_API_KEY and RESEND_FROM_EMAIL to enable reminder emails."
    );
    return;
  }

  const origin = buildOrigin();
  const statusUrl = `${origin}/r/${encodeURIComponent(args.publicToken)}`;

  const subject = `Reminder: balance due in 7 days for your DJ booking`;

  const quotedLine =
    args.quotedTotal != null && Number.isFinite(Number(args.quotedTotal))
      ? `<div><strong>Agreed total price:</strong> ${formatUsd(
          Number(args.quotedTotal)
        )}</div>`
      : "";

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Balance reminder ⏳</h2>

    <p style="margin:0 0 12px 0;">
      Hi ${escapeHtml(args.requesterName || "there")},<br/>
      Your event with <strong>${escapeHtml(args.djName)}</strong> is in <strong>7 days</strong>.
      Please pay the <strong>remaining balance</strong> directly to the DJ before the deadline.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      ${quotedLine}
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
    </div>

    <p style="margin:0 0 12px 0;">
      Track your booking status here:<br/>
      <a href="${escapeAttr(statusUrl)}">${escapeHtml(statusUrl)}</a>
    </p>

    <p style="margin:14px 0 0 0; font-size:12px; color:#4b5563;">
      Policy: If you do <strong>NOT</strong> pay the full balance to the DJ <strong>7 days before the event</strong>,
      the deposit is forfeited and the DJ may cancel.
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[SpinBookHQ] Resend send failed:", res.status, text);
  }
}

function dateOnlyUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export async function GET(req: Request) {
  // ✅ Official Vercel Cron security:
  // Vercel will automatically send: Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Missing CRON_SECRET" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();

  // Match "today + 7 days" (UTC date-only) against the event_date string (YYYY-MM-DD).
  const today = dateOnlyUtc(new Date());
  const target = addDaysUtc(today, 7);

  const yyyy = target.getUTCFullYear();
  const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(target.getUTCDate()).padStart(2, "0");
  const targetStr = `${yyyy}-${mm}-${dd}`;

  const { data: rows, error } = await sb
    .from("booking_requests")
    .select(
      "id, requester_email, requester_name, event_date, event_location, quoted_total, public_token, dj_user_id, balance_reminder_sent_at, deposit_paid"
    )
    .eq("deposit_paid", true)
    .eq("event_date", targetStr)
    .is("balance_reminder_sent_at", null);

  if (error) {
    console.warn("[SpinBookHQ] reminder query failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const r of rows ?? []) {
    const to = String(r.requester_email ?? "").trim();
    if (!to) continue;

    const publicToken = String(r.public_token ?? "").trim();
    if (!publicToken) continue;

    // DJ name
    let djName = "DJ";
    if (r.dj_user_id) {
      const { data: djProfile } = await sb
        .from("dj_profiles")
        .select("stage_name")
        .eq("user_id", r.dj_user_id)
        .maybeSingle<{ stage_name: string | null }>();
      djName = String(djProfile?.stage_name ?? "DJ").trim();
    }

    await sendEmailBalanceReminder({
      to,
      requesterName: String(r.requester_name ?? "").trim(),
      djName,
      eventDate: String(r.event_date ?? "").trim(),
      eventLocation: String(r.event_location ?? "").trim(),
      quotedTotal: r.quoted_total ?? null,
      publicToken,
      bookingId: String(r.id),
    });

    await sb
      .from("booking_requests")
      .update({ balance_reminder_sent_at: new Date().toISOString() })
      .eq("id", r.id);

    sent += 1;
  }

  return NextResponse.json({ ok: true, target: targetStr, sent }, { status: 200 });
}
