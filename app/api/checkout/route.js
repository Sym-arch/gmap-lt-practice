import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAccess } from "@/lib/access";
import { PRICE_YEN, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

/* POST /api/checkout — Stripe Checkoutセッションを作成して決済ページURLを返す */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "決済が未設定です。環境変数 STRIPE_SECRET_KEY を設定してください。" },
      { status: 503 }
    );
  }

  const { user, premium } = await getAccess();
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  if (premium) {
    return NextResponse.json({ error: "already_purchased" }, { status: 409 });
  }

  const stripe = new Stripe(secretKey);
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: PRICE_YEN, // JPYは最小単位が1円
          product_data: {
            name: `${SITE_NAME} 会員プラン`,
            description: "GMAP(LT)・TG-WEB・玉手箱・SPI3 模擬試験 全回アクセス（買い切り）",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade`,
  });

  return NextResponse.json({ url: session.url });
}
