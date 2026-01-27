// FILE: lib/stripe.ts
import Stripe from "stripe";

/**
 * SpinBook HQ – Stripe client
 *
 * Notes:
 * - Uses a fixed, stable Stripe API version (no preview/beta versions)
 * - All Checkout + Webhook logic relies on this single instance
 * - Deposit logic ($200 split tracking) is handled at the app/webhook layer,
 *   not inside this client
 */

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}

export const stripe = new Stripe(key, {
  apiVersion: "2024-11-20",
});
