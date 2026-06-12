import { NextResponse } from "next/server";
import Stripe from "stripe";
import { grantPurchase } from "@/lib/purchases";

export const dynamic = "force-dynamic";

/* Stripe Webhook（checkout.session.completed で購入記録を保存）。
   成功ページ側でも付与するため、これは取りこぼし防止の保険でもある。 */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await grantPurchase(session);
    }
  }

  return NextResponse.json({ received: true });
}
