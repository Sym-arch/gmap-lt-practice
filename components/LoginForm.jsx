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
          未設定のため、ログイン機能は無効になっています。
        </div>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2 style={{ textAlign: "center" }}>{SITE_NAME}にログイン</h2>

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
