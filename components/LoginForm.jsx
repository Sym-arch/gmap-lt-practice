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
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(toJaError(err));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/login?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(toJaError(err));
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

  if (!supabase) {
    return (
      <div className="card auth-card">
        <h2>ログイン機能は準備中です</h2>
        <div className="notice">
          Supabaseの環境変数（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）が
          未設定のため、ログイン・購入機能は無効になっています。設定方法はREADMEをご覧ください。
        </div>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2 style={{ textAlign: "center" }}>{SITE_NAME}にログイン</h2>

      <button
        type="button"
        className="google-btn"
        onClick={googleSignIn}
        disabled={busy}
      >
        <GoogleIcon />
        <span>Googleでログイン</span>
      </button>

      <div className="auth-divider"><span>または</span></div>

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
        まだアカウントをお持ちでない方は<br />
        <Link href="/upgrade">こちらから会員登録</Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.27-1.7V4.97H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
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
    return "メールアドレスが未確認です。受信した確認メールのリンクをクリックしてください。";
  if (msg.includes("rate limit"))
    return "試行回数が多すぎます。しばらく待ってからお試しください。";
  return "エラーが発生しました：" + msg;
}
