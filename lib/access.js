import { getSupabaseServer } from "@/lib/supabaseServer";

/* ログイン中ユーザーと、アクセス可否（premium）を返す。
   ユーザー管理は subscriptions テーブルに一本化。
   plan = 'master' → 無条件 premium（運営者用）
   plan = 'monitor' | 'normal' → status が active/trialing かつ期限内ならアクセス許可 */
export async function getAccess() {
  const supabase = await getSupabaseServer();
  if (!supabase) return { user: null, premium: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, premium: false };

  // 環境変数の許可リストは master 扱い
  const allowList = (process.env.PREMIUM_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && allowList.includes(user.email.toLowerCase())) {
    return { user, premium: true };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plan")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub) return { user, premium: false };

  // DB 上の master プランも無条件プレミアム
  if (sub.plan === "master") return { user, premium: true };

  const isActive =
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  return { user, premium: isActive };
}
