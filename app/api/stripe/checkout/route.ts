import { NextResponse } from "next/server";
import Stripe from "stripe";

// We keep Stripe init server-only. Requires STRIPE_SECRET_KEY in env.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil", // if this errors, we’ll downgrade to your installed stripe api version
});

type CheckoutRequestBody = {
  amount: number; // in dollars (or main currency unit), e.g. 150
  currency?: string; // default: "usd"
  djSlug?: string; // optional, used for success/cancel redirect
  bookingRequestId?: string; // optional metadata
  customerEmail?: string; // optional
};

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY in environment variables." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CheckoutRequestBody;

    const currency = (body.currency || "usd").toLowerCase();
    const amount = body.amount;

    // Basic validation (low-risk)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Provide a positive number (e.g. 150)." },
        { status: 400 }
      );
    }

    // Stripe expects amounts in the smallest currency unit (cents for USD)
    const unitAmount = Math.round(amount * 100);

    // Build redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const djSlug = body.djSlug?.trim();

    const successUrl = djSlug
      ? `${origin}/dj/${djSlug}/book?ok=1&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/?ok=1&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = djSlug
      ? `${origin}/dj/${djSlug}/book?ok=0`
      : `${origin}/?ok=0`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: djSlug ? `Booking deposit — ${djSlug}` : "Booking deposit",
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: body.customerEmail || undefined,
      metadata: {
        djSlug: djSlug || "",
        bookingRequestId: body.bookingRequestId || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "Stripe checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
