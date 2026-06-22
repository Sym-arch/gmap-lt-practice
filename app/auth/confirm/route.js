import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/* メール認証リンク（token_hash 方式）をサーバー側で検証する正規ルート。
   - 別端末でメールを開いても確実に動く（PKCEのcode方式と違いローカル検証情報に依存しない）
   - 検証成功時はサーバーでセッションCookieをセットし、そのままログイン状態で next へ遷移
   Supabaseのメールテンプレートを次の形にしておくこと：
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/ */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "email";
  const next = sanitizeNext(searchParams.get("next"));

  let verified = false;
  if (tokenHash) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      verified = !error;
    }
  }

  // redirect() は内部で例外を投げるため try/catch の外で呼ぶ
  if (verified) redirect(next);
  redirect("/auth/confirmed?error=verify");
}

/* オープンリダイレクト防止：サイト内の相対パスのみ許可 */
function sanitizeNext(next) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}
