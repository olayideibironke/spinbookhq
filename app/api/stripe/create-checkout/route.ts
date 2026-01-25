import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type Body = { rid?: string };

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const rid = String(body.rid ?? "").trim();

    if (!rid) {
      return NextResponse.json({ error: "Missing rid" }, { status: 400 });
    }

    // Confirm this booking belongs to the logged-in DJ
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, status, checkout_url, deposit_paid")
      .eq("id", rid)
      .eq("dj_user_id", user.id)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking request not found" },
        { status: 404 }
      );
    }

    // If already paid, no need to create another checkout
    if (booking.deposit_paid) {
      return NextResponse.json(
        { error: "Deposit already paid", deposit_paid: true },
        { status: 409 }
      );
    }

    // If a checkout link already exists, reuse it
    if (booking.checkout_url) {
      return NextResponse.json(
        { url: booking.checkout_url, reused: true },
        { status: 200 }
      );
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    // ✅ Lazy init Stripe ONLY inside the handler
    const stripe = getStripe();

    // Create Stripe Checkout Session ($50 deposit)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DJ Booking Deposit",
              description: `Deposit for booking request ${rid}`,
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        rid, // ✅ this is what the webhook needs
      },
      success_url: `${origin}/book/success?rid=${encodeURIComponent(rid)}`,
      cancel_url: `${origin}/book/cancel?rid=${encodeURIComponent(rid)}`,
    });

    const checkoutUrl = session.url ?? null;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    // Save checkout info
    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({
        checkout_url: checkoutUrl,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", rid)
      .eq("dj_user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl, reused: false }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error creating checkout session" },
      { status: 500 }
    );
  }
}
