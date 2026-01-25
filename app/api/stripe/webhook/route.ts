import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

let stripeSingleton: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Do not crash at import/build time — only when the route is called.
    throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2025-12-15.clover",
    });
  }

  return stripeSingleton;
}

// Stripe sends raw body; Next must not parse JSON for webhooks.
// In App Router route handlers, we can read req.text() and pass it to Stripe.
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

    // ✅ Minimal event handling (safe to expand later)
    // If you want to mark deposit_paid in Supabase later, we can add it carefully.
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "payment_intent.succeeded": {
        // No-op for now.
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "Stripe webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
