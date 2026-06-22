import { getServiceClient } from "@/lib/supabaseServer";

/* サブスクリプション状態の保存・更新ユーティリティ。
   subscriptions テーブル（user_id 主キー / stripe_subscription_id ユニーク）に対して
   - 初回：決済完了時に user_id を引き当てて upsert（saveSubscriptionForUser）
   - 以降：Webhookの subscription.* イベントで stripe_subscription_id を使って更新 */

/* アクセスを許可する状態かどうか */
export function isActiveStatus(status) {
  return status === "active" || status === "trialing";
}

function periodEndIso(sub) {
  return sub?.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;
}

/* 決済完了直後：Checkout Session から Subscription を引いて、user_id に紐づけて保存する。 */
export async function saveSubscriptionFromSession(session, stripe, userId) {
  const svc = getServiceClient();
  if (!svc || !userId) return { ok: false };

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) return { ok: false, reason: "no_subscription" };

  let sub;
  try {
    sub = await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return { ok: false, reason: "retrieve_failed" };
  }

  const { error } = await svc.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null,
      stripe_subscription_id: subscriptionId,
      status: sub.status,
      current_period_end: periodEndIso(sub),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return { ok: !error };
}

/* Webhookの checkout.session.completed から（取りこぼし防止）。
   メールでユーザーを引き当て（無ければ招待で作成）、サブスクを保存する。 */
export async function recordSubscriptionFromSession(session, stripe) {
  const svc = getServiceClient();
  if (!svc) return { ok: false, status: "no_service" };

  const email =
    (session.customer_details && session.customer_details.email) ||
    session.customer_email ||
    (session.metadata && session.metadata.email) ||
    null;
  if (!email) return { ok: false, status: "no_email" };

  let userId =
    (session.metadata && session.metadata.user_id) ||
    session.client_reference_id ||
    null;

  if (!userId) {
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
      // 決済は通ったがユーザー未作成の保険：招待で作成
      const origin = process.env.NEXT_PUBLIC_SITE_URL || undefined;
      const { data: inv } = await svc.auth.admin.inviteUserByEmail(email, {
        redirectTo: origin ? `${origin}/login` : undefined,
      });
      userId = inv?.user?.id || null;
    }
  }
  if (!userId) return { ok: false, status: "no_user" };

  return saveSubscriptionFromSession(session, stripe, userId);
}

/* Webhookの customer.subscription.* から、サブスクID基準で状態を更新する。 */
export async function updateSubscriptionFromStripe(sub) {
  const svc = getServiceClient();
  if (!svc || !sub?.id) return { ok: false };

  const { error } = await svc
    .from("subscriptions")
    .update({
      status: sub.status,
      current_period_end: periodEndIso(sub),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);
  return { ok: !error };
}
