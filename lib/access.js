import { getSupabaseServer } from "@/lib/supabaseServer";

/* ログイン中ユーザーと、プレミアム（購入済み）かどうかを返す。
   PREMIUM_EMAILS に載っているメールアドレスは購入なしで全問アクセス可（運営者用）。 */
export async function getAccess() {
  const supabase = await getSupabaseServer();
  if (!supabase) return { user: null, premium: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, premium: false };

  const allowList = (process.env.PREMIUM_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && allowList.includes(user.email.toLowerCase())) {
    return { user, premium: true };
  }

  // 1) サブスクが有効か（active / trialing かつ 次回更新日が未来）
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .limit(1);
  const sub = subs && subs[0];
  const subActive =
    sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
  if (subActive) return { user, premium: true };

  // 2) 旧・買い切り購入者は引き続き利用可（グランドファザリング）
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  return { user, premium: !!(purchases && purchases.length > 0) };
}
