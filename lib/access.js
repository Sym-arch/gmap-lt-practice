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

  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  return { user, premium: !!(data && data.length > 0) };
}
