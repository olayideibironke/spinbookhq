// src/lib/email.ts
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

function getFrom() {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM (e.g. SpinBook HQ <noreply@spinbookhq.com>)");
  return from;
}

function getOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPublicRequestUrl(token: string) {
  const origin = getOrigin();
  return `${origin}/r/${encodeURIComponent(token)}`;
}

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(args: SendEmailArgs) {
  const resend = getResend();
  const from = getFrom();

  await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}

export function emailLayout(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  const title = escapeHtml(opts.title);
  const subtitle = opts.subtitle ? escapeHtml(opts.subtitle) : "";
  const footer = escapeHtml(
    opts.footerNote ??
      "SpinBook HQ — Premium DJ bookings. If you didn’t request this, you can ignore this email."
  );

  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `
        <div style="margin-top:18px;">
          <a href="${opts.ctaUrl}"
             style="display:inline-block;padding:12px 16px;border-radius:14px;
                    background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.14);
                    color:#fff;font-weight:800;text-decoration:none;">
            ${escapeHtml(opts.ctaLabel)} →
          </a>
        </div>`
      : "";

  return `
  <div style="background:#07070b;padding:28px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:640px;margin:0 auto;border-radius:22px;
                border:1px solid rgba(255,255,255,0.10);
                background:rgba(255,255,255,0.04);
                box-shadow:0 18px 60px rgba(0,0,0,0.55);
                padding:22px;color:#fff;">
      <div style="letter-spacing:0.18em;font-size:11px;font-weight:900;color:rgba(255,255,255,0.55);">
        SPINBOOK HQ
      </div>
      <div style="margin-top:10px;font-size:28px;font-weight:900;line-height:1.15;">
        ${title}
      </div>
      ${
        subtitle
          ? `<div style="margin-top:10px;color:rgba(255,255,255,0.68);font-size:14px;line-height:1.55;">
               ${subtitle}
             </div>`
          : ""
      }
      <div style="margin-top:18px;color:rgba(255,255,255,0.78);font-size:14px;line-height:1.65;">
        ${opts.bodyHtml}
      </div>
      ${cta}
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.10);
                  color:rgba(255,255,255,0.55);font-size:12px;line-height:1.5;">
        ${footer}
      </div>
    </div>
  </div>
  `;
}

export function requestSentEmail(params: {
  to: string;
  djName: string;
  eventDate: string;
  eventLocation: string;
  tokenUrl: string;
}) {
  const bodyHtml = `
    <div>
      <div style="margin-top:6px;">
        We received your booking request for <b>${escapeHtml(params.djName)}</b>.
      </div>
      <div style="margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);">
        <div><b>Event date:</b> ${escapeHtml(params.eventDate)}</div>
        <div style="margin-top:6px;"><b>Location:</b> ${escapeHtml(params.eventLocation)}</div>
      </div>
      <div style="margin-top:14px;">
        We’ll notify you as soon as the DJ responds (accepts/quotes).
      </div>
      <div style="margin-top:14px;color:rgba(255,255,255,0.70);font-size:13px;">
        You can track your request anytime here:<br/>
        <a href="${params.tokenUrl}" style="color:#fff;text-decoration:underline;">${params.tokenUrl}</a>
      </div>
    </div>
  `;

  const html = emailLayout({
    title: "Request sent",
    subtitle: "Your booking request was delivered to the DJ.",
    bodyHtml,
    ctaLabel: "Track request",
    ctaUrl: params.tokenUrl,
  });

  const text = `SpinBook HQ — Request sent

We received your booking request for ${params.djName}.
Event date: ${params.eventDate}
Location: ${params.eventLocation}

Track your request:
${params.tokenUrl}
`;

  return { to: params.to, subject: "SpinBook HQ — Request sent", html, text };
}

