// FILE: src/lib/email.ts
// Resend email helpers (server-side). Uses fetch to Resend API (no SDK dependency).

type EmailPayload = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  bcc?: string[];
};

function buildOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
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

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!fromEnv && !payload.from) throw new Error("Missing RESEND_FROM_EMAIL");

  const from = payload.from ?? fromEnv!;
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
      // Company visibility is compulsory
      bcc: ["spinbookhq@gmail.com", ...(payload.bcc ?? [])],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }

  return true;
}

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
      We’ve received your booking request for <strong>${escapeHtml(args.djName)}</strong>.
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

  return {
    to: args.to,
    subject,
    html,
  };
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
      <div style="margin-top:8px;"><strong>Deposit:</strong> ${formatUsd(200)} (non-refundable)</div>
    </div>

    <p style="margin:0 0 12px 0;">
      Pay deposit here:<br/>
      <a href="${escapeAttr(args.checkoutUrl)}">${escapeHtml(args.checkoutUrl)}</a>
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
