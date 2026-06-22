import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PRICE_YEN, SITE_NAME } from "@/lib/site";
import { getServiceClient } from "@/lib/supabaseServer";
import { isCampaignOpen, CAMPAIGN_TRIAL_DAYS } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/* POST /api/signup/start
   body: { full_name, furigana, university, email }
   Stripe Embedded Checkout のセッションを作成し、clientSecret を返す。
   ※ パスワードはこの時点では受け取らず、完了APIで受け取って auth.users 作成時に使う。 */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "決済が未設定です（STRIPE_SECRET_KEY）。" },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const last_name = String(body.last_name || "").trim();
  const first_name = String(body.first_name || "").trim();
  const university = String(body.university || "").trim();
  const email = String(body.email || "").trim();

  if (!last_name || !first_name || !university || !email) {
    return NextResponse.json({ error: "必須項目が未入力です。" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません。" },
      { status: 400 }
    );
  }

  // 既存ユーザーチェック（重複登録の防止）
  const svc = getServiceClient();
  if (svc) {
    const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
    const dup = data?.users?.some(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
    if (dup) {
      return NextResponse.json(
        {
          error:
            "このメールアドレスはすでに登録されています。ログイン画面からログインしてください。",
        },
        { status: 409 }
      );
    }
  }

  // 先着100名・初月無料キャンペーン：枠が残っていればトライアルを付与
  const campaignOpen = await isCampaignOpen();

  const stripe = new Stripe(secretKey);

  const subscriptionData = {
    metadata: { email, last_name, first_name, university },
  };
  if (campaignOpen) {
    // 30日間の無料トライアル（カードは登録するが初月は課金されない）
    subscriptionData.trial_period_days = CAMPAIGN_TRIAL_DAYS;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: PRICE_YEN,
          recurring: { interval: "month" }, // 月額課金
          product_data: {
            name: SITE_NAME,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    // 作成されるサブスクリプションにもメタデータを持たせ、Webhookでの突合に使う
    subscription_data: subscriptionData,
    metadata: {
      email,
      last_name,
      first_name,
      university,
    },
  });

  return NextResponse.json({
    clientSecret: session.client_secret,
    sessionId: session.id,
    trial: campaignOpen,
  });
}
