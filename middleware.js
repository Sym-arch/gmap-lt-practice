import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/* Supabase 公式の標準パターン（@supabase/ssr）。
   各リクエストでセッショントークンをリフレッシュし、更新後のCookieを
   ブラウザとサーバーコンポーネント／ルートハンドラの双方に渡す。
   これが無いと、ログイン直後にサーバー側で getUser() がユーザーを
   認識できず「未ログイン」状態に戻ってしまう。 */
export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // 環境変数が未設定なら認証は無効。素通りさせる。
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 重要：getUser() を呼ぶことでトークンが必要に応じてリフレッシュされ、
  // 新しいCookieが setAll を通じてレスポンスに書き込まれる。
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // 静的アセット・画像以外のすべてのルートで実行
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
