import { getServiceClient } from "@/lib/supabaseServer";

/* Stripe Checkout の決済完了から、ユーザー作成＋購入記録の保存をまとめて行う。
   返り値： { ok, status, email, invited }
   - ok      : 全体として成功したか
   - status  : "created" / "existing" / "no_email" / "no_service" / "error"
   - email   : Stripe Customer のメール
   - invited : 招待メール（パスワード設定リンク）を送信したか */
export async function grantPurchase(session) {
  const svc = getServiceClient();
  if (!svc) return { ok: false, status: "no_service" };

  // 1) メールを Stripe Session から抽出
  const email =
    (session.customer_details && session.customer_details.email) ||
    session.customer_email ||
    (session.metadata && session.metadata.email) ||
    null;
  if (!email) return { ok: false, status: "no_email" };

  // 2) 既存ユーザー（事前ログイン or 既に登録済）を探す
  let userId =
    (session.metadata && session.metadata.user_id) ||
    session.client_reference_id ||
    null;
  let status = "existing";
  let invited = false;

  if (!userId) {
    // ページネーション最初の1ページで該当メールを検索
    const { data: existing } = await svc.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing?.users?.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
    if (found) {
      userId = found.id;
    } else {
      // 3) 新規ユーザーを inviteUserByEmail で作成
      //    招待メールに含まれるリンクをクリックすると、パスワード設定画面が出る
      const origin = process.env.NEXT_PUBLIC_SITE_URL || undefined;
      const { data: inv, error: invErr } =
        await svc.auth.admin.inviteUserByEmail(email, {
          redirectTo: origin ? `${origin}/login` : undefined,
        });
      if (invErr || !inv || !inv.user) {
        return { ok: false, status: "error", email };
      }
      userId = inv.user.id;
      status = "created";
      invited = true;
    }
  }

  // 4) 購入記録を保存（同じ session_id で重複しない）
  const { error: purchaseErr } = await svc.from("purchases").upsert(
    {
      user_id: userId,
      product: "all_access",
      stripe_session_id: session.id,
    },
    { onConflict: "stripe_session_id" }
  );
  if (purchaseErr) {
    return { ok: false, status: "error", email, invited };
  }

  return { ok: true, status, email, invited };
}
