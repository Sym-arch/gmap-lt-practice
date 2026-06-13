import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAccess } from "@/lib/access";
import { PRICE_YEN, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

/* POST /api/checkout — Stripe Checkoutセッションを作成して決済ページURLを返す
   未ログインユーザーも利用可能。body の email を Stripe Checkout に渡して、
   決済成功時の Webhook（または成功ページ）で Supabase アカウントを自動作成する。 */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "決済が未設定です。環境変数 STRIPE_SECRET_KEY を設定してください。" },
      { status: 503 }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* body 無しでも進める（既存ログインユーザー用） */
  }

  const { user, premium } = await getAccess();
  if (premium) {
    return NextResponse.json({ error: "already_purchased" }, { status: 409 });
  }

  // ログイン済みなら本人のメールを優先、未ログインなら入力されたメールを使う
  const email = (user && user.email) || (typeof body.email === "string" ? body.email.trim() : "");
  if (!email) {
    return NextResponse.json(
      { error: "メールアドレスを入力してください。" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません。" },
      { status: 400 }
    );
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
    customer_email: email,
    client_reference_id: user ? user.id : undefined,
    metadata: {
      email,
      user_id: user ? user.id : "",
    },
    success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade`,
  });

  return NextResponse.json({ url: session.url });
}
