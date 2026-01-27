// FILE: app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

let stripeSingleton: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2025-12-15.clover",
    });
  }

  return stripeSingleton;
}

function calcPlatformFeeTotal(quotedTotal: number) {
  // 10% of declared final price
  return Math.ceil(quotedTotal * 0.1);
}

function clampNonNegative(n: number) {
  return n > 0 ? n : 0;
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET in environment variables." },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header." },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      const message =
        typeof err?.message === "string" ? err.message : "Webhook signature error";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // We only finalize the deposit when checkout session completes successfully.
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      // Pull booking_request_id + quoted_total from metadata
      const requestId = String(session?.metadata?.booking_request_id ?? "").trim();
      const quotedTotalRaw = String(session?.metadata?.quoted_total ?? "").trim();

      // Defensive parsing
      const quotedTotal = Number(quotedTotalRaw);
      const quotedTotalValid =
        Number.isFinite(quotedTotal) && quotedTotal > 0 ? Math.floor(quotedTotal) : null;

      // Deposit must be exactly $200.00
      const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
      const currency = String(session.currency ?? "").toLowerCase();

      // If this isn't our booking deposit, ignore safely
      if (!requestId) {
        return NextResponse.json({ received: true });
      }

      // If Stripe sends currency/amount we don't expect, do not mark paid.
      // (Still return 200 so Stripe doesn't keep retrying forever.)
      if (currency !== "usd" || amountTotal !== 20000) {
        return NextResponse.json({
          received: true,
          ignored: true,
          reason: "Unexpected deposit amount or currency",
        });
      }

      const supabase = await createClient();

      // Load current booking request to prevent double-processing
      const { data: existing, error: existingErr } = await supabase
        .from("booking_requests")
        .select(
          "id, deposit_paid, status, quoted_total, platform_fee_total, platform_fee_paid, fee_status"
        )
        .eq("id", requestId)
        .maybeSingle<{
          id: string;
          deposit_paid: boolean;
          status: string | null;
          quoted_total: number | null;
          platform_fee_total: number | null;
          platform_fee_paid: number | null;
          fee_status: string | null;
        }>();

      if (existingErr || !existing) {
        return NextResponse.json({ received: true, ignored: true, reason: "Request not found" });
      }

      // If already marked paid, idempotent exit
      if (existing.deposit_paid) {
        return NextResponse.json({ received: true, ok: true, idempotent: true });
      }

      // Prefer DB quoted_total, but allow metadata if DB is empty (shouldn't happen in your flow)
      const finalQuoted =
        typeof existing.quoted_total === "number" && existing.quoted_total > 0
          ? Math.floor(existing.quoted_total)
          : quotedTotalValid;

      // If we still can't compute final price, we can still mark deposit paid,
      // but fee math may remain incomplete.
      const platformFeeTotal =
        finalQuoted != null ? calcPlatformFeeTotal(finalQuoted) : existing.platform_fee_total;

      // Deposit split bookkeeping:
      // - $80 to SpinBook (counts as platform fee paid)
      // - $120 to DJ (informational; no DB field right now)
      const platformFeePaid = 80;

      const computedFeeDue =
        platformFeeTotal != null ? clampNonNegative(platformFeeTotal - platformFeePaid) : null;

      const feeStatus =
        platformFeeTotal == null
          ? existing.fee_status ?? "unknown"
          : computedFeeDue != null && computedFeeDue > 0
          ? "due"
          : "ok";

      // Update booking request
      await supabase
        .from("booking_requests")
        .update({
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),

          // Lock in fee bookkeeping (based on your rules)
          ...(finalQuoted != null ? { quoted_total: finalQuoted } : {}),
          ...(platformFeeTotal != null ? { platform_fee_total: platformFeeTotal } : {}),
          platform_fee_paid: platformFeePaid,
          fee_status: feeStatus,

          // Keep session id if present (useful for support/debug)
          stripe_checkout_session_id: session.id ?? existing.id,
        })
        .eq("id", requestId);

      return NextResponse.json({ received: true, ok: true });
    }

    // Ignore all other events for now
    return NextResponse.json({ received: true });
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "Stripe webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
