import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const stripe = new Stripe(stripeSecretKey);
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing Stripe signature", { status: 400 });
    }

    // IMPORTANT: use raw body for signature verification
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
    } catch (err: any) {
      return new Response(`Webhook signature verification failed: ${err?.message ?? "unknown"}`, {
        status: 400,
      });
    }

    // Service role client (webhook is not a logged-in user)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Handle completed checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingRequestId = session.metadata?.booking_request_id ?? null;
      const sessionId = session.id;

      // We update by booking_request_id if available; otherwise fallback to session id.
      if (bookingRequestId) {
        const { error } = await supabaseAdmin
          .from("booking_requests")
          .update({
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
            stripe_checkout_session_id: sessionId,
          })
          .eq("id", bookingRequestId);

        if (error) {
          return new Response(`Supabase update failed: ${error.message}`, { status: 500 });
        }
      } else {
        // Fallback: if metadata missing, try match by session id (if it was stored earlier)
        const { error } = await supabaseAdmin
          .from("booking_requests")
          .update({
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", sessionId);

        if (error) {
          return new Response(`Supabase update failed: ${error.message}`, { status: 500 });
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    return new Response(`Webhook error: ${err?.message ?? "unknown"}`, { status: 500 });
  }
}
