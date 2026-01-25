// supabase/functions/notify-booking-request/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  booking_request_id?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // 🔐 Verify webhook secret
  const providedSecret = req.headers.get("x-webhook-secret") ?? "";
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  // 🔑 Environment variables
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Missing Supabase env vars" }, 500);
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return json({ error: "Missing Resend env vars" }, 500);
  }

  // 📦 Parse payload
  let payload: Payload = {};
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const bookingId = String(payload.booking_request_id ?? "").trim();
  if (!bookingId) {
    return json({ error: "booking_request_id is required" }, 400);
  }

  // 🔐 Use service role to fetch booking + DJ email
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: booking, error: bookingErr } = await supabase
    .from("booking_requests")
    .select(
      "id, created_at, dj_user_id, requester_name, requester_email, event_date, event_location, message, status"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingErr) {
    return json({ error: bookingErr.message }, 500);
  }

  if (!booking) {
    return json({ error: "Booking request not found" }, 404);
  }

  const { data: userData, error: userErr } =
    await supabase.auth.admin.getUserById(booking.dj_user_id);

  if (userErr) {
    return json({ error: userErr.message }, 500);
  }

  const djEmail = userData?.user?.email ?? "";
  if (!djEmail) {
    return json({ error: "DJ email not found" }, 500);
  }

  // ✉️ Send email via Resend
  const emailBody = `
New booking request received.

Requester: ${booking.requester_name} (${booking.requester_email})
Event date: ${booking.event_date}
Location: ${booking.event_location}

Message:
${booking.message || "(none)"}

Login to your dashboard to respond:
https://yourdomain.com/dashboard/requests

Request ID: ${booking.id}
`;

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [djEmail],
      subject: "New booking request",
      text: emailBody,
    }),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    return json({ error: "Resend error", details: errText }, 502);
  }

  return json({ ok: true, sent_to: djEmail });
});
