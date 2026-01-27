// FILE: lib/stripe.ts
import Stripe from "stripe";

/**
 * SpinBook HQ – Stripe client
 *
 * Notes:
 * - Uses the Stripe API version required by the installed Stripe SDK types
 * - Safe for Next.js build (no preview/beta mismatch)
 * - All Checkout + Webhook logic relies on this single instance
 * - Deposit logic ($200 split tracking) is handled at the app/webhook layer,
 *   not inside this client
 */

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}

export const stripe = new Stripe(key, {
  apiVersion: "2025-12-15.clover",
});
