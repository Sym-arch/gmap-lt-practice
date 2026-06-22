import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  recordSubscriptionFromSession,
  updateSubscriptionFromStripe,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/* Stripe Webhook（サブスクリプションのライフサイクルを subscriptions テーブルへ反映）。
   - checkout.session.completed : 初回契約の保存（取りこぼし防止の保険）
   - customer.subscription.updated/deleted : 更新・解約・支払い失敗による状態変化を反映
   解約や支払い失敗で status が active/trialing でなくなると、アクセスが自動で止まる。 */
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.payment_status === "paid") {
        await recordSubscriptionFromSession(session, stripe);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // status（active / canceled / past_due 等）と次回更新日を反映
      await updateSubscriptionFromStripe(event.data.object);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
