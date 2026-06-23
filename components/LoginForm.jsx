"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { SITE_NAME } from "@/lib/site";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseBrowser();

  async function submit(e) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // SPA ナビゲーションではキャッシュの影響でセッションが認識されないため
      // ハードナビゲーションでサーバーに Cookie を確実に送る
      window.location.href = next;
    } catch (err) {
      setError(toJaError(err));
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!supabase) return;
    if (!email) {
      setError("パスワード再設定リンクを送るメールアドレスを入力してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/login`,
      });
      if (error) throw error;
      setError("パスワード再設定のメールを送信しました。受信箱をご確認ください。");
    } catch (err) {
      setError(toJaError(err));
    } finally {
      setBusy(false);
    }
  }

  async function loginWithGoogle() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? window.location.origin + next
          : undefined,
      },
    });
    setBusy(false);
  }

  if (!supabase) {
    return (
      <div className="card auth-card">
        <h2>ログイン機能は準備中です</h2>
        <div className="notice">
          Supabaseの環境変数（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）が
          未設定のため、ログイン機能は無効になっています。
        </div>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2 style={{ textAlign: "center" }}>{SITE_NAME}にログイン</h2>

      <button
        type="button"
        className="btn-google"
        onClick={loginWithGoogle}
        disabled={busy}
      >
        <GoogleIcon />
        Google アカウントでログイン
      </button>
      <div className="divider-or"><span>または</span></div>

      <form onSubmit={submit}>
        <div className="field">
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="btn block" disabled={busy}>
          {busy ? "送信中…" : "ログイン"}
        </button>
      </form>

      <button type="button" className="link-btn" onClick={forgotPassword}>
        パスワードをお忘れの方
      </button>

      <div className="auth-foot">
        まだアカウントをお持ちでない方は
        <br />
        <Link href="/signup">こちらから会員登録</Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function toJaError(err) {
  const msg = (err && err.message) || "";
  if (msg.includes("Invalid login credentials"))
    return "メールアドレスまたはパスワードが正しくありません。";
  if (msg.includes("is invalid"))
    return "メールアドレスの形式が正しくありません。";
  if (msg.includes("Email not confirmed"))
    return "メール認証が完了していません。受信した認証メールのリンクをクリックしてからログインしてください。";
  if (msg.includes("rate limit"))
    return "試行回数が多すぎます。しばらく待ってからお試しください。";
  return "エラーが発生しました：" + msg;
}
