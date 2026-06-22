import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer, getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* ログイン中ユーザーの Stripe カスタマーポータルのセッションを作成し、URLを返す。
   ユーザーはここから支払い方法の変更や解約を自分で行える。 */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "決済が未設定です。" }, { status: 503 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "認証が未設定です。" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // service role でサブスク行から stripe_customer_id を取得
  const svc = getServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "サーバー設定が未完了です。" }, { status: 503 });
  }
  const { data: rows } = await svc
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1);
  const customerId = rows && rows[0] && rows[0].stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: "有効なサブスクリプションが見つかりません。" },
      { status: 404 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get("origin") ||
    new URL(req.url).origin;

  const stripe = new Stripe(secretKey);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile`,
  });

  return NextResponse.json({ url: portal.url });
}