export function acceptedDepositEmail(params: {
  to: string;
  djName: string;
  quotedTotal: number;
  tokenUrl: string;
}) {
  const bodyHtml = `
    <div>
      <div style="margin-top:6px;">
        Good news — the DJ <b>${escapeHtml(params.djName)}</b> accepted your request.
      </div>

      <div style="margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);">
        <div style="letter-spacing:0.18em;font-weight:900;font-size:11px;color:rgba(255,255,255,0.55);">QUOTED TOTAL</div>
        <div style="margin-top:6px;font-size:20px;font-weight:900;">$${escapeHtml(String(params.quotedTotal))}</div>
      </div>

      <div style="margin-top:14px;">
        To lock in your date, you must pay a <b>$200 non-refundable deposit</b>.
      </div>
      <div style="margin-top:10px;color:rgba(255,255,255,0.70);font-size:13px;">
        Deposit policy: If you do <b>NOT</b> pay the full remaining balance to the DJ <b>7 days before the event</b>,
        your deposit is forfeited and the DJ may cancel.
      </div>

      <div style="margin-top:14px;color:rgba(255,255,255,0.70);font-size:13px;">
        View status + pay here:<br/>
        <a href="${params.tokenUrl}" style="color:#fff;text-decoration:underline;">${params.tokenUrl}</a>
      </div>
    </div>
  `;

  const html = emailLayout({
    title: "DJ accepted — deposit required",
    subtitle: "Pay the $200 deposit to lock in your date.",
    bodyHtml,
    ctaLabel: "View & pay deposit",
    ctaUrl: params.tokenUrl,
  });

  const text = `SpinBook HQ — DJ accepted (deposit required)

DJ: ${params.djName}
Quoted total: $${params.quotedTotal}

Pay the $200 deposit to lock in your date:
${params.tokenUrl}
`;

  return {
    to: params.to,
    subject: "SpinBook HQ — DJ accepted (deposit required)",
    html,
    text,
  };
}

export function depositReceivedEmail(params: {
  to: string;
  djName: string;
  tokenUrl: string;
  rid: string;
}) {
  const bodyHtml = `
    <div>
      <div style="margin-top:6px;">
        Your <b>$200 deposit</b> was received successfully.
      </div>

      <div style="margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);">
        <div><b>DJ:</b> ${escapeHtml(params.djName)}</div>
        <div style="margin-top:6px;"><b>Booking reference:</b> <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(params.rid)}</span></div>
      </div>

      <div style="margin-top:14px;">
        You’re locked in. Next step: pay the remaining balance directly to the DJ.
      </div>

      <div style="margin-top:10px;color:rgba(255,255,255,0.70);font-size:13px;">
        Reminder policy: If you do <b>NOT</b> pay the full remaining balance <b>7 days before the event</b>,
        your deposit is forfeited and the DJ may cancel.
      </div>

      <div style="margin-top:14px;color:rgba(255,255,255,0.70);font-size:13px;">
        Track status anytime:<br/>
        <a href="${params.tokenUrl}" style="color:#fff;text-decoration:underline;">${params.tokenUrl}</a>
      </div>
    </div>
  `;

  const html = emailLayout({
    title: "Deposit received",
    subtitle: "Your booking is locked in with the DJ.",
    bodyHtml,
    ctaLabel: "Track booking",
    ctaUrl: params.tokenUrl,
  });

  const text = `SpinBook HQ — Deposit received

Your $200 deposit was received.
DJ: ${params.djName}
Booking reference: ${params.rid}

Track your booking:
${params.tokenUrl}
`;

  return { to: params.to, subject: "SpinBook HQ — Deposit received", html, text };
}

export function balanceReminderEmail(params: {
  to: string;
  djName: string;
  eventDate: string;
  tokenUrl: string;
}) {
  const bodyHtml = `
    <div>
      <div style="margin-top:6px;">
        Friendly reminder — your event is coming up on <b>${escapeHtml(
          params.eventDate
        )}</b>.
      </div>
      <div style="margin-top:14px;">
        Please pay the remaining balance to <b>${escapeHtml(
          params.djName
        )}</b> now so you are fully confirmed.
      </div>
      <div style="margin-top:10px;color:rgba(255,255,255,0.70);font-size:13px;">
        Policy: If you do <b>NOT</b> pay the full remaining balance <b>7 days before the event</b>,
        your deposit is forfeited and the DJ may cancel.
      </div>
      <div style="margin-top:14px;color:rgba(255,255,255,0.70);font-size:13px;">
        View booking details:<br/>
        <a href="${params.tokenUrl}" style="color:#fff;text-decoration:underline;">${params.tokenUrl}</a>
      </div>
    </div>
  `;

  const html = emailLayout({
    title: "Reminder: balance due soon",
    subtitle: "Your event is 7 days away — please settle the remaining balance with the DJ.",
    bodyHtml,
    ctaLabel: "View booking",
    ctaUrl: params.tokenUrl,
  });

  const text = `SpinBook HQ — Reminder: balance due soon

Event date: ${params.eventDate}
DJ: ${params.djName}

View booking details:
${params.tokenUrl}
`;

  return {
    to: params.to,
    subject: "SpinBook HQ — Reminder: balance due soon",
    html,
    text,
  };
}
