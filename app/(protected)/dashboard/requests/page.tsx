// FILE: app/(protected)/dashboard/requests/page.tsx
import Link from "next/link";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const COMPANY_BCC = "spinbookhq@gmail.com";
const DEFAULT_FROM = "SpinBook HQ <no-reply@spinbookhq.com>";

type BookingStatus = "new" | "accepted" | "declined" | "closed";
type FilterKey = "all" | BookingStatus;

type BookingRequest = {
  id: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  event_date: string;
  event_location: string;
  message: string | null;
  status: BookingStatus;

  quoted_total: number | null;
  quoted_at: string | null;
  platform_fee_total: number | null;
  platform_fee_paid: number | null;
  fee_status: string | null;

  checkout_url: string | null;
  stripe_checkout_session_id: string | null;
  deposit_paid: boolean;
  deposit_paid_at: string | null;

  public_token?: string | null;

  // Email markers
  accept_email_sent_at?: string | null; // ✅ Email #3 (Accepted + deposit required + checkout link)
  decline_email_sent_at?: string | null; // ✅ Email #2 (Declined)
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
      return `${base} border-white/10 bg-white/[0.04] text-white/85`;
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

function toPositiveIntOrNull(raw: string) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  if (int <= 0) return null;
  return int;
}

function calcPlatformFeeTotal(quotedTotal: number) {
  return Math.ceil(quotedTotal * 0.1);
}

function calcFeeDue(platformFeeTotal: number, platformFeePaid: number) {
  const due = platformFeeTotal - platformFeePaid;
  return due > 0 ? due : 0;
}

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

async function sendEmailDeclined(args: {
  to: string;
  requesterName: string;
  djName: string;
  bookingId: string;
  publicToken: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  // ✅ Use verified-domain sender by default
  const from = String(process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM).trim();

  if (!apiKey) {
    const msg = "Missing RESEND_API_KEY (Vercel Production env).";
    console.warn("[SpinBookHQ] Email #2 (Declined) not sent:", msg);
    return { ok: false, error: msg };
  }

  const origin = buildOrigin();
  const statusUrl = `${origin}/r/${encodeURIComponent(args.publicToken)}`;
  const browseUrl = `${origin}/djs`;

  const subject = `Booking request declined`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Update on your DJ request</h2>

    <p style="margin:0 0 12px 0;">
      Hi ${escapeHtml(args.requesterName || "there")},<br/>
      Unfortunately, <strong>${escapeHtml(args.djName)}</strong> declined your booking request.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      <div style="margin-top:10px;">
        Track your request status (no account required):<br/>
        <a href="${escapeAttr(statusUrl)}">${escapeHtml(statusUrl)}</a>
      </div>
    </div>

    <p style="margin:0 0 12px 0;">
      Want a replacement fast? Browse premium DJs here:<br/>
      <a href="${escapeAttr(browseUrl)}">${escapeHtml(browseUrl)}</a>
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
        bcc: [COMPANY_BCC],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[SpinBookHQ] Resend send failed:", res.status, text);
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "Unknown fetch error");
    console.warn("[SpinBookHQ] Resend exception:", msg);
    return { ok: false, error: msg };
  }
}

