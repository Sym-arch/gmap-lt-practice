import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabaseServer";
import { saveSubscriptionFromSession } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/* POST /api/signup/complete
   body: { sessionId }
   アカウント作成はクライアント側の supabase.auth.signUp で行う（Supabaseが認証メールを送る）。
   このAPIは、決済が「支払い済み」であることを検証し、作成済みユーザーに purchases を紐づける。
   ※ プロフィール（氏名・大学）は、メール認証完了時にトリガーが user_metadata から profiles へ転記する。 */
export async function POST(req) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "決済が未設定です（STRIPE_SECRET_KEY）。" },
      { status: 503 }
    );
  }

  const svc = getServiceClient();
  if (!svc) {
    return NextResponse.json(
      { error: "サーバーの認証設定が未完了です。" },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const sessionId = String(body.sessionId || "");
  if (!sessionId) {
    return NextResponse.json(
      { error: "セッション情報が不足しています。" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json(
      { error: "決済セッションの確認に失敗しました。" },
      { status: 400 }
    );
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "決済が完了していません。" },
      { status: 402 }
    );
  }

  const md = session.metadata || {};
  const email =
    (session.customer_details && session.customer_details.email) ||
    session.customer_email ||
    md.email ||
    "";
  if (!email) {
    return NextResponse.json(
      { error: "メールアドレスが取得できませんでした。" },
      { status: 400 }
    );
  }

  // クライアントの signUp で作成されたユーザーを引き当てる
  const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );
  if (!found) {
    // signUp 直後でまだ反映されていない等。購入は session に紐づけて後で復旧可能。
    return NextResponse.json(
      { ok: false, reason: "user_not_found_yet", email },
      { status: 202 }
    );
  }

  // メール認証を不要化：Stripe決済を通ったユーザーは、この決済確定タイミングで
  // 確実に email_confirmed_at を埋めてログイン可能にする（Supabaseの設定に依存しない）。
  if (!found.email_confirmed_at && !found.confirmed_at) {
    try {
      await svc.auth.admin.updateUserById(found.id, { email_confirm: true });
    } catch {
      /* 失敗しても後続のパスワードログインで再試行される */
    }
  }

  // サブスク契約をユーザーに紐づけて保存（以降の更新・解約は Webhook が反映する）
  await saveSubscriptionFromSession(session, stripe, found.id);

  return NextResponse.json({ ok: true, email });
}
