// FILE: src/lib/email.ts
// Resend email helpers (server-side). Uses fetch to Resend API (no SDK dependency).

type EmailPayload = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  bcc?: string[];
};

const COMPANY_BCC = "spinbookhq@gmail.com";
const DEFAULT_FROM = "SpinBook HQ <no-reply@spinbookhq.com>";

function buildOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SITE_URL (required for email links in production)"
    );
  }

  return siteUrl.replace(/\/$/, "");
}

export function buildPublicRequestUrl(publicToken: string) {
  const origin = buildOrigin();
  return `${origin}/r/${encodeURIComponent(publicToken)}`;
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

// ✅ Ensure we always use a verified-domain sender.
// If RESEND_FROM_EMAIL is set but NOT @spinbookhq.com, we ignore it and use DEFAULT_FROM.
function pickFromEmail(payloadFrom?: string) {
  const candidates = [payloadFrom, process.env.RESEND_FROM_EMAIL, DEFAULT_FROM]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (lower.includes("@spinbookhq.com")) return c;
  }

  return DEFAULT_FROM;
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const from = pickFromEmail(payload.from);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      // ✅ Company visibility is compulsory
      bcc: [COMPANY_BCC, ...(payload.bcc ?? [])],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }

  return true;
}

/* =========================================================
   CLIENT EMAILS
   ========================================================= */

export function requestSentEmail(args: {
  to: string;
  djName: string;
  eventDate: string;
  eventLocation: string;
  tokenUrl: string;
}) {
  const subject = `Request received — ${args.djName} ✅`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Request received ✅</h2>

    <p style="margin:0 0 12px 0;">
      Hi,<br/>
      We’ve received your booking request for <strong>${escapeHtml(
        args.djName
      )}</strong>.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
    </div>

    <p style="margin:0 0 12px 0;">
      Track your request here anytime:<br/>
      <a href="${escapeAttr(args.tokenUrl)}">${escapeHtml(args.tokenUrl)}</a>
    </p>

    <p style="margin:14px 0 0 0; font-size:12px; color:#4b5563;">
      Next: The DJ will accept or decline. If accepted, you may receive a deposit link to confirm your booking.
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  return { to: args.to, subject, html };
}

export function depositLinkEmail(args: {
  to: string;
  djName: string;
  eventDate: string;
  eventLocation: string;
  checkoutUrl: string;
  tokenUrl: string;
}) {
  const subject = `Deposit link — confirm your booking with ${args.djName}`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Your booking was accepted ✅</h2>

    <p style="margin:0 0 12px 0;">
      Good news — <strong>${escapeHtml(args.djName)}</strong> accepted your request.
      Please pay the <strong>${formatUsd(200)}</strong> deposit to lock the booking in.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
      <div style="margin-top:8px;"><strong>Deposit:</strong> ${formatUsd(
        200
      )} (non-refundable)</div>
    </div>

    <p style="margin:0 0 12px 0;">
      Pay deposit here:<br/>
      <a href="${escapeAttr(args.checkoutUrl)}">${escapeHtml(
        args.checkoutUrl
      )}</a>
    </p>

    <p style="margin:0 0 12px 0;">
      Track your request anytime:<br/>
      <a href="${escapeAttr(args.tokenUrl)}">${escapeHtml(args.tokenUrl)}</a>
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  return { to: args.to, subject, html };
}

/* =========================================================
   DJ EMAILS (NEW)
   ========================================================= */

export function djNewRequestEmail(args: {
  to: string; // DJ email
  djName: string;
  requesterName: string;
  requesterEmail: string;
  eventDate: string;
  eventLocation: string;
  message?: string | null;
  dashboardRequestUrl: string; // /dashboard/requests/[id]
}) {
  const subject = `New booking request — ${escapeHtml(args.requesterName || "Client")}`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">New booking request ✅</h2>

    <p style="margin:0 0 12px 0;">
      Hi ${escapeHtml(args.djName || "DJ")},<br/>
      You’ve received a new booking request.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Requester:</strong> ${escapeHtml(args.requesterName)} (${escapeHtml(
        args.requesterEmail
      )})</div>
      <div style="margin-top:6px;"><strong>Event date:</strong> ${escapeHtml(
        args.eventDate
      )}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>
      ${
        args.message
          ? `<div style="margin-top:10px;"><strong>Message:</strong><br/>${escapeHtml(
              args.message
            )}</div>`
          : ""
      }
    </div>

    <p style="margin:0 0 12px 0;">
      Open the request in your dashboard:<br/>
      <a href="${escapeAttr(args.dashboardRequestUrl)}">${escapeHtml(
        args.dashboardRequestUrl
      )}</a>
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

  return { to: args.to, subject, html };
}

export function djRequestAcceptedEmail(args: {
  to: string; // DJ email
  requesterName: string;
  requesterEmail: string;
  bookingId: string;
  quotedTotal: number;
  dashboardRequestUrl: string;
}) {
  const subject = `Accepted — booking request ${escapeHtml(args.bookingId)}`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Request accepted ✅</h2>

    <p style="margin:0 0 12px 0;">
      You accepted a booking request from <strong>${escapeHtml(
        args.requesterName
      )}</strong> (${escapeHtml(args.requesterEmail)}).
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      <div><strong>Declared final price:</strong> ${formatUsd(
        Number(args.quotedTotal)
      )}</div>
    </div>

    <p style="margin:0 0 12px 0;">
      View in dashboard:<br/>
      <a href="${escapeAttr(args.dashboardRequestUrl)}">${escapeHtml(
        args.dashboardRequestUrl
      )}</a>
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  return { to: args.to, subject, html };
}

export function djRequestDeclinedEmail(args: {
  to: string; // DJ email
  requesterName: string;
  requesterEmail: string;
  bookingId: string;
  dashboardRequestUrl: string;
}) {
  const subject = `Declined — booking request ${escapeHtml(args.bookingId)}`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Request declined</h2>

    <p style="margin:0 0 12px 0;">
      You declined a booking request from <strong>${escapeHtml(
        args.requesterName
      )}</strong> (${escapeHtml(args.requesterEmail)}).
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
    </div>

    <p style="margin:0 0 12px 0;">
      View in dashboard:<br/>
      <a href="${escapeAttr(args.dashboardRequestUrl)}">${escapeHtml(
        args.dashboardRequestUrl
      )}</a>
    </p>

    <hr style="border:none; border-top:1px solid #e6e6ef; margin:16px 0;" />
    <p style="margin:0; font-size:12px; color:#6b7280;">
      SpinBook HQ • Secure bookings for premium DJs
    </p>
  </div>
  `;

  return { to: args.to, subject, html };
}
