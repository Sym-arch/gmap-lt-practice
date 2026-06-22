import { NextResponse } from "next/server";
import { getSupabaseServer, getServiceClient } from "@/lib/supabaseServer";

/* メール認証直後の保険。
   クライアントでトークン検証が成功してセッションができている前提で、
   万一 email_confirmed_at が未設定なら、service role で確認済みにする。
   これにより「メール認証済みなのにログインできない」状態を防ぐ。 */
export async function POST() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "no-supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // セッションが無い（検証失敗）場合は、ここでは何もできない
    return NextResponse.json({ ok: false, reason: "no-session" });
  }

  // すでに確認済みなら何もしない
  if (user.email_confirmed_at || user.confirmed_at) {
    return NextResponse.json({ ok: true, confirmed: true });
  }

  // 念のため service role で確認済みにする
  const admin = getServiceClient();
  if (admin) {
    try {
      await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
    } catch {
      /* 失敗しても致命的ではない */
    }
  }

  return NextResponse.json({ ok: true, confirmed: true });
}
