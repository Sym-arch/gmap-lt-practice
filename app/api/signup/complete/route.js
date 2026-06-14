import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* POST /api/signup/complete
   body: { sessionId, password }
   Stripeセッションが「決済済み」であることを検証し、
   Supabaseユーザーを作成（メール認証メールが自動送信される）＋ purchases に記録。 */
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
  const password = String(body.password || "");
  if (!sessionId || !password) {
    return NextResponse.json(
      { error: "セッション情報またはパスワードが不足しています。" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で設定してください。" },
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

  // メール認証は行わない（Supabase側で Confirm email を OFF にしておく）。
  // 決済済み＝本人のメール所有は確認済みとみなし、そのまま登録する。
  let userId = null;
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      last_name: md.last_name || "",
      first_name: md.first_name || "",
      full_name: `${md.last_name || ""} ${md.first_name || ""}`.trim(),
      university: md.university || "",
    },
  });

  if (createErr && createErr.code !== "email_exists") {
    return NextResponse.json(
      { error: "アカウント作成に失敗しました。" },
      { status: 500 }
    );
  }

  if (created && created.user) {
    userId = created.user.id;
  } else {
    // 既存ユーザーが居る場合：そのIDを引き当てて purchases だけ追加
    const { data: list } = await svc.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = list?.users?.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
    if (found) userId = found.id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "アカウント作成に失敗しました。" },
      { status: 500 }
    );
  }

  // 会員情報を profiles に直接保存（email_confirm: true だとトリガーは発火しないため）
  await svc.from("profiles").upsert(
    {
      id: userId,
      last_name: md.last_name || "",
      first_name: md.first_name || "",
      university: md.university || "",
      email,
    },
    { onConflict: "id" }
  );

  // 購入記録（重複防止のため session_id でUPSERT）
  await svc.from("purchases").upsert(
    {
      user_id: userId,
      product: "all_access",
      stripe_session_id: session.id,
    },
    { onConflict: "stripe_session_id" }
  );

  return NextResponse.json({ ok: true, email });
}
