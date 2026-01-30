// FILE: supabase/functions/notify-booking-request/index.ts
// Purpose: Notify the DJ by email when a new booking request is created.
//
// Trigger: Supabase Database Webhook -> this Edge Function
// Expected payload: { type, table, record, old_record }
// Works with "booking_requests" INSERT events.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COMPANY_BCC = "spinbookhq@gmail.com";
const DEFAULT_FROM = "SpinBook HQ <no-reply@spinbookhq.com>";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function buildOrigin() {
  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "";
  if (!siteUrl) throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  return siteUrl.replace(/\/$/, "");
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

function pickFromEmail() {
  const raw = String(Deno.env.get("RESEND_FROM_EMAIL") ?? "").trim();
  const lower = raw.toLowerCase();
  if (raw && lower.includes("@spinbookhq.com")) return raw;
  return DEFAULT_FROM;
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const from = pickFromEmail();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      bcc: [COMPANY_BCC], // ✅ compulsory company visibility
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }

  return true;
}

async function getDjAuthEmailByUserId(
  admin: ReturnType<typeof createClient>,
  userId: string
) {
  const uid = String(userId ?? "").trim();
  if (!uid) return null;

  const { data, error } = await admin.auth.admin.getUserById(uid);
  if (error) return null;

  const email = String(data?.user?.email ?? "").trim();
  return email || null;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    // Create admin supabase client (service role required for auth.admin.getUserById)
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const payload = await req.json().catch(() => null);
    if (!payload) return json({ ok: false, error: "Invalid JSON" }, 400);

    // Expecting Supabase webhook-like payload
    const type = String(payload.type ?? "").toUpperCase();
    const table = String(payload.table ?? "").trim();
    const record = payload.record ?? null;

    // Only handle INSERT on booking_requests
    if (type !== "INSERT" || table !== "booking_requests" || !record) {
      return json({ ok: true, ignored: true });
    }

    const bookingId = String(record.id ?? "").trim();
    const djUserId = String(record.dj_user_id ?? "").trim();

    if (!bookingId || !djUserId) {
      return json({ ok: true, ignored: true, reason: "missing id/dj_user_id" });
    }

    const requesterName = String(record.requester_name ?? "").trim() || "Client";
    const requesterEmail = String(record.requester_email ?? "").trim() || "";
    const eventDate = String(record.event_date ?? "").trim() || "";
    const eventLocation = String(record.event_location ?? "").trim() || "";
    const message = record.message != null ? String(record.message) : "";

    // Get DJ profile display name (optional)
    let djName = "DJ";
    const { data: djProfile } = await admin
      .from("dj_profiles")
      .select("stage_name")
      .eq("user_id", djUserId)
      .maybeSingle<{ stage_name: string | null }>();

    djName = String(djProfile?.stage_name ?? "DJ").trim() || "DJ";

    // Get DJ auth email
    const djEmail = await getDjAuthEmailByUserId(admin, djUserId);
    if (!djEmail) {
      return json({ ok: true, skipped: true, reason: "dj email not found" });
    }

    // Build dashboard link
    const origin = buildOrigin();
    const dashboardUrl = `${origin}/dashboard/requests/${encodeURIComponent(
      bookingId
    )}`;

    const subject = `New booking request received ✅`;

    const html = `
      <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
        <h2 style="margin:0 0 12px 0;">New booking request ✅</h2>

        <p style="margin:0 0 12px 0;">
          Hi ${escapeHtml(djName)},<br/>
          You’ve received a new booking request.
        </p>

        <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
          <div><strong>Requester:</strong> ${escapeHtml(requesterName)}${
            requesterEmail ? ` (${escapeHtml(requesterEmail)})` : ""
          }</div>
          ${eventDate ? `<div style="margin-top:6px;"><strong>Event date:</strong> ${escapeHtml(eventDate)}</div>` : ""}
          ${eventLocation ? `<div><strong>Location:</strong> ${escapeHtml(eventLocation)}</div>` : ""}
          ${
            message
              ? `<div style="margin-top:10px;"><strong>Message:</strong><br/>${escapeHtml(
                  message
                )}</div>`
              : ""
          }
        </div>

        <p style="margin:0 0 12px 0;">
          Open this request in your dashboard:<br/>
          <a href="${escapeAttr(dashboardUrl)}">${escapeHtml(dashboardUrl)}</a>
        </p>

        <p style="margin:14px 0 0 0; font-size:12px; color:#4b5563;">
          Tip: Accept quickly and declare a final price (min $450) to generate the $200 deposit link.
        </p>

        <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
        <p style="margin:0; font-size:12px; color:#6b7280;">
          SpinBook HQ • Secure bookings for premium DJs
        </p>
      </div>
    `;

    await sendResendEmail({
      to: djEmail,
      subject,
      html,
    });

    return json({ ok: true, sent: true, to: djEmail });
  } catch (e) {
    const msg = String((e as any)?.message ?? e ?? "Unknown error");
    console.error("[notify-booking-request] ERROR:", msg);
    return json({ ok: false, error: msg }, 500);
  }
});
