import Stripe from "stripe";

export const dynamic = "force-dynamic";

let stripeSingleton: Stripe | null = null;

/**
 * Lazy Stripe initializer:
 * - NEVER throws at import/build time
 * - Throws ONLY when you actually call the route (runtime) without env vars
 */
export function getStripe() {
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

/**
 * Backwards-compatible export:
 * Some files import { stripe } from "@/lib/stripe".
 * This Proxy delays Stripe initialization until a property is accessed.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const s = getStripe();
    // @ts-expect-error - dynamic proxy passthrough
    return s[prop];
  },
}) as Stripe;
