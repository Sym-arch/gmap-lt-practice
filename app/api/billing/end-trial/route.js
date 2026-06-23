import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer, getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* POST /api/billing/end-trial
   トライアル（モニタープラン）を即時終了し、通常月額課金を開始する。
   - trial_end: "now" を設定することで当日から課金が始まる
   - Stripe Webhook が subscription.updated を受け取り subscriptions テーブルを更新する */
export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "決済が未設定です。" }, { status: 503 });

  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "認証が未設定です。" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "サーバー設定が未完了です。" }, { status: 503 });

  const { data: rows } = await svc
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .limit(1);

  const sub = rows?.[0];
  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: "有効なサブスクリプションが見つかりません。" }, { status: 404 });
  }
  if (sub.status !== "trialing") {
    return NextResponse.json({ error: "現在トライアル中のプランがありません。" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    trial_end: "now",
  });

  return NextResponse.json({ ok: true });
}
