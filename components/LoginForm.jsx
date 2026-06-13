"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { SITE_NAME } from "@/lib/site";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [tab, setTab] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const supabase = getSupabaseBrowser();

  async function submit(e) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        // 確認メールのリンクから戻る先を、現在のサイトURLに固定する
        // （Supabase側の Site URL が localhost のままでも、本番ドメインに戻ってこられる）
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/login?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo(
            "確認メールを送信しました。メール内のリンクをクリックしてから、ログインしてください。"
          );
        }
      }
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
      <h2 style={{ textAlign: "center" }}>{SITE_NAME}</h2>
      <div className="auth-tabs">
        <button
          className={`auth-tab ${tab === "login" ? "active" : ""}`}
          onClick={() => setTab("login")}
        >
          ログイン
        </button>
        <button
          className={`auth-tab ${tab === "signup" ? "active" : ""}`}
          onClick={() => setTab("signup")}
        >
          アカウント作成
        </button>
      </div>

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
          <label>パスワード（8文字以上）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />
        </div>
        {error && <div className="error-box">{error}</div>}
        {info && <div className="notice">{info}</div>}
        <button className="btn block" disabled={busy}>
          {busy ? "送信中…" : tab === "login" ? "ログイン" : "アカウントを作成"}
        </button>
      </form>
    </div>
  );
}

function toJaError(err) {
  const msg = (err && err.message) || "";
  if (msg.includes("Invalid login credentials"))
    return "メールアドレスまたはパスワードが正しくありません。";
  if (msg.includes("is invalid"))
    return "メールアドレスの形式が正しくありません。実際に受信できるアドレスを入力してください。";
  if (msg.includes("Email not confirmed"))
    return "メールアドレスが未確認です。受信した確認メールのリンクをクリックしてください。";
  if (msg.includes("already registered"))
    return "このメールアドレスはすでに登録されています。ログインしてください。";
  if (msg.includes("Password should be"))
    return "パスワードは8文字以上で設定してください。";
  if (msg.includes("rate limit"))
    return "試行回数が多すぎます。しばらく待ってからお試しください。";
  return "エラーが発生しました：" + msg;
}