async function sendEmailAcceptedDepositRequired(args: {
  to: string;
  requesterName: string;
  djName: string;
  quotedTotal: number;
  eventDate: string;
  eventLocation: string;
  bookingId: string;
  publicToken: string;
  checkoutUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  // ✅ Use verified-domain sender by default
  const from = String(process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM).trim();

  if (!apiKey) {
    const msg = "Missing RESEND_API_KEY (Vercel Production env).";
    console.warn(
      "[SpinBookHQ] Email #3 (Accepted + deposit link) not sent:",
      msg
    );
    return { ok: false, error: msg };
  }

  const origin = buildOrigin();
  const statusUrl = `${origin}/r/${encodeURIComponent(args.publicToken)}`;

  const subject = `DJ accepted — deposit required to confirm your booking`;

  const html = `
  <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0b0b0f;">
    <h2 style="margin:0 0 12px 0;">Your request was accepted ✅</h2>

    <p style="margin:0 0 12px 0;">
      Hi ${escapeHtml(args.requesterName || "there")},<br/>
      <strong>${escapeHtml(args.djName)}</strong> accepted your booking request.
      To lock in your date, please pay the required <strong>${formatUsd(
        200
      )}</strong> deposit.
    </p>

    <div style="border:1px solid #e6e6ef; border-radius:14px; padding:14px; background:#fafafe; margin:14px 0;">
      <div><strong>Booking reference:</strong> ${escapeHtml(args.bookingId)}</div>
      <div><strong>Agreed total price:</strong> ${formatUsd(
        Number(args.quotedTotal)
      )}</div>
      <div><strong>Event date:</strong> ${escapeHtml(args.eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(args.eventLocation)}</div>

      <div style="margin-top:10px;">
        <strong>Deposit:</strong> ${formatUsd(200)} (non-refundable)
      </div>
      <div style="margin-top:6px; font-size:12px; color:#4b5563;">
        Policy: If you do <strong>NOT</strong> pay the remaining balance to the DJ <strong>7 days before the event</strong>,
        the deposit is forfeited and the DJ may cancel.
      </div>
    </div>

    <p style="margin:0 0 12px 0;">
      <strong>Pay deposit now:</strong><br/>
      <a href="${escapeAttr(args.checkoutUrl)}">${escapeHtml(
        args.checkoutUrl
      )}</a>
    </p>

    <p style="margin:0 0 12px 0;">
      Track your booking status (no account required):<br/>
      <a href="${escapeAttr(statusUrl)}">${escapeHtml(statusUrl)}</a>
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
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "Unknown fetch error");
    console.warn("[SpinBookHQ] Resend exception:", msg);
    return { ok: false, error: msg };
  }
}

export default async function DashboardRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const statusParam = (sp.status ?? "").trim().toLowerCase();

  const activeStatus: FilterKey = isValidStatus(statusParam)
    ? statusParam
    : "all";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  async function acceptAndQuote(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    const quotedRaw = String(formData.get("quoted_total") ?? "");

    if (!requestId) return;

    const quoted_total = toPositiveIntOrNull(quotedRaw);
    if (!quoted_total || quoted_total < 450) return;

    const platform_fee_total = calcPlatformFeeTotal(quoted_total);
    const platform_fee_paid = 80;
    const fee_status = platform_fee_total > platform_fee_paid ? "due" : "ok";

    const supabase = await createClient();
    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    await supabase
      .from("booking_requests")
      .update({
        status: "accepted",
        quoted_total,
        quoted_at: new Date().toISOString(),
        platform_fee_total,
        platform_fee_paid,
        fee_status,
      })
      .eq("id", requestId)
      .eq("dj_user_id", authedUser.id)
      .eq("status", "new");

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
    revalidatePath("/dashboard");
  }

  async function setStatus(formData: FormData) {
    "use server";

    const requestId = String(formData.get("requestId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!requestId || !["declined", "closed"].includes(status)) return;

    const supabase = await createClient();
    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    // Declined path includes Email #2
    if (status === "declined") {
      const { data: req, error: reqErr } = await supabase
        .from("booking_requests")
        .select(
          "id, dj_user_id, requester_email, requester_name, status, public_token, decline_email_sent_at"
        )
        .eq("id", requestId)
        .single();

      if (!reqErr && req && req.dj_user_id === authedUser.id) {
        await supabase
          .from("booking_requests")
          .update({ status: "declined" })
          .eq("id", requestId)
          .eq("dj_user_id", authedUser.id);

        let publicToken = String(req.public_token ?? "").trim();
        if (!publicToken) {
          publicToken = generatePublicToken();
          await supabase
            .from("booking_requests")
            .update({ public_token: publicToken })
            .eq("id", requestId)
            .eq("dj_user_id", authedUser.id);
        }

        const alreadySent = !!req.decline_email_sent_at;

        if (!alreadySent) {
          const { data: djProfileName } = await supabase
            .from("dj_profiles")
            .select("stage_name")
            .eq("user_id", authedUser.id)
            .maybeSingle<{ stage_name: string | null }>();

          const djName = String(djProfileName?.stage_name ?? "DJ").trim();

          const sendRes = await sendEmailDeclined({
            to: String(req.requester_email ?? "").trim(),
            requesterName: String(req.requester_name ?? "").trim(),
            djName,
            bookingId: String(req.id),
            publicToken,
          });

          if (sendRes.ok) {
            await supabase
              .from("booking_requests")
              .update({ decline_email_sent_at: new Date().toISOString() })
              .eq("id", requestId)
              .eq("dj_user_id", authedUser.id);
          }
        }

        revalidatePath("/dashboard/requests");
        revalidatePath(`/dashboard/requests/${requestId}`);
        revalidatePath("/dashboard");
        return;
      }
    }

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
    const {
      data: { user: authedUser },
      error: authedUserError,
    } = await supabase.auth.getUser();

    if (authedUserError || !authedUser) redirect("/login");

    const { data: req, error: reqErr } = await supabase
      .from("booking_requests")
      .select(
        "id, dj_user_id, requester_email, requester_name, event_date, event_location, status, checkout_url, stripe_checkout_session_id, deposit_paid, quoted_total, platform_fee_total, platform_fee_paid, fee_status, public_token, accept_email_sent_at"
      )
      .eq("id", requestId)
      .single();

    if (reqErr || !req) return;
    if (req.dj_user_id !== authedUser.id) return;

    if (req.status !== "accepted") return;
    if (!req.quoted_total || Number(req.quoted_total) < 450) return;
    if (req.deposit_paid) return;

    const origin = buildOrigin();

    let publicToken = String(req.public_token ?? "").trim();
    if (!publicToken) {
      publicToken = generatePublicToken();
    }

    // If checkout already exists, try to send Email #3 if it hasn't been sent yet (retry-safe)
    if (req.checkout_url) {
      const alreadySent = !!req.accept_email_sent_at;

      // Always persist token so /r/[token] works
      await supabase
        .from("booking_requests")
        .update({ public_token: publicToken })
        .eq("id", requestId)
        .eq("dj_user_id", authedUser.id);

      if (!alreadySent) {
        const { data: djProfileName } = await supabase
          .from("dj_profiles")
          .select("stage_name")
          .eq("user_id", req.dj_user_id)
          .maybeSingle<{ stage_name: string | null }>();

        const djName = String(djProfileName?.stage_name ?? "DJ").trim();

        const sendRes = await sendEmailAcceptedDepositRequired({
          to: String(req.requester_email ?? "").trim(),
          requesterName: String(req.requester_name ?? "").trim(),
          djName,
          quotedTotal: Number(req.quoted_total),
          eventDate: String(req.event_date ?? "").trim(),
          eventLocation: String(req.event_location ?? "").trim(),
          bookingId: String(req.id),
          publicToken,
          checkoutUrl: String(req.checkout_url),
        });

        if (sendRes.ok) {
          await supabase
            .from("booking_requests")
            .update({
              accept_email_sent_at: new Date().toISOString(),
            })
            .eq("id", requestId)
            .eq("dj_user_id", authedUser.id);
        }
      }

      revalidatePath("/dashboard/requests");
      revalidatePath(`/dashboard/requests/${requestId}`);
      return;
    }

    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("slug, stage_name")
      .eq("user_id", req.dj_user_id)
      .maybeSingle<{ slug: string | null; stage_name: string | null }>();

    const djSlug = String(djProfile?.slug ?? "").trim();
    const djName = String(djProfile?.stage_name ?? "DJ").trim();
    const djSlugParam = djSlug ? `&dj=${encodeURIComponent(djSlug)}` : "";

    const DEPOSIT_AMOUNT_CENTS = 20000;
    const DEPOSIT_SPLIT_SPINBOOK_CENTS = 8000;
    const DEPOSIT_SPLIT_DJ_CENTS = 12000;

    const quotedTotal = Number(req.quoted_total);
    const platformFeeTotal = Number.isFinite(quotedTotal)
      ? calcPlatformFeeTotal(quotedTotal)
      : null;

    const platformFeePaid = 80;
    const feeStatus =
      platformFeeTotal != null && platformFeeTotal > platformFeePaid
        ? "due"
        : "ok";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.requester_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DJ Booking Deposit ($200)",
              description: `Non-refundable booking deposit for request ${requestId}. Declared final price: $${req.quoted_total}.`,
            },
            unit_amount: DEPOSIT_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/book/success?rid=${requestId}${djSlugParam}`,
      cancel_url: `${origin}/book/cancel?rid=${requestId}${djSlugParam}`,
      metadata: {
        booking_request_id: requestId,
        dj_user_id: String(req.dj_user_id ?? ""),
        dj_slug: djSlug || "",
        deposit_amount_cents: String(DEPOSIT_AMOUNT_CENTS),
        deposit_split_spinbook_cents: String(DEPOSIT_SPLIT_SPINBOOK_CENTS),
        deposit_split_dj_cents: String(DEPOSIT_SPLIT_DJ_CENTS),
        quoted_total: String(req.quoted_total ?? ""),
        platform_fee_total:
          platformFeeTotal != null ? String(platformFeeTotal) : "",
        platform_fee_paid: String(platformFeePaid),
        policy:
          "Deposit is $200. $80 to SpinBook, $120 to DJ. Deposit is non-refundable if client fails to pay full balance 7 days before event. SpinBook earns 10% of agreed total; remaining fee owed by DJ.",
      },
    });

    const checkoutUrl = String(session.url ?? "").trim();
    if (!checkoutUrl) return;

    // Save session + token + fee fields (DO NOT mark email sent yet)
    await supabase
      .from("booking_requests")
      .update({
        checkout_url: checkoutUrl,
        stripe_checkout_session_id: session.id,
        public_token: publicToken,

        ...(platformFeeTotal != null ? { platform_fee_total: platformFeeTotal } : {}),
        platform_fee_paid: platformFeePaid,
        fee_status: feeStatus,
      })
      .eq("id", requestId)
      .eq("dj_user_id", authedUser.id);

    // Email #3 (only mark sent if success)
    const sendRes = await sendEmailAcceptedDepositRequired({
      to: String(req.requester_email ?? "").trim(),
      requesterName: String(req.requester_name ?? "").trim(),
      djName,
      quotedTotal: Number(req.quoted_total),
      eventDate: String(req.event_date ?? "").trim(),
      eventLocation: String(req.event_location ?? "").trim(),
      bookingId: String(req.id),
      publicToken,
      checkoutUrl,
    });

    if (sendRes.ok) {
      await supabase
        .from("booking_requests")
        .update({
          accept_email_sent_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("dj_user_id", authedUser.id);
    }

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
    revalidatePath("/dashboard");
  }

  const { data: djProfileForShare } = await supabase
    .from("dj_profiles")
    .select("slug")
    .eq("user_id", user.id)
    .maybeSingle<{ slug: string | null }>();

  const mySlug = String(djProfileForShare?.slug ?? "").trim();
  const myPublicProfilePath = mySlug ? `/dj/${mySlug}` : null;

  let query = supabase
    .from("booking_requests")
    .select(
      "id, created_at, requester_name, requester_email, event_date, event_location, message, status, quoted_total, quoted_at, platform_fee_total, platform_fee_paid, fee_status, checkout_url, stripe_checkout_session_id, deposit_paid, deposit_paid_at, public_token, accept_email_sent_at, decline_email_sent_at"
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
          <h1 className="text-3xl font-bold text-white">Booking Requests</h1>
          <p className="mt-4 text-sm text-white/70">
            Error:{" "}
            <span className="font-mono text-white/85">{error.message}</span>
          </p>
        </div>
      </main>
    );
  }

  const filterItems: Array<{ key: FilterKey; label: string; href: string }> = [
    { key: "all", label: "All", href: "/dashboard/requests" },
    { key: "new", label: "New", href: "/dashboard/requests?status=new" },
    { key: "accepted", label: "Accepted", href: "/dashboard/requests?status=accepted" },
    { key: "declined", label: "Declined", href: "/dashboard/requests?status=declined" },
    { key: "closed", label: "Closed", href: "/dashboard/requests?status=closed" },
  ];

  const total = requests?.length ?? 0;
  const paidCount = (requests ?? []).filter((r) => r.deposit_paid).length;
  const awaitingCount = (requests ?? []).filter(
    (r) => !r.deposit_paid && !!r.checkout_url
  ).length;
  const newCount = (requests ?? []).filter((r) => r.status === "new").length;

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Booking Requests
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Your booking inbox. Respond fast to convert more gigs.
            </p>
          </div>

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

        {(!requests || requests.length === 0) && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <p className="text-base font-semibold text-white">No requests yet</p>
            <p className="mt-1 text-sm text-white/65">
              {activeStatus === "all"
                ? "When clients submit a booking request, it will show up here."
                : "No requests match this filter."}
            </p>

            {activeStatus === "all" ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {myPublicProfilePath ? (
                  <>
                    <Link
                      href={myPublicProfilePath}
                      className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/15"
                    >
                      View your public profile →
                    </Link>
                    <span className="text-xs text-white/55">
                      Share this link to get bookings faster.
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-white/55">
                    Tip: set your profile slug and publish to start receiving
                    requests.
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}

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

            const isNew = r.status === "new";

            const quoted = r.quoted_total ?? null;
            const platformFeeTotal = r.platform_fee_total ?? null;
            const platformFeePaid = r.platform_fee_paid ?? null;
            const feeDue =
              quoted != null && platformFeeTotal != null && platformFeePaid != null
                ? calcFeeDue(platformFeeTotal, platformFeePaid)
                : null;

            return (
              <li
                key={r.id}
                className={[
                  "rounded-3xl border p-6 transition",
                  isNew
                    ? "border-fuchsia-400/25 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.03]",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur",
                  "hover:-translate-y-[1px] hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">
                        {r.requester_name}
                      </p>
                      {isNew ? (
                        <span className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-fuchsia-200">
                          NEW
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-white/65">
                      {r.requester_email}
                    </p>
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
                    Submitted: {formatDateTime(r.created_at)}
                  </div>
                </div>

                {quoted != null ? (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-white/55">
                          DECLARED FINAL PRICE
                        </p>
                        <p className="mt-1 text-lg font-extrabold text-white">
                          ${quoted}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Minimum allowed is $450. This amount is used to compute SpinBook’s 10%.
                        </p>
                      </div>

                      {feeDue != null && feeDue > 0 ? (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                          <p className="text-xs font-semibold text-amber-200/90">
                            Platform fee due
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-amber-200">
                            ${feeDue}
                          </p>
                          <p className="mt-1 text-xs text-amber-200/75">
                            Deposit covers $80. Remaining fee is owed by DJ.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 rounded-3xl border border-white/10 bg-neutral-950/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">Deposit</p>
                        <span className={depositPillClasses(depositKind)}>
                          {depositLabel}
                          {r.deposit_paid ? (
                            <span className="opacity-90">✅</span>
                          ) : null}
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
                          <>Link is ready. We emailed the client to complete payment.</>
                        ) : r.status === "accepted" ? (
                          quoted != null ? (
                            <>Generate the $200 deposit link to secure this booking.</>
                          ) : (
                            <>Declare a final price first (min $450) to unlock deposit actions.</>
                          )
                        ) : (
                          <>Accept this request first to unlock deposit actions.</>
                        )}
                      </p>

                      <p className="mt-2 text-xs text-white/45">
                        Policy: $200 deposit is non-refundable if the client fails to pay the full balance 7 days before the event. Deposit split: $80 SpinBook / $120 DJ.
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
                      ) : r.status === "accepted" && quoted != null ? (
                        <form action={generateDepositLink}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40">
                            Generate $200 deposit link
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {r.status === "new" ? (
                    <>
                      <form
                        action={acceptAndQuote}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="requestId" value={r.id} />
                        <input
                          type="text"
                          name="quoted_total"
                          inputMode="numeric"
                          placeholder="Final price (min $450)"
                          className="h-11 w-44 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white placeholder:text-white/45 outline-none focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15"
                          required
                        />
                        <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400/40">
                          Accept & Quote
                        </button>
                      </form>

                      <form action={setStatus}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="status" value="declined" />
                        <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]">
                          Decline
                        </button>
                      </form>
                    </>
                  ) : null}

                  {(r.status === "accepted" || r.status === "declined") ? (
                    <form action={setStatus}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="status" value="closed" />
                      <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06]">
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
